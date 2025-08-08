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
      // Limpar parâmetros de entrada
      const codItemLimpo = codItem?.trim()
      const lojaIdLimpo = lojaId?.trim()
      
      console.log("🧹 [SERVICE] Parâmetros após limpeza:")
      console.log(`  - codItem original: "${codItem}"`)
      console.log(`  - codItem limpo: "${codItemLimpo}"`)
      console.log(`  - lojaId original: "${lojaId}"`)
      console.log(`  - lojaId limpo: "${lojaIdLimpo}"`)
      
      // Primeiro, verificar se o usuário está autenticado no Supabase
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      console.log("🔐 [SERVICE] Status autenticação Supabase:", authUser?.user ? 'AUTENTICADO' : 'NÃO AUTENTICADO')
      console.log("🆔 [SERVICE] User ID Supabase:", authUser?.user?.id)
      
      if (authError) {
        console.error("🚫 [SERVICE] Erro de autenticação:", authError)
      }

      // Testar uma query simples primeiro para verificar conectividade
      console.log("🧪 [SERVICE] Testando conectividade com query simples...")
      const { data: testData, error: testError } = await supabase
        .from('requisicoes_sugestao')
        .select('*')
        .limit(5)
        
      console.log("🧪 [SERVICE] Resultado teste conectividade:", testData, testError)
      
      // Testar se consegue ver TODOS os registros da tabela
      console.log("🔍 [SERVICE] Testando query sem filtros...")
      const { data: allData, error: allError } = await supabase
        .from('requisicoes_sugestao')
        .select('*')
        
      console.log("📊 [SERVICE] Todos os registros:", allData?.length || 0, "registros encontrados")
      console.log("📋 [SERVICE] Primeiros registros:", allData?.slice(0, 3))
      
      // Mostrar detalhes dos registros para debug
      if (allData) {
        allData.forEach((registro, index) => {
          console.log(`📝 [SERVICE] Registro ${index + 1}:`)
          console.log(`  - cod_item: "${registro.cod_item}" (tipo: ${typeof registro.cod_item})`)
          console.log(`  - dia_da_semana: ${registro.dia_da_semana} (tipo: ${typeof registro.dia_da_semana})`)
          console.log(`  - loja_id: "${registro.loja_id}" (tipo: ${typeof registro.loja_id})`)
          console.log(`  - qtd_media: ${registro.qtd_media}`)
        })
      }
      
      if (allError) {
        console.log("❌ [SERVICE] Erro ao buscar todos:", allError)
      }

      console.log("🔎 [SERVICE] Executando query no Supabase:")
      console.log("  SELECT * FROM requisicoes_sugestao")
      console.log(`  WHERE cod_item = "${codItemLimpo}" (tipo: ${typeof codItemLimpo})`)
      console.log(`  AND dia_da_semana = ${diaSemana} (tipo: ${typeof diaSemana})`)
      console.log(`  AND loja_id = "${lojaIdLimpo}" (tipo: ${typeof lojaIdLimpo})`)
      
      const { data, error } = await supabase
        .from('requisicoes_sugestao')
        .select('*')
        .eq('cod_item', codItemLimpo)
        .eq('dia_da_semana', diaSemana)
        .eq('loja_id', lojaIdLimpo)
        .single()

      if (error) {
        console.log("⚠️ [SERVICE] Erro retornado do Supabase:", error)
        if (error.code === 'PGRST116') {
          // Nenhum registro encontrado - não é um erro
          console.log("📭 [SERVICE] Nenhum registro encontrado (PGRST116)")
          return null
        }
        throw error
      }

      console.log("✅ [SERVICE] Dados encontrados:", data)
      return data
    } catch (error) {
      console.error('💥 [SERVICE] Erro ao buscar sugestão:', error)
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
    console.log("🔍 [SERVICE] buscarSugestaoPorDataEntrega chamado com:")
    console.log("  - codItem:", codItem)
    console.log("  - dataEntrega:", dataEntrega)
    console.log("  - lojaId:", lojaId)
    
    const diaSemana = obterDiaSemanaData(dataEntrega)
    const nomeDia = obterNomeDiaSemana(diaSemana)
    
    console.log("📅 [SERVICE] Dia da semana calculado:", diaSemana, "(" + nomeDia + ")")
    
    const sugestao = await this.buscarSugestao(codItem, diaSemana, lojaId)
    
    console.log("💾 [SERVICE] Resultado da busca no banco:", sugestao)

    return {
      sugestao,
      diaSemana,
      nomeDia
    }
  }
}