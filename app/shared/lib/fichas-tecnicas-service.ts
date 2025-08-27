import { supabase } from "./supabase"

// Types para fichas técnicas
export interface FichaTecnica {
  id: string
  item: string
  usuario_id: string
  loja_id: string
  observacoes?: string
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
  itens_ficha_tecnica?: ItemFichaTecnica[]
  // Contadores calculados
  total_itens?: number
  custo_total?: number
}

export interface ItemFichaTecnica {
  id: string
  ficha_tecnica_id: string
  insumo: string
  produto_id?: string
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

export interface NovaFichaTecnica {
  item: string
  usuario_id: string
  loja_id: string
  observacoes?: string
  itens: NovoItemFichaTecnica[]
}

export interface NovoItemFichaTecnica {
  insumo: string
  produto_id?: string
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

// Serviço de fichas técnicas
export const fichasTecnicasService = {
  // Listar fichas técnicas da loja
  async listar(lojaId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .select(`
          *,
          usuarios!fichas_tecnicas_usuario_id_fkey (
            nome,
            email
          ),
          lojas!fichas_tecnicas_loja_id_fkey (
            nome,
            codigo
          ),
          itens_ficha_tecnica (*)
        `)
        .eq("loja_id", lojaId)
        .eq("ativo", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      
      // Calcular estatísticas para cada ficha
      const fichasComStats = data?.map(ficha => ({
        ...ficha,
        usuario: ficha.usuarios,
        loja: ficha.lojas,
        total_itens: ficha.itens_ficha_tecnica?.length || 0,
        custo_total: 0 // TODO: calcular baseado nos produtos
      })) || []

      return fichasComStats as FichaTecnica[]
    })
  },

  // Criar nova ficha técnica
  async criar(novaFicha: NovaFichaTecnica) {
    return withRetry(async () => {
      // Criar ficha técnica principal
      const { data: ficha, error: fichaError } = await supabase
        .from("fichas_tecnicas")
        .insert({
          item: novaFicha.item,
          usuario_id: novaFicha.usuario_id,
          loja_id: novaFicha.loja_id,
          observacoes: novaFicha.observacoes
        })
        .select()
        .single()

      if (fichaError) throw fichaError

      // Criar itens da ficha técnica
      if (novaFicha.itens.length > 0) {
        const itensParaInserir = novaFicha.itens.map((item, index) => ({
          ficha_tecnica_id: ficha.id,
          insumo: item.insumo,
          produto_id: item.produto_id,
          qtd: item.qtd,
          quebra: item.quebra || 0,
          unidade: item.unidade,
          codigo_empresa: item.codigo_empresa,
          qtd_receita: item.qtd_receita || 0,
          fator_correcao: item.fator_correcao || 1,
          obs_item_ft: item.obs_item_ft,
          id_grupo: item.id_grupo,
          seq: item.seq || index + 1,
          qtd_lote: item.qtd_lote || 0,
          id_cliente_queops: item.id_cliente_queops
        }))

        const { error: itensError } = await supabase
          .from("itens_ficha_tecnica")
          .insert(itensParaInserir)

        if (itensError) throw itensError
      }

      return ficha
    })
  },

  // Obter ficha técnica por ID
  async obter(id: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .select(`
          *,
          usuarios!fichas_tecnicas_usuario_id_fkey (
            nome,
            email
          ),
          lojas!fichas_tecnicas_loja_id_fkey (
            nome,
            codigo
          ),
          itens_ficha_tecnica (
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
      const fichaCompleta = {
        ...data,
        usuario: data.usuarios,
        loja: data.lojas,
        itens_ficha_tecnica: data.itens_ficha_tecnica?.map((item: any) => ({
          ...item,
          produto_nome: item.produtos?.nome,
          produto_categoria: item.produtos?.categoria,
          produto_cod_item: item.produtos?.cod_item,
          produto_codigo_barras: item.produtos?.codigo_barras,
          qtd_total_calculada: item.qtd * (1 + item.quebra / 100) * item.fator_correcao
        })).sort((a: any, b: any) => a.seq - b.seq) || []
      }

      return fichaCompleta as FichaTecnica & { itens_ficha_tecnica: ItemFichaTecnica[] }
    })
  },

  // Atualizar ficha técnica
  async atualizar(id: string, updates: Partial<FichaTecnica>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .update({
          item: updates.item,
          observacoes: updates.observacoes
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Excluir ficha técnica (soft delete)
  async excluir(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from("fichas_tecnicas")
        .update({ ativo: false })
        .eq("id", id)

      if (error) throw error
    })
  },

  // Obter estatísticas
  async obterEstatisticas(lojaId: string, usuarioId?: string) {
    return withRetry(async () => {
      let query = supabase
        .from("fichas_tecnicas")
        .select("id, created_at, usuario_id")
        .eq("loja_id", lojaId)
        .eq("ativo", true)

      const { data, error } = await query

      if (error) throw error

      const total = data?.length || 0
      const minhas = usuarioId ? data?.filter(f => f.usuario_id === usuarioId).length || 0 : 0
      const esteMes = data?.filter(f => {
        const created = new Date(f.created_at)
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

// Serviço de itens de ficha técnica
export const itensFichaTecnicaService = {
  // Adicionar item à ficha técnica
  async adicionar(item: NovoItemFichaTecnica & { ficha_tecnica_id: string }) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("itens_ficha_tecnica")
        .insert(item)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Listar itens de uma ficha técnica
  async listarPorFicha(fichaTecnicaId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("itens_ficha_tecnica")
        .select(`
          *,
          produtos (
            nome,
            categoria,
            cod_item,
            codigo_barras
          )
        `)
        .eq("ficha_tecnica_id", fichaTecnicaId)
        .order("seq")

      if (error) throw error

      // Processar dados relacionais e cálculos
      const itensProcessados = data?.map(item => ({
        ...item,
        produto_nome: item.produtos?.nome,
        produto_categoria: item.produtos?.categoria,
        produto_cod_item: item.produtos?.cod_item,
        produto_codigo_barras: item.produtos?.codigo_barras,
        qtd_total_calculada: item.qtd * (1 + item.quebra / 100) * item.fator_correcao
      })) || []

      return itensProcessados as ItemFichaTecnica[]
    })
  },

  // Atualizar item
  async atualizar(id: string, updates: Partial<ItemFichaTecnica>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("itens_ficha_tecnica")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Excluir item
  async excluir(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from("itens_ficha_tecnica")
        .delete()
        .eq("id", id)

      if (error) throw error
    })
  },

  // Reordenar itens
  async reordenar(itens: { id: string, seq: number }[]) {
    return withRetry(async () => {
      const updates = itens.map(item => 
        supabase
          .from("itens_ficha_tecnica")
          .update({ seq: item.seq })
          .eq("id", item.id)
      )

      const results = await Promise.all(updates)
      
      for (const result of results) {
        if (result.error) throw result.error
      }
    })
  }
}