import { supabase } from './supabase'

// Interfaces
export interface Produto {
  codigo: string
  nome: string
  categoria: string
  unidade: string
  preco_custo?: number
  preco_venda?: number
  cod_item?: string
}

export interface NovaTransformacao {
  loja_id: string
  produto_bruto_codigo: string
  produto_bruto_nome: string
  quantidade_inicial: number
  unidade_inicial: string
  custo_medio: number
  percentual_quebra: number // Agora representa peso da quebra, não porcentagem
  data_transformacao: string
  dias_validade: number
  observacoes?: string
  itens: NovoItemTransformacao[]
}

export interface NovoItemTransformacao {
  produto_porcao_codigo: string // Gerado automaticamente: lote + número
  produto_porcao_nome: string
  quantidade_porcoes: number    // Inserido pelo usuário
  peso_medio_porcao: number     // Calculado automaticamente: quantidade_utilizada / quantidade_porcoes
  unidade_porcao: string
  quantidade_utilizada: number  // Inserido pelo usuário (peso total da porção)
  custo_unitario: number
  ponto_reposicao?: number
}

export interface Transformacao {
  id?: string
  numero_lote: string
  loja_id: string
  produto_bruto_codigo: string
  produto_bruto_nome: string
  quantidade_inicial: number
  unidade_inicial: string
  custo_medio: number
  percentual_quebra: number // Peso da quebra em kg/g, não porcentagem
  quantidade_liquida?: number
  custo_liquido?: number
  data_transformacao: string
  dias_validade: number
  status: 'ativo' | 'finalizado' | 'cancelado'
  observacoes?: string
  created_by?: string
  created_at?: string
  updated_at?: string
  // Dados relacionais
  total_itens?: number
  total_porcoes?: number
  itens?: ItemTransformacao[]
}

export interface ItemTransformacao {
  id?: string
  transformacao_id: string
  produto_porcao_codigo: string
  produto_porcao_nome: string
  quantidade_porcoes: number
  peso_medio_porcao: number
  unidade_porcao: string
  quantidade_utilizada: number  // Peso total da porção (input do usuário)
  custo_unitario: number
  ponto_reposicao?: number
  created_at?: string
  etiquetas?: EtiquetaTransformacao[]
}

export interface EtiquetaTransformacao {
  id?: string
  transformacao_id: string
  item_id: string
  numero_lote: string
  numero_peca: number
  codigo_barras?: string
  codigo_produto: string
  nome_produto: string
  peso_real: number
  unidade: string
  data_producao: string
  data_validade: string
  dias_validade: number
  qr_code_data: QRCodeData
  qr_code_hash: string
  status: 'ativo' | 'usado' | 'vencido' | 'cancelado'
  impresso: boolean
  data_impressao?: string
  reimpressoes: number
  created_at?: string
}

export interface QRCodeData {
  lote: string
  peca: number
  produto: string
  nome: string
  peso: number
  unidade: string
  validade: string
  producao: string
  transformacao: string
  codigo_barras: string
  criado: string
}

export interface FiltrosTransformacao {
  data_inicio?: string
  data_fim?: string
  status?: string
  produto_bruto?: string
  numero_lote?: string
}

export interface EstatisticasTransformacao {
  total_transformacoes: number
  total_porcoes_geradas: number
  peso_total_processado: number
  quebra_media: number
  produto_mais_transformado: string
  transformacoes_mes_atual: number
}

// Função utilitária para retry
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      if (attempt === maxRetries) break
      
      // Verificar se é erro de tabela não existente
      if (error.message?.includes('does not exist') || 
          error.message?.includes('relation') ||
          error.code === '42P01') {
        throw error // Não tentar novamente para erros de schema
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError || new Error('All retry attempts failed')
}

// Serviço principal
export const transformacaoService = {
  // Listar transformações
  async listar(lojaId: string, filtros?: FiltrosTransformacao) {
    console.log('🔍 transformacaoService.listar iniciado para loja:', lojaId, 'filtros:', filtros)
    
    try {
      // Verificar se tabelas existem
      const { error: tableCheckError } = await supabase
        .from('transformacoes')
        .select('count', { count: 'exact', head: true })

      if (tableCheckError) {
        if (tableCheckError.message?.includes('does not exist') || 
            tableCheckError.message?.includes('relation') ||
            tableCheckError.code === '42P01') {
          console.log('🔍 Tabelas de transformação não existem ainda')
          return [] as Transformacao[]
        }
      }

      console.log('✅ Tabelas encontradas, fazendo consulta')
      
      let query = supabase
        .from('transformacoes')
        .select(`
          id, numero_lote, loja_id, produto_bruto_codigo, produto_bruto_nome,
          quantidade_inicial, unidade_inicial, custo_medio, percentual_quebra,
          quantidade_liquida, custo_liquido, data_transformacao, dias_validade,
          status, observacoes, created_by, created_at, updated_at,
          transformacao_itens (
            id, quantidade_porcoes, peso_medio_porcao
          )
        `)
        .eq('loja_id', lojaId)

      // Aplicar filtros
      if (filtros?.data_inicio) {
        query = query.gte('data_transformacao', filtros.data_inicio)
      }
      if (filtros?.data_fim) {
        query = query.lte('data_transformacao', filtros.data_fim)
      }
      if (filtros?.status) {
        query = query.eq('status', filtros.status)
      }
      if (filtros?.produto_bruto) {
        query = query.ilike('produto_bruto_nome', `%${filtros.produto_bruto}%`)
      }
      if (filtros?.numero_lote) {
        query = query.ilike('numero_lote', `%${filtros.numero_lote}%`)
      }

      const { data, error } = await query.order('data_transformacao', { ascending: false })

      if (error) {
        console.error('❌ Erro na consulta de transformações:', error)
        return [] as Transformacao[]
      }

      console.log('📦 Dados brutos recebidos:', data?.length || 0, 'registros')

      // Processar dados
      const transformacoesProcessadas = (data || []).map((transformacao: any) => {
        const itens = transformacao.transformacao_itens || []
        return {
          ...transformacao,
          total_itens: itens.length,
          total_porcoes: itens.reduce((acc: number, item: any) => acc + (item.quantidade_porcoes || 0), 0)
        }
      }) as Transformacao[]

      console.log('✅ Transformações listadas:', transformacoesProcessadas.length)
      return transformacoesProcessadas

    } catch (error: any) {
      console.warn('Módulo transformação não configurado ainda:', error?.message || 'Erro desconhecido')
      return [] as Transformacao[]
    }
  },

  // Obter transformação por ID
  async obter(id: string) {
    console.log('🔍 transformacaoService.obter:', id)
    
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('transformacoes')
        .select(`
          id, numero_lote, loja_id, produto_bruto_codigo, produto_bruto_nome,
          quantidade_inicial, unidade_inicial, custo_medio, percentual_quebra,
          quantidade_liquida, custo_liquido, data_transformacao, dias_validade,
          status, observacoes, created_by, created_at, updated_at,
          transformacao_itens (
            id, produto_porcao_codigo, produto_porcao_nome, quantidade_porcoes,
            peso_medio_porcao, unidade_porcao, quantidade_utilizada,
            custo_unitario, ponto_reposicao, created_at,
            etiquetas_transformacao (
              id, numero_peca, codigo_barras, peso_real, data_validade,
              status, impresso, reimpressoes
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Processar dados relacionais
      const transformacaoCompleta = {
        ...data,
        total_itens: data.transformacao_itens?.length || 0,
        total_porcoes: data.transformacao_itens?.reduce(
          (acc: number, item: any) => acc + item.quantidade_porcoes, 0
        ) || 0,
        itens: data.transformacao_itens?.map((item: any) => ({
          ...item,
          etiquetas: item.etiquetas_transformacao || []
        })) || []
      }

      return transformacaoCompleta as Transformacao
    })
  },

  // Criar nova transformação
  async criar(novaTransformacao: NovaTransformacao, usuarioId: string) {
    console.log('➕ transformacaoService.criar:', novaTransformacao.produto_bruto_nome)
    
    try {
      // Verificar se tabelas existem
      const { error: tableCheckError } = await supabase
        .from('transformacoes')
        .select('count', { count: 'exact', head: true })

      if (tableCheckError) {
        if (tableCheckError.message?.includes('does not exist') || 
            tableCheckError.message?.includes('relation') ||
            tableCheckError.code === '42P01') {
          throw new Error('Tabelas de transformação não foram criadas ainda. Execute o script SQL primeiro.')
        }
      }

      return withRetry(async () => {
        // Gerar número de lote automático
        const { data: numeroLoteData, error: loteError } = await supabase
          .rpc('gerar_numero_lote', { p_loja_id: novaTransformacao.loja_id })

        if (loteError) throw loteError

        const numeroLote = numeroLoteData

        // Calcular valores derivados (percentual_quebra agora é peso, não porcentagem)
        const quantidadeLiquida = novaTransformacao.quantidade_inicial - novaTransformacao.percentual_quebra
        const custoLiquido = novaTransformacao.custo_medio * novaTransformacao.quantidade_inicial

        // Inserir transformação principal
        const { data: transformacao, error: transformacaoError } = await supabase
          .from('transformacoes')
          .insert({
            numero_lote: numeroLote,
            loja_id: novaTransformacao.loja_id,
            produto_bruto_codigo: novaTransformacao.produto_bruto_codigo,
            produto_bruto_nome: novaTransformacao.produto_bruto_nome,
            quantidade_inicial: novaTransformacao.quantidade_inicial,
            unidade_inicial: novaTransformacao.unidade_inicial,
            custo_medio: novaTransformacao.custo_medio,
            percentual_quebra: novaTransformacao.percentual_quebra,
            quantidade_liquida: quantidadeLiquida,
            custo_liquido: custoLiquido,
            data_transformacao: novaTransformacao.data_transformacao,
            dias_validade: novaTransformacao.dias_validade,
            observacoes: novaTransformacao.observacoes,
            created_by: usuarioId
          })
          .select()
          .single()

        if (transformacaoError) throw transformacaoError

        // Inserir itens
        if (novaTransformacao.itens.length > 0) {
          const itensParaInserir = novaTransformacao.itens.map(item => ({
            transformacao_id: transformacao.id,
            produto_porcao_codigo: item.produto_porcao_codigo,
            produto_porcao_nome: item.produto_porcao_nome,
            quantidade_porcoes: item.quantidade_porcoes,
            peso_medio_porcao: item.peso_medio_porcao,
            unidade_porcao: item.unidade_porcao,
            quantidade_utilizada: item.quantidade_utilizada,
            custo_unitario: item.custo_unitario,
            ponto_reposicao: item.ponto_reposicao || 10
          }))

          const { error: itensError } = await supabase
            .from('transformacao_itens')
            .insert(itensParaInserir)

          if (itensError) throw itensError
        }

        console.log('✅ Transformação criada:', transformacao.id)
        return transformacao
      })
    } catch (error: any) {
      console.error('❌ Erro ao criar transformação:', error)
      throw error
    }
  },

  // Gerar etiquetas para uma transformação
  async gerarEtiquetas(transformacaoId: string, diasValidade?: number) {
    console.log('🏷️ Gerando etiquetas para transformação:', transformacaoId)
    
    return withRetry(async () => {
      // Buscar transformação e itens
      const { data: transformacao, error } = await supabase
        .from('transformacoes')
        .select(`
          id, numero_lote, data_transformacao, dias_validade,
          transformacao_itens (
            id, produto_porcao_codigo, produto_porcao_nome, quantidade_porcoes, peso_medio_porcao, unidade_porcao
          )
        `)
        .eq('id', transformacaoId)
        .single()

      if (error) throw error

      const etiquetasParaInserir: any[] = []
      const dataProducao = transformacao.data_transformacao
      const diasValidadeEfetivos = diasValidade || transformacao.dias_validade

      // Para cada item, gerar etiquetas individuais
      for (const item of transformacao.transformacao_itens || []) {
        for (let peca = 1; peca <= item.quantidade_porcoes; peca++) {
          // Calcular data de validade
          const { data: dataValidade, error: validadeError } = await supabase
            .rpc('calcular_data_validade', {
              p_data_producao: dataProducao,
              p_dias_validade: diasValidadeEfetivos
            })

          if (validadeError) throw validadeError

          // Gerar dados do QR Code
          const codigoBarras = `${transformacao.numero_lote}-${peca.toString().padStart(3, '0')}`
          const qrData: QRCodeData = {
            lote: transformacao.numero_lote,
            peca: peca,
            produto: item.produto_porcao_codigo,
            nome: item.produto_porcao_nome,
            peso: item.peso_medio_porcao,
            unidade: item.unidade_porcao,
            validade: dataValidade,
            producao: dataProducao,
            transformacao: transformacaoId,
            codigo_barras: codigoBarras,
            criado: new Date().toISOString()
          }

          const qrHash = btoa(JSON.stringify(qrData)).slice(0, 50)

          etiquetasParaInserir.push({
            transformacao_id: transformacaoId,
            item_id: item.id,
            numero_lote: transformacao.numero_lote,
            numero_peca: peca,
            codigo_barras: codigoBarras,
            codigo_produto: item.produto_porcao_codigo,
            nome_produto: item.produto_porcao_nome,
            peso_real: item.peso_medio_porcao,
            unidade: item.unidade_porcao,
            data_producao: dataProducao,
            data_validade: dataValidade,
            dias_validade: diasValidadeEfetivos,
            qr_code_data: qrData,
            qr_code_hash: qrHash
          })
        }
      }

      // Inserir todas as etiquetas
      const { data: etiquetas, error: etiquetasError } = await supabase
        .from('etiquetas_transformacao')
        .insert(etiquetasParaInserir)
        .select()

      if (etiquetasError) throw etiquetasError

      console.log('✅ Etiquetas geradas:', etiquetas.length)
      return etiquetas
    })
  },

  // Obter etiquetas de uma transformação
  async obterEtiquetas(transformacaoId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('etiquetas_transformacao')
        .select('*')
        .eq('transformacao_id', transformacaoId)
        .order('numero_peca')

      if (error) throw error
      return data as EtiquetaTransformacao[]
    })
  },

  // Marcar etiqueta como impressa
  async marcarEtiquetaImpressa(etiquetaId: string, reimpressao: boolean = false) {
    return withRetry(async () => {
      const updateData: any = {
        impresso: true,
        data_impressao: new Date().toISOString()
      }

      if (reimpressao) {
        // Incrementar contador de reimpressões
        const { data: current } = await supabase
          .from('etiquetas_transformacao')
          .select('reimpressoes')
          .eq('id', etiquetaId)
          .single()

        updateData.reimpressoes = (current?.reimpressoes || 0) + 1
      }

      const { error } = await supabase
        .from('etiquetas_transformacao')
        .update(updateData)
        .eq('id', etiquetaId)

      if (error) throw error
      return true
    })
  },

  // Obter estatísticas
  async obterEstatisticas(lojaId: string, dataInicio?: string, dataFim?: string) {
    console.log('📊 transformacaoService.obterEstatisticas:', lojaId)
    
    try {
      // Query base
      let query = supabase
        .from('transformacoes')
        .select('quantidade_inicial, percentual_quebra, produto_bruto_nome, data_transformacao, transformacao_itens(quantidade_porcoes)')
        .eq('loja_id', lojaId)
        .eq('status', 'ativo')

      // Aplicar filtros de data
      if (dataInicio) query = query.gte('data_transformacao', dataInicio)
      if (dataFim) query = query.lte('data_transformacao', dataFim)

      const { data, error } = await query

      if (error) throw error

      // Calcular estatísticas
      const transformacoes = data || []
      const totalTransformacoes = transformacoes.length
      const totalPorcoesGeradas = transformacoes.reduce((acc, t) => {
        const itens = t.transformacao_itens || []
        return acc + itens.reduce((sum: number, item: any) => sum + item.quantidade_porcoes, 0)
      }, 0)
      
      const pesoTotalProcessado = transformacoes.reduce((acc, t) => acc + (t.quantidade_inicial || 0), 0)
      const quebraMedia = transformacoes.length > 0 
        ? transformacoes.reduce((acc, t) => acc + (t.percentual_quebra || 0), 0) / transformacoes.length 
        : 0

      // Produto mais transformado
      const contagemProdutos: Record<string, number> = {}
      transformacoes.forEach(t => {
        const produto = t.produto_bruto_nome || 'N/A'
        contagemProdutos[produto] = (contagemProdutos[produto] || 0) + 1
      })
      
      const produtoMaisTransformado = Object.keys(contagemProdutos).length > 0
        ? Object.keys(contagemProdutos).reduce((a, b) => 
            contagemProdutos[a] > contagemProdutos[b] ? a : b
          )
        : 'N/A'

      // Transformações do mês atual
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const transformacoesMesAtual = transformacoes.filter(t => 
        new Date(t.data_transformacao) >= inicioMes
      ).length

      return {
        total_transformacoes: totalTransformacoes,
        total_porcoes_geradas: totalPorcoesGeradas,
        peso_total_processado: pesoTotalProcessado,
        quebra_media: quebraMedia,
        produto_mais_transformado: produtoMaisTransformado,
        transformacoes_mes_atual: transformacoesMesAtual
      } as EstatisticasTransformacao

    } catch (error: any) {
      console.warn('Erro ao calcular estatísticas:', error)
      return {
        total_transformacoes: 0,
        total_porcoes_geradas: 0,
        peso_total_processado: 0,
        quebra_media: 0,
        produto_mais_transformado: 'N/A',
        transformacoes_mes_atual: 0
      } as EstatisticasTransformacao
    }
  },

  // Buscar produtos disponíveis para transformação
  async buscarProdutos(lojaId: string, termo?: string) {
    try {
      console.log('🔍 Iniciando busca na tabela produtos...')
      console.log('🏪 Loja ID:', lojaId)
      
      let query = supabase
        .from('produtos')
        .select('id, nome, categoria, unidade, cod_item, ativo, loja_id')
        .eq('ativo', true)

      if (termo) {
        console.log('🔍 Aplicando filtro de busca:', termo)
        // Busca por nome, categoria e cod_item (se existir)
        query = query.or(`nome.ilike.%${termo}%,categoria.ilike.%${termo}%,cod_item.ilike.%${termo}%`)
      }

      console.log('🔍 Executando query...')
      
      const { data, error } = await query
        .order('nome', { ascending: true })
        .limit(50)

      if (error) {
        console.error('❌ Erro na query de produtos:', error)
        throw error
      }

      console.log('✅ Produtos encontrados:', data?.length || 0)
      
      if (data && data.length > 0) {
        console.log('📦 Primeiro produto:', data[0])
        
        // Converter para formato esperado pelo componente
        const produtosConvertidos = data.map(item => ({
          codigo: item.cod_item || item.id, // usar cod_item se disponível, senão usar id
          nome: item.nome,
          categoria: item.categoria,
          unidade: item.unidade,
          preco_custo: 0, // valor padrão
          preco_venda: 0  // valor padrão
        }))
        
        console.log('✅ Produtos convertidos:', produtosConvertidos.length)
        return produtosConvertidos as Produto[]
      }
      
      return [] as Produto[]

    } catch (error: any) {
      console.error('❌ Erro geral ao buscar produtos:', error)
      return [] as Produto[]
    }
  },

  // Deletar transformação
  async deletar(id: string, usuarioId: string) {
    console.log('🗑️ transformacaoService.deletar iniciado para:', id)
    
    try {
      // Verificar se a transformação existe e pertence à loja do usuário
      const { data: transformacao, error: consultaError } = await supabase
        .from('transformacoes')
        .select('id, numero_lote, status, loja_id')
        .eq('id', id)
        .single()

      if (consultaError || !transformacao) {
        throw new Error('Transformação não encontrada')
      }

      // Verificar se a transformação pode ser deletada
      if (transformacao.status === 'finalizado') {
        throw new Error('Não é possível deletar uma transformação finalizada')
      }

      // Deletar em cascata: primeiro as etiquetas, depois os itens, depois a transformação
      console.log('🗑️ Deletando etiquetas...')
      const { error: etiquetasError } = await supabase
        .from('etiquetas_transformacao')
        .delete()
        .eq('transformacao_id', id)

      if (etiquetasError) {
        console.warn('⚠️ Erro ao deletar etiquetas (pode não existir):', etiquetasError)
      }

      console.log('🗑️ Deletando itens da transformação...')
      const { error: itensError } = await supabase
        .from('transformacao_itens')
        .delete()
        .eq('transformacao_id', id)

      if (itensError) {
        console.warn('⚠️ Erro ao deletar itens:', itensError)
      }

      console.log('🗑️ Deletando transformação principal...')
      const { error: transformacaoError } = await supabase
        .from('transformacoes')
        .delete()
        .eq('id', id)

      if (transformacaoError) {
        throw transformacaoError
      }

      console.log('✅ Transformação deletada com sucesso:', transformacao.numero_lote)
      return true

    } catch (error: any) {
      console.error('❌ Erro ao deletar transformação:', error)
      throw error
    }
  }
}