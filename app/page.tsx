"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, List, AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { NovoInventario } from "./components/novo-inventario"
import { AdicionarItens } from "./components/adicionar-itens"
import { ListagemInventarios } from "./components/listagem-inventarios"
import { DetalhesInventario } from "./components/detalhes-inventario"
import { CadastroUsuarios } from "./components/cadastro-usuarios"
import { Login } from "./components/login"
import { HeaderApp } from "./components/header-app"
import { ErrorBoundary } from "./components/error-boundary"
import { ClientOnly } from "./components/client-only"
import { authService, type Usuario, type AuthState, AuthError } from "./lib/auth"
import { LoadingState, connectivity } from "./lib/utils"

export default function HomePage() {
  const [telaAtiva, setTelaAtiva] = useState<"home" | "novo" | "adicionar" | "listagem" | "detalhes" | "usuarios">(
    "home",
  )
  const [inventarioAtivo, setInventarioAtivo] = useState<any>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  
  // Refs para cleanup
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const loadingStateRef = useRef<LoadingState | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    // Skip SSR
    if (typeof window === 'undefined') return

    // Inicializar LoadingState com timeout de segurança
    loadingStateRef.current = new LoadingState(
      (loading) => {
        if (mountedRef.current) {
          setAuthState(loading ? 'loading' : 'unauthenticated')
        }
      },
      30000 // 30 segundos timeout máximo
    )

    // Inicializar conectividade
    setIsOnline(connectivity.isOnline())
    const connectivityCallback = (online: boolean) => {
      if (mountedRef.current) {
        setIsOnline(online)
        if (online && authState === 'error') {
          // Retry automático quando volta online
          console.log('Conexão restaurada, tentando verificar sessão novamente...')
          verificarSessaoAtiva()
        }
      }
    }
    connectivity.addListener(connectivityCallback)

    // Verificar sessão inicial
    verificarSessaoAtiva()

    // Escutar mudanças de autenticação com error handling
    authSubscriptionRef.current = authService.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return

      try {
        console.log(`Auth state change: ${event}`)
        
        if (event === "SIGNED_IN" && session) {
          setAuthState('loading')
          setAuthError(null)
          
          const usuarioCompleto = await authService.obterUsuarioCompleto(session.user.id)
          
          if (mountedRef.current) {
            setUsuario(usuarioCompleto)
            setAuthState('authenticated')
            setRetryCount(0)
          }
        } else if (event === "SIGNED_OUT") {
          if (mountedRef.current) {
            setUsuario(null)
            setAuthState('unauthenticated')
            setAuthError(null)
            setTelaAtiva("home")
            authService.abortAllOperations()
          }
        } else if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully")
        }
      } catch (error: any) {
        console.error("Erro no auth state change:", error)
        if (mountedRef.current) {
          setAuthError(error.message || 'Erro de autenticação')
          setAuthState('error')
        }
      }
    })

    // Cleanup function
    return () => {
      mountedRef.current = false
      
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe()
      }
      
      if (loadingStateRef.current) {
        loadingStateRef.current.stop()
      }
      
      connectivity.removeListener(connectivityCallback)
      authService.abortAllOperations()
    }
  }, [])

  const verificarSessaoAtiva = async () => {
    if (!mountedRef.current || typeof window === 'undefined') return

    try {
      console.log("Verificando sessão ativa...")
      setAuthState('loading')
      setAuthError(null)
      
      if (loadingStateRef.current) {
        loadingStateRef.current.start()
      }

      const authStatus = await authService.getAuthStatus()
      
      if (!mountedRef.current) return

      if (authStatus.state === 'authenticated' && authStatus.user) {
        setUsuario(authStatus.user)
        setAuthState('authenticated')
        setRetryCount(0)
        console.log(`Usuário autenticado: ${authStatus.user.nome}`)
      } else if (authStatus.state === 'unauthenticated') {
        setUsuario(null)
        setAuthState('unauthenticated')
        console.log("Nenhuma sessão ativa encontrada")
      } else if (authStatus.state === 'error') {
        setAuthError(authStatus.error)
        setAuthState('error')
        console.error("Erro na verificação de sessão:", authStatus.error)
      }

    } catch (error: any) {
      console.error("Erro ao verificar sessão:", error)
      
      if (mountedRef.current) {
        const errorMessage = error instanceof AuthError 
          ? authService.getErrorMessage(error)
          : 'Erro ao verificar sessão. Tente novamente.'
        
        setAuthError(errorMessage)
        setAuthState('error')
      }
    } finally {
      if (loadingStateRef.current) {
        loadingStateRef.current.stop()
      }
    }
  }

  const handleRetryAuth = () => {
    const newRetryCount = retryCount + 1
    setRetryCount(newRetryCount)
    console.log(`Retry tentativa ${newRetryCount}`)
    verificarSessaoAtiva()
  }

  const handleLoginSuccess = (user: Usuario) => {
    if (mountedRef.current) {
      setUsuario(user)
      setAuthState('authenticated')
      setAuthError(null)
      setTelaAtiva("home")
      setRetryCount(0)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error("Erro no logout:", error)
    } finally {
      if (mountedRef.current) {
        setUsuario(null)
        setAuthState('unauthenticated')
        setAuthError(null)
        setTelaAtiva("home")
        setInventarioAtivo(null)
      }
    }
  }

  // Componente de erro com retry
  const ErrorScreen = ({ error }: { error: string }) => (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-2 border-[#FB8281] shadow-lg">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-[#FB8281] mx-auto" />
            <h2 className="text-xl font-bold text-[#000000]">Erro de Conexão</h2>
            <p className="text-[#5F6B6D] text-sm">{error}</p>
            
            {/* Indicador de conectividade */}
            <div className="flex items-center justify-center gap-2 text-sm">
              {isOnline ? (
                <><Wifi className="w-4 h-4 text-[#4AC5BB]" /> Online</>
              ) : (
                <><WifiOff className="w-4 h-4 text-[#FB8281]" /> Offline</>
              )}
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={handleRetryAuth}
                disabled={retryCount >= 5}
                className="w-full bg-[#fabd07] hover:bg-[#b58821] text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {retryCount >= 5 ? 'Máximo de tentativas atingido' : `Tentar Novamente (${retryCount}/5)`}
              </Button>
              
              {retryCount >= 5 && (
                <Button
                  onClick={() => {
                    setRetryCount(0)
                    window.location.reload()
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Recarregar Página
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Tela de carregamento melhorada
  const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fabd07] mx-auto"></div>
        <div className="space-y-2">
          <p className="text-[#5F6B6D] font-medium">Carregando...</p>
          <p className="text-[#8B8C7E] text-sm">Verificando autenticação</p>
          
          {/* Indicador de conectividade */}
          <div className="flex items-center justify-center gap-2 text-xs text-[#8B8C7E]">
            {isOnline ? (
              <><Wifi className="w-3 h-3" /> Conectado</>
            ) : (
              <><WifiOff className="w-3 h-3" /> Sem conexão</>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Renderização condicional baseada no estado
  if (authState === 'loading') {
    return <LoadingScreen />
  }

  if (authState === 'error') {
    return <ErrorScreen error={authError || 'Erro desconhecido'} />
  }

  // Tela de login se não estiver autenticado
  if (!usuario) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  const renderTela = () => {
    switch (telaAtiva) {
      case "novo":
        return (
          <NovoInventario
            usuario={usuario}
            onVoltar={() => setTelaAtiva("home")}
            onInventarioCriado={(inventario) => {
              setInventarioAtivo(inventario)
              setTelaAtiva("adicionar")
            }}
          />
        )
      case "adicionar":
        return <AdicionarItens inventario={inventarioAtivo} usuario={usuario} onVoltar={() => setTelaAtiva("home")} />
      case "listagem":
        return (
          <ListagemInventarios
            usuario={usuario}
            onVoltar={() => setTelaAtiva("home")}
            onEditarInventario={(inventario) => {
              setInventarioAtivo(inventario)
              setTelaAtiva("detalhes")
            }}
            onAdicionarItens={(inventario) => {
              setInventarioAtivo(inventario)
              setTelaAtiva("adicionar")
            }}
          />
        )
      case "detalhes":
        return (
          <DetalhesInventario
            inventario={inventarioAtivo}
            usuario={usuario}
            onVoltar={() => setTelaAtiva("listagem")}
            onInventarioAtualizado={(inventario) => {
              setInventarioAtivo(inventario)
            }}
          />
        )
      case "usuarios":
        return <CadastroUsuarios usuario={usuario} onVoltar={() => setTelaAtiva("home")} />
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
            <div className="max-w-md mx-auto space-y-6">
              {/* Header com info do usuário */}
              <HeaderApp
                usuario={usuario}
                onLogout={handleLogout}
                onGerenciarUsuarios={
                  usuario.permissoes?.includes("excluir") ? () => setTelaAtiva("usuarios") : undefined
                }
              />

              {/* Header do App */}
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 p-2">
                  <img src="/images/ox-logo.png" alt="OX Group" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-3xl font-bold text-[#000000] mb-2">OX Inventory</h1>
                <p className="text-[#5F6B6D] text-lg">Sistema de Contagem de Inventário</p>
              </div>

              {/* Menu Principal */}
              <div className="space-y-4">
                <Card className="border-2 border-[#fabd07] shadow-lg">
                  <CardContent className="p-6">
                    <Button
                      onClick={() => setTelaAtiva("novo")}
                      className="w-full h-16 bg-[#fabd07] hover:bg-[#b58821] text-white text-lg font-semibold rounded-xl"
                    >
                      <Plus className="w-6 h-6 mr-3" />
                      Novo Inventário
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#3599B8] shadow-lg">
                  <CardContent className="p-6">
                    <Button
                      onClick={() => setTelaAtiva("listagem")}
                      className="w-full h-16 bg-[#3599B8] hover:bg-[#4AC5BB] text-white text-lg font-semibold rounded-xl"
                    >
                      <List className="w-6 h-6 mr-3" />
                      Ver Inventários
                    </Button>
                  </CardContent>
                </Card>

                {/* Card de Status - Mostra último inventário */}
                <Card className="border-2 border-[#C9B07A] shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#000000] text-lg">Status da Loja</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-[#5F6B6D]">
                      <p className="text-sm mb-1">Loja atual:</p>
                      <p className="font-semibold text-[#000000]">{usuario.loja_nome}</p>
                      <p className="text-sm text-[#8B8C7E] mt-2">Último inventário: Hoje - 14:30</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Footer */}
              <div className="text-center pt-4">
                <p className="text-[#5F6B6D] text-sm">Versão 1.0 - OX Inventory System</p>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <ClientOnly 
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fabd07] mx-auto"></div>
            <p className="text-[#5F6B6D] font-medium">Carregando aplicação...</p>
          </div>
        </div>
      }
    >
      <ErrorBoundary>
        {renderTela()}
      </ErrorBoundary>
    </ClientOnly>
  )
}
