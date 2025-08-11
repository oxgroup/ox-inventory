import { supabase } from "./supabase"

// Types para sugestões de requisições
export interface RequisicoesSubstao {
  id: string
  cod_item: string
  nome: string
  qtd_media: number
  dia_da_semana: number // 0 = Domingo, 6 = Sábado
  loja_id: string
  created_at: string
  updated_at: string
}

export interface NovaRequisicaoSugestao {
  cod_item: string
  nome: string
  qtd_media: number
  dia_da_semana: number
  loja_id: string
}

// Nomes dos dias da semana para exibição
export const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira', 
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
]

// Helper function para obter nome do dia
export const obterNomeDiaSemana = (diaSemana: number): string => {
  return DIAS_SEMANA[diaSemana] || 'Dia inválido'
}

// Helper function para obter dia da semana de uma data
export const obterDiaSemanaData = (dataString: string): number => {
  const data = new Date(dataString)
  return data.getDay() // 0 = Domingo, 6 = Sábado
}

// Service principal
export const requisicoesSugestaoService = {
  // Buscar sugestão específica por código do item, dia da semana e loja
  async buscarSugestao(codItem: string, diaSemana: number, lojaId: string): Promise<RequisicoesSubstao | null> {
    try {
      // Limpar parâmetros de entrada para evitar espaços em branco
      const codItemLimpo = codItem?.trim()
      const lojaIdLimpo = lojaId?.trim()
      
      const { data, error } = await supabase
        .from('requisicoes_sugestao')
        .select('*')
        .eq('cod_item', codItemLimpo)
        .eq('dia_da_semana', diaSemana)
        .eq('loja_id', lojaIdLimpo)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum registro encontrado - não é um erro
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar sugestão:', error)
      return null // Retorna null em caso de erro para não quebrar o fluxo
    }
  },

  // Buscar todas as sugestões de um produto (todos os dias da semana)
  async buscarSugestoesProduto(codItem: string, lojaId: string): Promise<RequisicoesSubstao[]> {
    try {
      const { data, error } = await supabase
        .from('requisicoes_sugestao')
        .select('*')
        .eq('cod_item', codItem)
        .eq('loja_id', lojaId)
        .order('dia_da_semana', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar sugestões do produto:', error)
      throw error
    }
  },

  // Listar todas as sugestões de uma loja
  async listarSugestoes(lojaId: string, filtros: {
    codItem?: string
    diaSemana?: number
    limite?: number
  } = {}): Promise<RequisicoesSubstao[]> {
    try {
      let query = supabase
        .from('requisicoes_sugestao')
        .select('*')
        .eq('loja_id', lojaId)
        .order('nome', { ascending: true })

      // Aplicar filtros
      if (filtros.codItem) {
        query = query.eq('cod_item', filtros.codItem)
      }
      if (filtros.diaSemana !== undefined) {
        query = query.eq('dia_da_semana', filtros.diaSemana)
      }
      if (filtros.limite) {
        query = query.limit(filtros.limite)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao listar sugestões:', error)
      throw error
    }
  },

  // Criar nova sugestão
  async criarSugestao(novaSugestao: NovaRequisicaoSugestao): Promise<RequisicoesSubstao> {
    try {
      const { data, error } = await supabase
        .from('requisicoes_sugestao')
        .insert(novaSugestao)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao criar sugestão:', error)
      throw error
    }
  },

  // Atualizar sugestão existente
  async atualizarSugestao(id: string, dados: Partial<RequisicoesSubstao>): Promise<RequisicoesSubstao> {
    try {
      const { data, error } = await supabase
        .from('requisicoes_sugestao')
        .update(dados)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao atualizar sugestão:', error)
      throw error
    }
  },

  // Excluir sugestão
  async excluirSugestao(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('requisicoes_sugestao')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao excluir sugestão:', error)
      throw error
    }
  },

  // Criar ou atualizar sugestão (upsert)
  async salvarSugestao(sugestao: NovaRequisicaoSugestao): Promise<RequisicoesSubstao> {
    try {
      const { data, error } = await supabase
        .from('requisicoes_sugestao')
        .upsert(sugestao, {
          onConflict: 'cod_item,dia_da_semana,loja_id'
        })
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao salvar sugestão:', error)
      throw error
    }
  },

  // Buscar sugestão com base em data de entrega (helper function)
  async buscarSugestaoPorDataEntrega(
    codItem: string, 
    dataEntrega: string, 
    lojaId: string
  ): Promise<{
    sugestao: RequisicoesSubstao | null
    diaSemana: number
    nomeDia: string
  }> {
    const diaSemana = obterDiaSemanaData(dataEntrega)
    const nomeDia = obterNomeDiaSemana(diaSemana)
    const sugestao = await this.buscarSugestao(codItem, diaSemana, lojaId)

    return {
      sugestao,
      diaSemana,
      nomeDia
    }
  }
}