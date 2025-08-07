import { supabase } from "./supabase"

// Types para requisições
export type StatusRequisicao = 'pendente' | 'separado' | 'entregue' | 'cancelado'
export type StatusItemRequisicao = 'pendente' | 'separado' | 'entregue' | 'cancelado' | 'em_falta'
export type TurnoEntrega = 'Manhã' | 'Tarde'

export interface Requisicao {
  id: string
  numero_requisicao: string
  setor_solicitante: string
  usuario_solicitante_id: string
  loja_id: string
  status: StatusRequisicao
  observacoes?: string
  data_criacao: string
  data_separacao?: string
  data_entrega?: string
  data_confirmacao?: string
  data_entrega_prevista?: string
  turno?: TurnoEntrega
  usuario_separacao_id?: string
  usuario_entrega_id?: string
  // Dados relacionais
  usuario_solicitante?: {
    nome: string
    email: string
  }
  usuario_separacao?: {
    nome: string
  }
  usuario_entrega?: {
    nome: string
  }
  loja?: {
    nome: string
    codigo: string
  }
  itens_requisicao?: ItemRequisicao[]
  // Contadores calculados
  total_itens?: number
  itens_pendentes?: number
  itens_separados?: number
  itens_entregues?: number
}

export interface ItemRequisicao {
  id: string
  requisicao_id: string
  produto_id: string
  quantidade_solicitada: number
  quantidade_separada: number
  quantidade_entregue: number
  status: StatusItemRequisicao
  observacoes_item?: string
  data_separacao_item?: string
  data_entrega_item?: string
  // Dados do produto
  produto_nome?: string
  produto_unidade?: string
  produto_categoria?: string
  produto_cod_item?: string
  produto_codigo_barras?: string
}

export interface NovaRequisicao {
  setor_solicitante: string
  usuario_solicitante_id: string
  loja_id: string
  observacoes?: string
  data_entrega_prevista?: string
  turno?: TurnoEntrega
  itens: NovoItemRequisicao[]
}

export interface NovoItemRequisicao {
  produto_id: string
  quantidade_solicitada: number
}

// Constantes
export const SETORES = [
  "Câmara Congelada",
  "Câmara Resfriada", 
  "Dry Aged",
  "Estoque Seco",
  "Estoque Limpeza",
  "Bar",
  "Estoque Bebidas", 
  "Prep",
  "Linha",
  "Delivery"
] as const

export const TURNOS: TurnoEntrega[] = [
  "Manhã",
  "Tarde"
]

export const STATUS_COLORS = {
  // Cores para status de requisições
  requisicao: {
    pendente: "bg-[#F4D25A] text-[#000000]",
    separado: "bg-[#3599B8] text-white",
    entregue: "bg-[#fabd07] text-white", 
    cancelado: "bg-[#FB8281] text-white"
  },
  // Cores para status de itens
  item: {
    pendente: "bg-[#F4D25A] text-[#000000]",
    separado: "bg-[#4AC5BB] text-white",
    entregue: "bg-[#8B8C7E] text-white",
    cancelado: "bg-[#DFBFBF] text-[#000000]",
    em_falta: "bg-[#FB8281] text-white"
  }
}

export const STATUS_LABELS = {
  requisicao: {
    pendente: "Pendente",
    separado: "Separado",
    entregue: "Entregue",
    cancelado: "Cancelado"
  },
  item: {
    pendente: "Pendente",
    separado: "Separado", 
    entregue: "Entregue",
    cancelado: "Cancelado",
    em_falta: "Em Falta"
  }
}

// Service principal
export const requisicoesService = {
  // ================== REQUISIÇÕES ==================

  // Criar nova requisição
  async criar(novaRequisicao: NovaRequisicao): Promise<Requisicao> {
    try {
      // 1. Criar a requisição
      const { data: requisicao, error: reqError } = await supabase
        .from('requisicoes')
        .insert({
          setor_solicitante: novaRequisicao.setor_solicitante,
          usuario_solicitante_id: novaRequisicao.usuario_solicitante_id,
          loja_id: novaRequisicao.loja_id,
          observacoes: novaRequisicao.observacoes,
          data_entrega_prevista: novaRequisicao.data_entrega_prevista,
          turno: novaRequisicao.turno
        })
        .select(`
          *,
          usuario_solicitante:usuarios!usuario_solicitante_id(nome, email),
          loja:lojas(nome, codigo)
        `)
        .single()

      if (reqError) throw reqError

      // 2. Criar os itens da requisição
      if (novaRequisicao.itens.length > 0) {
        const itensData = novaRequisicao.itens.map(item => ({
          requisicao_id: requisicao.id,
          produto_id: item.produto_id,
          quantidade_solicitada: item.quantidade_solicitada
        }))

        const { error: itensError } = await supabase
          .from('itens_requisicao')
          .insert(itensData)

        if (itensError) throw itensError
      }

      // 3. Buscar requisição completa
      return await this.buscarPorId(requisicao.id)
    } catch (error) {
      console.error('Erro ao criar requisição:', error)
      throw error
    }
  },

  // Listar requisições (com filtros)
  async listar(filtros: {
    loja_id?: string
    status?: StatusRequisicao
    usuario_id?: string
    setor?: string
    limite?: number
  } = {}): Promise<Requisicao[]> {
    try {
      let query = supabase
        .from('requisicoes')
        .select(`
          *,
          usuario_solicitante:usuarios!usuario_solicitante_id(nome, email),
          usuario_separacao:usuarios!usuario_separacao_id(nome),
          usuario_entrega:usuarios!usuario_entrega_id(nome),
          loja:lojas(nome, codigo),
          itens_requisicao(
            id, status, quantidade_solicitada, quantidade_separada, quantidade_entregue,
            produto_id, observacoes_item,
            produtos(nome, unidade, categoria, cod_item, codigo_barras)
          )
        `)
        .order('data_criacao', { ascending: false })

      // Aplicar filtros
      if (filtros.loja_id) {
        query = query.eq('loja_id', filtros.loja_id)
      }
      if (filtros.status) {
        query = query.eq('status', filtros.status)  
      }
      if (filtros.usuario_id) {
        query = query.eq('usuario_solicitante_id', filtros.usuario_id)
      }
      if (filtros.setor) {
        query = query.eq('setor_solicitante', filtros.setor)
      }
      if (filtros.limite) {
        query = query.limit(filtros.limite)
      }

      const { data, error } = await query

      if (error) throw error

      // Processar dados e calcular contadores
      return (data || []).map(req => ({
        ...req,
        total_itens: req.itens_requisicao?.length || 0,
        itens_pendentes: req.itens_requisicao?.filter(i => i.status === 'pendente').length || 0,
        itens_separados: req.itens_requisicao?.filter(i => i.status === 'separado').length || 0,
        itens_entregues: req.itens_requisicao?.filter(i => i.status === 'entregue').length || 0,
        // Achatar dados do produto nos itens
        itens_requisicao: req.itens_requisicao?.map(item => ({
          ...item,
          produto_nome: item.produtos?.nome,
          produto_unidade: item.produtos?.unidade,
          produto_categoria: item.produtos?.categoria,
          produto_cod_item: item.produtos?.cod_item,
          produto_codigo_barras: item.produtos?.codigo_barras
        }))
      }))
    } catch (error) {
      console.error('Erro ao listar requisições:', error)
      throw error
    }
  },

  // Buscar requisição por ID
  async buscarPorId(id: string): Promise<Requisicao> {
    try {
      const { data, error } = await supabase
        .from('requisicoes')
        .select(`
          *,
          usuario_solicitante:usuarios!usuario_solicitante_id(nome, email),
          usuario_separacao:usuarios!usuario_separacao_id(nome),
          usuario_entrega:usuarios!usuario_entrega_id(nome),
          loja:lojas(nome, codigo),
          itens_requisicao(
            *,
            produtos(nome, unidade, categoria, cod_item, codigo_barras)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Requisição não encontrada')

      // Processar dados
      return {
        ...data,
        total_itens: data.itens_requisicao?.length || 0,
        itens_pendentes: data.itens_requisicao?.filter(i => i.status === 'pendente').length || 0,
        itens_separados: data.itens_requisicao?.filter(i => i.status === 'separado').length || 0,
        itens_entregues: data.itens_requisicao?.filter(i => i.status === 'entregue').length || 0,
        // Achatar dados do produto nos itens
        itens_requisicao: data.itens_requisicao?.map(item => ({
          ...item,
          produto_nome: item.produtos?.nome,
          produto_unidade: item.produtos?.unidade,
          produto_categoria: item.produtos?.categoria,
          produto_cod_item: item.produtos?.cod_item,
          produto_codigo_barras: item.produtos?.codigo_barras
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar requisição:', error)
      throw error
    }
  },

  // Atualizar requisição
  async atualizar(id: string, dados: Partial<Requisicao>): Promise<void> {
    try {
      const { error } = await supabase
        .from('requisicoes')
        .update(dados)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao atualizar requisição:', error)
      throw error
    }
  },

  // Cancelar requisição
  async cancelar(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('requisicoes')
        .update({ 
          status: 'cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao cancelar requisição:', error)
      throw error
    }
  },

  // Registrar entrega da requisição
  async registrarEntrega(id: string, usuario_entrega_id: string): Promise<void> {
    try {
      // 1. Buscar itens separados para obter suas quantidades
      const { data: itensSeparados, error: buscarError } = await supabase
        .from('itens_requisicao')
        .select('id, quantidade_separada')
        .eq('requisicao_id', id)
        .eq('status', 'separado')

      if (buscarError) throw buscarError

      // 2. Atualizar cada item separado para entregue
      if (itensSeparados && itensSeparados.length > 0) {
        for (const item of itensSeparados) {
          const { error: atualizarError } = await supabase
            .from('itens_requisicao')
            .update({
              status: 'entregue',
              quantidade_entregue: item.quantidade_separada,
              data_entrega_item: new Date().toISOString()
            })
            .eq('id', item.id)

          if (atualizarError) throw atualizarError
        }
      }

      // 3. Atualizar a requisição (trigger vai atualizar status automaticamente)
      const { error: reqError } = await supabase
        .from('requisicoes')
        .update({
          usuario_entrega_id,
          data_entrega: new Date().toISOString()
        })
        .eq('id', id)

      if (reqError) throw reqError
    } catch (error) {
      console.error('Erro ao registrar entrega:', error)
      throw error
    }
  },

  // Confirmar recebimento
  async confirmarRecebimento(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('requisicoes')
        .update({
          data_confirmacao: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao confirmar recebimento:', error)
      throw error
    }
  },

  // ================== ITENS ==================

  // Atualizar status de item
  async atualizarStatusItem(
    itemId: string, 
    status: StatusItemRequisicao,
    dados: {
      quantidade_separada?: number
      quantidade_entregue?: number
      observacoes_item?: string
    } = {}
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        ...dados
      }

      // Definir timestamp baseado no status
      if (status === 'separado') {
        updateData.data_separacao_item = new Date().toISOString()
      } else if (status === 'entregue') {
        updateData.data_entrega_item = new Date().toISOString()
      }

      const { error } = await supabase
        .from('itens_requisicao')
        .update(updateData)
        .eq('id', itemId)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao atualizar status do item:', error)
      throw error
    }
  },

  // Separar item (marcar como separado)
  async separarItem(itemId: string, quantidadeSeparada: number, observacoes?: string): Promise<void> {
    await this.atualizarStatusItem(itemId, 'separado', {
      quantidade_separada: quantidadeSeparada,
      observacoes_item: observacoes
    })
  },

  // Marcar item como em falta
  async marcarEmFalta(itemId: string, observacoes?: string): Promise<void> {
    await this.atualizarStatusItem(itemId, 'em_falta', {
      observacoes_item: observacoes
    })
  },

  // Cancelar item
  async cancelarItem(itemId: string, observacoes?: string): Promise<void> {
    await this.atualizarStatusItem(itemId, 'cancelado', {
      observacoes_item: observacoes
    })
  },

  // ================== ESTATÍSTICAS ==================

  // Obter estatísticas do dashboard
  async obterEstatisticas(loja_id: string, usuario_id?: string): Promise<{
    total: number
    pendentes: number
    separadas: number
    entregues: number
    minhas_pendentes?: number
    aguardando_confirmacao?: number
  }> {
    try {
      let query = supabase
        .from('requisicoes')
        .select('status')
        .eq('loja_id', loja_id)

      const { data: todas, error: todasError } = await query
      if (todasError) throw todasError

      const stats = {
        total: todas?.length || 0,
        pendentes: todas?.filter(r => r.status === 'pendente').length || 0,
        separadas: todas?.filter(r => r.status === 'separado').length || 0,
        entregues: todas?.filter(r => r.status === 'entregue').length || 0
      }

      // Se for usuário específico, buscar estatísticas pessoais
      if (usuario_id) {
        const { data: minhas, error: minhasError } = await supabase
          .from('requisicoes')
          .select('status')
          .eq('loja_id', loja_id)
          .eq('usuario_solicitante_id', usuario_id)

        if (minhasError) throw minhasError

        return {
          ...stats,
          minhas_pendentes: minhas?.filter(r => r.status === 'pendente').length || 0,
          aguardando_confirmacao: minhas?.filter(r => r.status === 'entregue').length || 0
        }
      }

      return stats
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw error
    }
  }
}