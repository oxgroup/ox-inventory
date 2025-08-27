import { supabase } from "./supabase"

// Types para a nova estrutura de fichas técnicas
export interface Prato {
  id: string
  nome: string
  descricao?: string
  categoria?: string
  usuario_id: string
  loja_id: string
  ativo: boolean
  created_at: string
  updated_at: string
  // Dados relacionais
  usuario?: {
    nome: string
    email: string
  }
  loja?: {
    nome: string
    codigo: string
  }
  fichas_tecnicas?: FichaTecnica[]
  // Contadores calculados
  total_ingredientes?: number
  custo_total?: number
}

export interface FichaTecnica {
  id: string
  prato_id: string
  item: string // Nome do prato (duplicado para compatibilidade)
  insumo: string
  qtd: number
  quebra: number
  unidade: string
  codigo_empresa?: string
  qtd_receita: number
  fator_correcao: number
  obs_item_ft?: string
  id_grupo?: string
  seq: number
  qtd_lote: number
  id_cliente_queops?: string
  produto_id?: string
  created_at: string
  updated_at: string
  // Dados do produto
  produto_nome?: string
  produto_categoria?: string
  produto_cod_item?: string
  produto_codigo_barras?: string
  // Cálculos
  qtd_total_calculada?: number
}

export interface NovoPrato {
  nome: string
  descricao?: string
  categoria?: string
  usuario_id: string
  loja_id: string
  ingredientes: NovaFichaTecnica[]
}

export interface NovaFichaTecnica {
  insumo: string
  qtd: number
  quebra?: number
  unidade: string
  codigo_empresa?: string
  qtd_receita?: number
  fator_correcao?: number
  obs_item_ft?: string
  id_grupo?: string
  seq?: number
  qtd_lote?: number
  id_cliente_queops?: string
  produto_id?: string
}

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
      
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1)
        console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${waitTime}ms...`, error.message)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  throw lastError
}

// Serviço de pratos (produtos com fichas técnicas)
export const pratosService = {
  // Listar pratos da loja
  async listar(lojaId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("pratos")
        .select(`
          *,
          usuarios!pratos_usuario_id_fkey (
            nome,
            email
          ),
          lojas!pratos_loja_id_fkey (
            nome,
            codigo
          ),
          fichas_tecnicas (*)
        `)
        .eq("loja_id", lojaId)
        .eq("ativo", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      
      // Calcular estatísticas para cada prato
      const pratosComStats = data?.map(prato => ({
        ...prato,
        usuario: prato.usuarios,
        loja: prato.lojas,
        total_ingredientes: prato.fichas_tecnicas?.length || 0,
        custo_total: 0 // TODO: calcular baseado nos produtos
      })) || []

      return pratosComStats as Prato[]
    })
  },

  // Criar novo prato com ingredientes
  async criar(novoPrato: NovoPrato) {
    return withRetry(async () => {
      // Criar prato principal
      const { data: prato, error: pratoError } = await supabase
        .from("pratos")
        .insert({
          nome: novoPrato.nome,
          descricao: novoPrato.descricao,
          categoria: novoPrato.categoria,
          usuario_id: novoPrato.usuario_id,
          loja_id: novoPrato.loja_id
        })
        .select()
        .single()

      if (pratoError) throw pratoError

      // Criar ingredientes (fichas técnicas)
      if (novoPrato.ingredientes.length > 0) {
        const ingredientesParaInserir = novoPrato.ingredientes.map((ingrediente, index) => ({
          prato_id: prato.id,
          item: novoPrato.nome, // Nome do prato
          insumo: ingrediente.insumo,
          qtd: ingrediente.qtd,
          quebra: ingrediente.quebra || 0,
          unidade: ingrediente.unidade,
          codigo_empresa: ingrediente.codigo_empresa,
          qtd_receita: ingrediente.qtd_receita || 0,
          fator_correcao: ingrediente.fator_correcao || 1,
          obs_item_ft: ingrediente.obs_item_ft,
          id_grupo: ingrediente.id_grupo,
          seq: ingrediente.seq || index + 1,
          qtd_lote: ingrediente.qtd_lote || 0,
          id_cliente_queops: ingrediente.id_cliente_queops,
          produto_id: ingrediente.produto_id
        }))

        const { error: ingredientesError } = await supabase
          .from("fichas_tecnicas")
          .insert(ingredientesParaInserir)

        if (ingredientesError) throw ingredientesError
      }

      return prato
    })
  },

  // Obter prato por ID com ingredientes
  async obter(id: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("pratos")
        .select(`
          *,
          usuarios!pratos_usuario_id_fkey (
            nome,
            email
          ),
          lojas!pratos_loja_id_fkey (
            nome,
            codigo
          ),
          fichas_tecnicas (
            *,
            produtos (
              nome,
              categoria,
              cod_item,
              codigo_barras
            )
          )
        `)
        .eq("id", id)
        .single()

      if (error) throw error

      // Processar dados relacionais e calcular valores
      const pratoCompleto = {
        ...data,
        usuario: data.usuarios,
        loja: data.lojas,
        fichas_tecnicas: data.fichas_tecnicas?.map((ingrediente: any) => ({
          ...ingrediente,
          produto_nome: ingrediente.produtos?.nome,
          produto_categoria: ingrediente.produtos?.categoria,
          produto_cod_item: ingrediente.produtos?.cod_item,
          produto_codigo_barras: ingrediente.produtos?.codigo_barras,
          qtd_total_calculada: ingrediente.qtd * (1 + ingrediente.quebra / 100) * ingrediente.fator_correcao
        })).sort((a: any, b: any) => a.seq - b.seq) || []
      }

      return pratoCompleto as Prato & { fichas_tecnicas: FichaTecnica[] }
    })
  },

  // Atualizar prato
  async atualizar(id: string, updates: Partial<Prato>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("pratos")
        .update({
          nome: updates.nome,
          descricao: updates.descricao,
          categoria: updates.categoria
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Excluir prato (soft delete)
  async excluir(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from("pratos")
        .update({ ativo: false })
        .eq("id", id)

      if (error) throw error
    })
  },

  // Obter estatísticas
  async obterEstatisticas(lojaId: string, usuarioId?: string) {
    return withRetry(async () => {
      let query = supabase
        .from("pratos")
        .select("id, created_at, usuario_id")
        .eq("loja_id", lojaId)
        .eq("ativo", true)

      const { data, error } = await query

      if (error) throw error

      const total = data?.length || 0
      const minhas = usuarioId ? data?.filter(p => p.usuario_id === usuarioId).length || 0 : 0
      const esteMes = data?.filter(p => {
        const created = new Date(p.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length || 0

      return {
        total,
        minhas,
        este_mes: esteMes,
        crescimento_mensal: 0 // TODO: calcular crescimento comparado ao mês anterior
      }
    })
  }
}

// Serviço de fichas técnicas (ingredientes) - CRUD direto na tabela fichas_tecnicas
export const fichasTecnicasService = {
  // Listar ingredientes de um prato
  async listarPorPrato(pratoId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .select(`
          *,
          produtos (
            nome,
            categoria,
            cod_item,
            codigo_barras
          )
        `)
        .eq("prato_id", pratoId)
        .order("seq")

      if (error) throw error

      // Processar dados relacionais e cálculos
      const ingredientesProcessados = data?.map(ingrediente => ({
        ...ingrediente,
        produto_nome: ingrediente.produtos?.nome,
        produto_categoria: ingrediente.produtos?.categoria,
        produto_cod_item: ingrediente.produtos?.cod_item,
        produto_codigo_barras: ingrediente.produtos?.codigo_barras,
        qtd_total_calculada: ingrediente.qtd * (1 + ingrediente.quebra / 100) * ingrediente.fator_correcao
      })) || []

      return ingredientesProcessados as FichaTecnica[]
    })
  },

  // Adicionar ingrediente a um prato
  async adicionar(ingrediente: NovaFichaTecnica & { prato_id: string, item: string }) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .insert(ingrediente)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Atualizar ingrediente
  async atualizar(id: string, updates: Partial<FichaTecnica>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Excluir ingrediente
  async excluir(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from("fichas_tecnicas")
        .delete()
        .eq("id", id)

      if (error) throw error
    })
  },

  // Reordenar ingredientes
  async reordenar(ingredientes: { id: string, seq: number }[]) {
    return withRetry(async () => {
      const updates = ingredientes.map(ingrediente => 
        supabase
          .from("fichas_tecnicas")
          .update({ seq: ingrediente.seq })
          .eq("id", ingrediente.id)
      )

      const results = await Promise.all(updates)
      
      for (const result of results) {
        if (result.error) throw result.error
      }
    })
  },

  // Buscar por ingrediente específico
  async buscarPorInsumo(insumo: string, lojaId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .select(`
          *,
          pratos!fichas_tecnicas_prato_id_fkey (
            nome,
            categoria
          )
        `)
        .ilike("insumo", `%${insumo}%`)
        .eq("pratos.loja_id", lojaId)

      if (error) throw error
      return data || []
    })
  }
}