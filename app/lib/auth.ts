import { supabase } from "./supabase"
import { withTimeout, withRetry, AbortablePromise, TimeoutError, RetryError, connectivity } from "./utils"

export interface Usuario {
  id: string
  auth_id?: string
  nome: string
  email: string
  loja_id: string
  loja_nome?: string
  loja_codigo?: string
  permissoes: string[]
  ativo: boolean
}

export class AuthError extends Error {
  constructor(message: string, public code?: string, public originalError?: any) {
    super(message)
    this.name = 'AuthError'
  }
}

// Estados de autenticação
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

export interface AuthStatus {
  state: AuthState
  user: Usuario | null
  error: string | null
  isConnected: boolean
}

export const authService = {
  // Operações ativas para cleanup
  private activeOperations: Set<AbortablePromise<any>> = new Set(),

  // Fazer login com retry e timeout
  async login(email: string, password: string): Promise<{ user: Usuario; session: any }> {
    return withRetry(async () => {
      console.log("Tentando login para:", email)

      if (!connectivity.isOnline()) {
        throw new AuthError("Sem conexão com a internet", "OFFLINE")
      }

      // Login com timeout de 10 segundos
      const loginResult = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000,
        "Timeout no login - verifique sua conexão"
      )

      const { data, error } = loginResult

      if (error) {
        throw new AuthError(
          this.getErrorMessage(error),
          error.message,
          error
        )
      }

      if (!data.user) {
        throw new AuthError("Login falhou - usuário não encontrado", "NO_USER")
      }

      console.log("Login realizado, obtendo dados do usuário...")
      
      // Obter usuário completo com timeout separado
      const usuario = await this.obterUsuarioCompleto(data.user.id)
      
      return { user: usuario, session: data.session }
    }, {
      maxRetries: 2,
      baseDelay: 1000,
      timeout: 15000,
      shouldRetry: (error) => {
        // Não fazer retry para credenciais inválidas
        return !error.message?.includes('Invalid login credentials') &&
               !error.message?.includes('Email not confirmed') &&
               error.name !== 'AuthError'
      }
    })
  },

  // Obter usuário completo com retry robusto
  async obterUsuarioCompleto(authId: string): Promise<Usuario> {
    return withRetry(async () => {
      console.log("Obtendo dados completos do usuário...")

      // Primeira tentativa: buscar por auth_id
      const usuarioPorAuthId = await withTimeout(
        supabase
          .from("usuarios")
          .select(`
            *,
            lojas (
              id,
              nome,
              codigo
            )
          `)
          .eq("auth_id", authId)
          .single(),
        8000,
        "Timeout ao buscar usuário por auth_id"
      )

      let data = usuarioPorAuthId.data
      let error = usuarioPorAuthId.error

      // Segunda tentativa: buscar por email se não encontrou por auth_id
      if (error && error.code === 'PGRST116') { // Not found
        console.log("Usuário não encontrado por auth_id, tentando por email...")
        
        const authUser = await withTimeout(
          supabase.auth.getUser(),
          5000,
          "Timeout ao obter dados de autenticação"
        )

        if (!authUser.data?.user?.email) {
          throw new AuthError("Email do usuário não disponível", "NO_EMAIL")
        }

        const usuarioPorEmail = await withTimeout(
          supabase
            .from("usuarios")
            .select(`
              *,
              lojas (
                id,
                nome,
                codigo
              )
            `)
            .eq("email", authUser.data.user.email)
            .single(),
          8000,
          "Timeout ao buscar usuário por email"
        )

        data = usuarioPorEmail.data
        error = usuarioPorEmail.error

        // Atualizar auth_id se encontrou o usuário por email
        if (!error && data && !data.auth_id) {
          console.log("Atualizando auth_id do usuário...")
          try {
            await withTimeout(
              supabase
                .from("usuarios")
                .update({ auth_id: authId })
                .eq("id", data.id),
              5000,
              "Timeout ao atualizar auth_id"
            )
            data.auth_id = authId
          } catch (updateError) {
            console.warn("Falha ao atualizar auth_id, mas continuando:", updateError)
          }
        }
      }

      if (error || !data) {
        const message = error?.code === 'PGRST116' 
          ? "Usuário não encontrado na base de dados"
          : `Erro ao buscar usuário: ${error?.message || 'Desconhecido'}`
        
        throw new AuthError(message, error?.code, error)
      }

      if (!data.ativo) {
        throw new AuthError("Usuário inativo", "USER_INACTIVE")
      }

      return {
        id: data.id,
        auth_id: data.auth_id || authId,
        nome: data.nome,
        email: data.email,
        loja_id: data.loja_id,
        loja_nome: data.lojas?.nome,
        loja_codigo: data.lojas?.codigo,
        permissoes: data.permissoes || [],
        ativo: data.ativo,
      }
    }, {
      maxRetries: 2,
      baseDelay: 1500,
      timeout: 20000
    })
  },

  // Obter usuário atual com timeout
  async obterUsuarioAtual(): Promise<Usuario | null> {
    try {
      const userResult = await withTimeout(
        supabase.auth.getUser(),
        8000,
        "Timeout ao obter usuário atual"
      )
      
      if (!userResult.data?.user) return null
      
      return await this.obterUsuarioCompleto(userResult.data.user.id)
    } catch (error) {
      console.error("Erro ao obter usuário atual:", error)
      return null
    }
  },

  // Fazer logout com timeout
  async logout(): Promise<void> {
    try {
      // Limpar operações ativas
      this.abortAllOperations()
      
      await withTimeout(
        supabase.auth.signOut(),
        5000,
        "Timeout no logout"
      )
    } catch (error) {
      console.error("Erro no logout:", error)
      // Mesmo com erro, limpar estado local
      throw new AuthError("Erro ao fazer logout", "LOGOUT_ERROR", error)
    }
  },

  // Verificar sessão com refresh automático e timeout
  async verificarSessao(): Promise<any> {
    return withRetry(async () => {
      console.log("Verificando sessão...")

      const sessionResult = await withTimeout(
        supabase.auth.getSession(),
        8000,
        "Timeout ao verificar sessão"
      )

      const { data, error } = sessionResult
      
      if (error) {
        throw new AuthError("Erro ao verificar sessão", "SESSION_ERROR", error)
      }

      const session = data.session
      
      if (!session) {
        console.log("Nenhuma sessão encontrada")
        return null
      }

      // Verificar se a sessão está próxima do vencimento
      if (this.isSessionExpiringSoon(session)) {
        console.log("Sessão próxima do vencimento, tentando refresh...")
        
        try {
          const refreshResult = await withTimeout(
            supabase.auth.refreshSession(),
            10000,
            "Timeout no refresh da sessão"
          )
          
          if (refreshResult.data?.session) {
            console.log("Sessão renovada com sucesso")
            return refreshResult.data.session
          } else {
            console.warn("Refresh da sessão retornou null, usando sessão atual")
            return session
          }
        } catch (refreshError) {
          console.warn("Falha no refresh da sessão, usando sessão atual:", refreshError)
          return session
        }
      }

      return session
    }, {
      maxRetries: 2,
      baseDelay: 1000,
      timeout: 15000,
      shouldRetry: (error) => {
        // Retry apenas para erros de rede/timeout
        return error.name === 'TimeoutError' || 
               error.message?.includes('network') ||
               error.message?.includes('fetch')
      }
    })
  },

  // Verificar se a sessão está próxima do vencimento (5 minutos)
  isSessionExpiringSoon(session: any): boolean {
    if (!session?.expires_at) return false
    const expiresAt = new Date(session.expires_at * 1000)
    const now = new Date()
    const fiveMinutes = 5 * 60 * 1000
    return (expiresAt.getTime() - now.getTime()) < fiveMinutes
  },

  // Refresh manual da sessão
  async refreshSession(): Promise<any> {
    try {
      const refreshResult = await withTimeout(
        supabase.auth.refreshSession(),
        10000,
        "Timeout no refresh da sessão"
      )
      
      if (refreshResult.error) {
        throw new AuthError("Erro no refresh da sessão", "REFRESH_ERROR", refreshResult.error)
      }
      
      return refreshResult.data.session
    } catch (error) {
      console.error("Erro ao fazer refresh da sessão:", error)
      throw error
    }
  },

  // Escutar mudanças de estado com cleanup melhorado
  onAuthStateChange(callback: (event: string, session: any) => void) {
    let isActive = true
    
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      if (isActive) {
        try {
          callback(event, session)
        } catch (error) {
          console.error("Erro no callback de auth state change:", error)
        }
      }
    })

    // Retornar objeto com unsubscribe melhorado
    return {
      unsubscribe: () => {
        isActive = false
        subscription.data.unsubscribe()
      }
    }
  },

  // Abortar todas as operações ativas
  abortAllOperations() {
    console.log(`Abortando ${this.activeOperations.size} operações ativas`)
    this.activeOperations.forEach(operation => {
      try {
        operation.abort()
      } catch (error) {
        console.warn("Erro ao abortar operação:", error)
      }
    })
    this.activeOperations.clear()
  },

  // Verificar status completo da autenticação
  async getAuthStatus(): Promise<AuthStatus> {
    try {
      const session = await this.verificarSessao()
      
      if (!session) {
        return {
          state: 'unauthenticated',
          user: null,
          error: null,
          isConnected: connectivity.isOnline()
        }
      }

      const user = await this.obterUsuarioCompleto(session.user.id)
      
      return {
        state: 'authenticated',
        user,
        error: null,
        isConnected: connectivity.isOnline()
      }
    } catch (error: any) {
      console.error("Erro ao verificar status de auth:", error)
      
      return {
        state: 'error',
        user: null,
        error: error.message || 'Erro desconhecido',
        isConnected: connectivity.isOnline()
      }
    }
  },

  // Mapear erros para mensagens amigáveis
  getErrorMessage(error: any): string {
    const message = error?.message || error?.error_description || 'Erro desconhecido'
    
    if (message.includes('Invalid login credentials')) {
      return 'Email ou senha incorretos'
    }
    if (message.includes('Email not confirmed')) {
      return 'Email não confirmado. Verifique sua caixa de entrada.'
    }
    if (message.includes('Invalid email')) {
      return 'Email inválido'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Erro de conexão. Verifique sua internet.'
    }
    if (message.includes('timeout') || message.includes('Timeout')) {
      return 'Operação demorou muito. Tente novamente.'
    }
    
    return 'Erro ao fazer login. Tente novamente.'
  }
}
