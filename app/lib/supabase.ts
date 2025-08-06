import { createClient } from "@supabase/supabase-js"

// Configuração do Supabase para cliente (frontend)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Função utilitária para retry de operações
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Se é erro de autenticação, não fazer retry
      if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
        console.warn(`Erro de autenticação na tentativa ${attempt}, tentando refresh...`)
        // Tentar refresh da sessão
        try {
          await supabase.auth.refreshSession()
          // Se refresh funcionou, tentar a operação novamente
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        } catch (refreshError) {
          console.error("Erro ao fazer refresh:", refreshError)
          throw error
        }
      }
      
      // Para outros erros, fazer retry com delay exponencial
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1)
        console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${waitTime}ms...`, error.message)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  throw lastError
}

// Tipos para o banco de dados
export interface Loja {
  id: string
  nome: string
  codigo: string
  endereco?: string
  telefone?: string
  ativo: boolean
}

export interface Inventario {
  id: string
  setor: string
  data_criacao: string
  status: "em_contagem" | "finalizado" | "conciliado"
  usuario_id: string
  usuario_nome?: string
  loja_id: string
  total_itens?: number
}

export interface ItemInventario {
  id: string
  inventario_id: string
  produto_id: string
  produto_nome: string
  produto_unidade: string
  produto_categoria?: string
  produto_cod_item?: string
  quantidade_fechada: number
  quantidade_em_uso: number
  data_contagem: string
  observacoes?: string
}

export interface Produto {
  id: string
  nome: string
  categoria: string
  unidade: string
  cod_item?: string
  loja_id: string
  ativo: boolean
}

// Serviço de inventário
export const inventarioService = {
  // Listar inventários apenas da loja do usuário
  async listar(lojaId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("inventarios")
        .select("*, itens_inventario(*)")
        .eq("loja_id", lojaId)
        .order("data_criacao", { ascending: false })

      if (error) throw error
      return data as (Inventario & { itens_inventario: ItemInventario[] })[]
    })
  },

  // Criar novo inventário sempre usando loja_id do usuário
  async criar(inventario: Partial<Inventario>, lojaId: string) {
    return withRetry(async () => {
      const inventarioComLoja = { ...inventario, loja_id: lojaId }
      const { data, error } = await supabase
        .from("inventarios")
        .insert(inventarioComLoja)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Obter inventário por ID
  async obter(id: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("inventarios")
        .select("*, itens_inventario(*)")
        .eq("id", id)
        .single()

      if (error) throw error
      return data as Inventario & { itens_inventario: ItemInventario[] }
    })
  },

  // Atualizar inventário
  async atualizar(id: string, updates: Partial<Inventario>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("inventarios")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Excluir inventário
  async excluir(id: string) {
    return withRetry(async () => {
      const { error } = await supabase.from("inventarios").delete().eq("id", id)
      if (error) throw error
    })
  },
}

// Serviço de produtos
export const produtoService = {
  // Listar produtos da loja atual - carregamento em lotes para todos os produtos
  async listar() {
    return withRetry(async () => {
      let allData: Produto[] = []
      let from = 0
      const batchSize = 1000
      
      while (true) {
        const { data, error } = await supabase
          .from("produtos")
          .select("*")
          .eq("ativo", true)
          .order("nome")
          .range(from, from + batchSize - 1)
        
        if (error) throw error
        if (!data || data.length === 0) break
        
        allData = [...allData, ...data]
        
        // Se retornou menos que o batchSize, chegamos ao fim
        if (data.length < batchSize) break
        from += batchSize
      }
      
      console.log(`Produtos carregados: ${allData.length}`)
      return allData
    })
  },

  // Criar novo produto
  async criar(produto: Partial<Produto>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("produtos")
        .insert(produto)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Atualizar produto
  async atualizar(id: string, produto: Partial<Produto>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("produtos")
        .update(produto)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },
}

export const itemInventarioService = {
  // Adicionar item ao inventário
  async adicionar(item: Omit<ItemInventario, "id">) {
    return withRetry(async () => {
      const { data, error } = await supabase.from("itens_inventario").insert(item).select().single()

      if (error) {
        console.error("Erro ao adicionar item:", error)
        throw error
      }
      return data
    })
  },

  // Listar itens de um inventário
  async listarPorInventario(inventarioId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("itens_inventario")
        .select("*")
        .eq("inventario_id", inventarioId)
        .order("data_contagem", { ascending: false })

      if (error) {
        console.error("Erro ao listar itens:", error)
        throw error
      }
      return data
    })
  },

  // Atualizar item
  async atualizar(id: string, updates: Partial<ItemInventario>) {
    return withRetry(async () => {
      const { data, error } = await supabase.from("itens_inventario").update(updates).eq("id", id).select().single()

      if (error) {
        console.error("Erro ao atualizar item:", error)
        throw error
      }
      return data
    })
  },

  // Excluir item
  async excluir(id: string) {
    return withRetry(async () => {
      const { error } = await supabase.from("itens_inventario").delete().eq("id", id)

      if (error) {
        console.error("Erro ao excluir item:", error)
        throw error
      }
    })
  },
}

export const lojaService = {
  // Listar todas as lojas
  async listar() {
    return withRetry(async () => {
      const { data, error } = await supabase.from("lojas").select("*").eq("ativo", true).order("nome")

      if (error) {
        console.error("Erro ao listar lojas:", error)
        throw error
      }
      return data || []
    })
  },

  // Obter loja por código
  async obterPorCodigo(codigo: string) {
    return withRetry(async () => {
      const { data, error } = await supabase.from("lojas").select("*").eq("codigo", codigo).single()

      if (error) {
        console.error("Erro ao obter loja:", error)
        throw error
      }
      return data
    })
  },
}
