import { supabase } from "./supabase"

// Interfaces para o módulo de desperdícios
export interface FotoDesperdicio {
  url: string
  nome: string
  tamanho: number
  tipo: string
  data_upload: string
}

export interface ItemDesperdicio {
  id?: string
  desperdicio_id?: string
  produto_id: string
  quantidade: number
  unidade: string
  valor_unitario?: number
  valor_total?: number
  observacoes?: string
  created_at?: string
  // Dados do produto (relacionamento)
  produto_nome?: string
  produto_categoria?: string
  produto_cod_item?: string
  produto_codigo_barras?: string
}

export interface Desperdicio {
  id?: string
  loja_id: string
  data_desperdicio: string
  setor: string
  responsavel_nome: string
  comentario?: string
  valor_total?: number
  fotos?: FotoDesperdicio[]
  status?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  // Dados relacionais
  loja_nome?: string
  loja_codigo?: string
  criado_por_nome?: string
  total_itens?: number
  quantidade_total_itens?: number
  itens?: ItemDesperdicio[]
}

export interface NovoDesperdicio {
  loja_id: string
  data_desperdicio: string
  setor: string
  responsavel_nome: string
  comentario?: string
  fotos?: FotoDesperdicio[]
  itens: NovoItemDesperdicio[]
}

export interface NovoItemDesperdicio {
  produto_id: string
  quantidade: number
  unidade: string
  valor_unitario?: number
  observacoes?: string
}

export interface EstatisticasDesperdicio {
  total_desperdicios: number
  valor_total: number
  media_valor_por_desperdicio: number
  setor_maior_desperdicio: string
  produto_mais_desperdicado: string
  desperdicios_mes_atual: number
  tendencia_mensal: string
}

export interface FiltrosDesperdicio {
  data_inicio?: string
  data_fim?: string
  setor?: string
  responsavel_nome?: string
  status?: string
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

// Serviço principal de desperdícios
export const desperdiciosService = {
  // Listar desperdícios com filtros
  async listar(lojaId: string, filtros?: FiltrosDesperdicio) {
    console.log('🔍 desperdiciosService.listar iniciado para loja:', lojaId, 'filtros:', filtros)
    
    // Retornar lista vazia sem usar withRetry para evitar multiple tentativas
    try {
      // Tentar uma consulta muito simples primeiro para ver se a tabela existe
      const { error: tableCheckError } = await supabase
        .from('desperdicios')
        .select('count', { count: 'exact', head: true })

      if (tableCheckError) {
        if (tableCheckError.message?.includes('does not exist') || 
            tableCheckError.message?.includes('relation') ||
            tableCheckError.code === '42P01') {
          console.log('🔍 Tabelas de desperdícios não existem ainda')
          return [] as Desperdicio[]
        }
      }

      console.log('✅ Tabelas encontradas, fazendo consulta')
      
      let query = supabase
        .from('desperdicios')
        .select(`
          id, loja_id, data_desperdicio, setor, responsavel_nome, comentario,
          valor_total, fotos, status, created_at, updated_at, created_by,
          desperdicios_itens (
            id, quantidade
          )
        `)
        .eq('loja_id', lojaId)

      // Aplicar filtros
      if (filtros?.data_inicio) {
        query = query.gte('data_desperdicio', filtros.data_inicio)
      }
      if (filtros?.data_fim) {
        query = query.lte('data_desperdicio', filtros.data_fim)
      }
      if (filtros?.setor) {
        query = query.eq('setor', filtros.setor)
      }
      if (filtros?.responsavel_nome) {
        query = query.eq('responsavel_nome', filtros.responsavel_nome)
      }

      const { data, error } = await query.order('data_desperdicio', { ascending: false })

      if (error) {
        console.error('❌ Erro na consulta de desperdícios:', error)
        return [] as Desperdicio[]
      }

      console.log('📦 Dados brutos recebidos:', data?.length || 0, 'registros')
      if (data && data.length > 0) {
        console.log('📦 Primeiro registro:', data[0])
      }

      // Processar dados calculando totais dos itens
      const desperdiciosProcessados = (data || []).map((desperdicio: any) => {
        const itens = desperdicio.desperdicios_itens || []
        return {
          ...desperdicio,
          loja_nome: desperdicio.loja_nome || 'Loja não informada',
          loja_codigo: desperdicio.loja_codigo || 'COD',
          criado_por_nome: desperdicio.criado_por_nome || 'Sistema',
          total_itens: itens.length,
          quantidade_total_itens: itens.reduce((acc: number, item: any) => acc + (item.quantidade || 0), 0),
          itens: itens
        }
      }) as Desperdicio[]

      console.log('✅ Desperdícios listados:', desperdiciosProcessados.length)
      return desperdiciosProcessados

    } catch (error: any) {
      console.warn('Módulo desperdícios não configurado ainda:', error?.message || 'Erro desconhecido')
      return [] as Desperdicio[]
    }
  },

  // Obter desperdício por ID
  async obter(id: string) {
    console.log('🔍 desperdiciosService.obter:', id)
    
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('desperdicios')
        .select(`
          id, loja_id, data_desperdicio, setor, responsavel_nome, comentario,
          valor_total, fotos, status, created_at, updated_at, created_by,
          lojas!desperdicios_loja_id_fkey (nome, codigo),
          desperdicios_itens (
            id, produto_id, quantidade, unidade, valor_unitario, valor_total, observacoes,
            produtos (nome, categoria, cod_item, codigo_barras)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Processar dados relacionais
      const desperdicioCompleto = {
        ...data,
        loja_nome: data.lojas?.nome,
        loja_codigo: data.lojas?.codigo,
        total_itens: data.desperdicios_itens?.length || 0,
        quantidade_total_itens: data.desperdicios_itens?.reduce((acc: number, item: any) => acc + item.quantidade, 0) || 0,
        itens: data.desperdicios_itens?.map((item: any) => ({
          ...item,
          produto_nome: item.produtos?.nome,
          produto_categoria: item.produtos?.categoria,
          produto_cod_item: item.produtos?.cod_item,
          produto_codigo_barras: item.produtos?.codigo_barras
        })) || []
      }

      return desperdicioCompleto as Desperdicio
    })
  },

  // Criar novo desperdício
  async criar(novoDesperdicio: NovoDesperdicio, usuarioId: string) {
    console.log('➕ desperdiciosService.criar:', novoDesperdicio.setor)
    
    try {
      // Verificar se tabelas existem primeiro
      const { error: tableCheckError } = await supabase
        .from('desperdicios')
        .select('count', { count: 'exact', head: true })

      if (tableCheckError) {
        if (tableCheckError.message?.includes('does not exist') || 
            tableCheckError.message?.includes('relation') ||
            tableCheckError.code === '42P01') {
          throw new Error('Tabelas de desperdícios não foram criadas ainda. Execute o script SQL primeiro.')
        }
      }

      return withRetry(async () => {
        // Inserir desperdício principal
        const { data: desperdicio, error: desperdicioError } = await supabase
          .from('desperdicios')
          .insert({
            loja_id: novoDesperdicio.loja_id,
            data_desperdicio: novoDesperdicio.data_desperdicio,
            setor: novoDesperdicio.setor,
            responsavel_nome: novoDesperdicio.responsavel_nome,
            comentario: novoDesperdicio.comentario,
            fotos: novoDesperdicio.fotos || [],
            created_by: usuarioId
          })
          .select()
          .single()

        if (desperdicioError) throw desperdicioError

        // Inserir itens se houver
        if (novoDesperdicio.itens.length > 0) {
          const itensParaInserir = novoDesperdicio.itens.map(item => ({
            desperdicio_id: desperdicio.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            unidade: item.unidade,
            valor_unitario: item.valor_unitario || 0,
            valor_total: (item.valor_unitario || 0) * item.quantidade,
            observacoes: item.observacoes
          }))

          const { error: itensError } = await supabase
            .from('desperdicios_itens')
            .insert(itensParaInserir)

          if (itensError) throw itensError
        }

        console.log('✅ Desperdício criado com sucesso:', desperdicio.id)
        return desperdicio
      })
    } catch (error: any) {
      console.error('❌ Erro ao criar desperdício:', error.message)
      throw error
    }
  },

  // Atualizar desperdício
  async atualizar(id: string, updates: Partial<Desperdicio>) {
    console.log('📝 desperdiciosService.atualizar:', id)
    
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('desperdicios')
        .update({
          data_desperdicio: updates.data_desperdicio,
          setor: updates.setor,
          responsavel_id: updates.responsavel_id,
          comentario: updates.comentario,
          fotos: updates.fotos
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Excluir desperdício (soft delete)
  async excluir(id: string) {
    console.log('🗑️ desperdiciosService.excluir:', id)
    
    return withRetry(async () => {
      const { error } = await supabase
        .from('desperdicios')
        .update({ status: 'inativo' })
        .eq('id', id)

      if (error) throw error
    })
  },

  // Obter estatísticas
  async obterEstatisticas(lojaId: string, dataInicio?: string, dataFim?: string) {
    console.log('📊 desperdiciosService.obterEstatisticas:', lojaId)
    
    // Sempre retornar estatísticas zeradas por padrão para evitar erros
    const estatisticasDefault = {
      total_desperdicios: 0,
      valor_total: 0,
      media_valor_por_desperdicio: 0,
      setor_maior_desperdicio: 'N/A',
      produto_mais_desperdicado: 'N/A',
      desperdicios_mes_atual: 0,
      tendencia_mensal: 'estável'
    } as EstatisticasDesperdicio

    try {
      // Verificar se tabela existe fazendo uma consulta bem simples
      const { error: tableCheckError } = await supabase
        .from('desperdicios')
        .select('count', { count: 'exact', head: true })

      if (tableCheckError) {
        if (tableCheckError.message?.includes('does not exist') || 
            tableCheckError.message?.includes('relation') ||
            tableCheckError.code === '42P01') {
          console.log('📊 Tabelas não existem, retornando estatísticas zeradas')
          return estatisticasDefault
        }
      }

      // Se chegou aqui, tentar calcular estatísticas manualmente
      return await this.calcularEstatisticasManualmente(lojaId, dataInicio, dataFim)
      
    } catch (error) {
      console.warn('Erro ao obter estatísticas, usando valores padrão:', error)
      return estatisticasDefault
    }
  },

  // Calcular estatísticas manualmente quando a função RPC não existe
  async calcularEstatisticasManualmente(lojaId: string, dataInicio?: string, dataFim?: string) {
    const estatisticasDefault = {
      total_desperdicios: 0,
      valor_total: 0,
      media_valor_por_desperdicio: 0,
      setor_maior_desperdicio: 'N/A',
      produto_mais_desperdicado: 'N/A',
      desperdicios_mes_atual: 0,
      tendencia_mensal: 'estável'
    } as EstatisticasDesperdicio

    try {
      // Buscar apenas os campos básicos para evitar erros de relacionamento
      let query = supabase
        .from('desperdicios')
        .select('id, valor_total, setor, data_desperdicio, created_at')
        .eq('loja_id', lojaId)
        .eq('status', 'ativo')

      if (dataInicio) {
        query = query.gte('data_desperdicio', dataInicio)
      }
      if (dataFim) {
        query = query.lte('data_desperdicio', dataFim)
      }

      const { data: desperdicios, error } = await query

      if (error) {
        console.warn('Erro na consulta básica de desperdícios:', error.message)
        return estatisticasDefault
      }

      const dados = desperdicios || []
      const total = dados.length
      const valorTotal = dados.reduce((sum, d) => sum + (d.valor_total || 0), 0)
      const media = total > 0 ? valorTotal / total : 0

      // Setor com maior desperdício
      const setorStats = dados.reduce((acc: Record<string, number>, d) => {
        acc[d.setor] = (acc[d.setor] || 0) + (d.valor_total || 0)
        return acc
      }, {})
      
      const setoresComDados = Object.keys(setorStats)
      const setorMaior = setoresComDados.length > 0 
        ? setoresComDados.reduce((a, b) => setorStats[a] > setorStats[b] ? a : b)
        : 'N/A'

      // Desperdicios deste mês
      const agora = new Date()
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
      const mesAtual = dados.filter(d => 
        new Date(d.data_desperdicio) >= inicioMes
      ).length

      return {
        total_desperdicios: total,
        valor_total: valorTotal,
        media_valor_por_desperdicio: media,
        setor_maior_desperdicio: setorMaior,
        produto_mais_desperdicado: 'N/A', // Simplicificado por enquanto
        desperdicios_mes_atual: mesAtual,
        tendencia_mensal: 'estável'
      } as EstatisticasDesperdicio

    } catch (error) {
      console.warn('Erro no cálculo manual de estatísticas:', error)
      return estatisticasDefault
    }
  },

  // Obter desperdícios por setor
  async listarPorSetor(lojaId: string, setor: string, limite?: number) {
    console.log('🏗️ desperdiciosService.listarPorSetor:', setor)
    
    return withRetry(async () => {
      let query = supabase
        .from('desperdicios')
        .select(`
          id, data_desperdicio, valor_total, comentario,
          usuarios!desperdicios_responsavel_id_fkey (nome)
        `)
        .eq('loja_id', lojaId)
        .eq('setor', setor)
        .eq('status', 'ativo')
        .order('data_desperdicio', { ascending: false })

      if (limite) {
        query = query.limit(limite)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    })
  }
}

// Serviço de itens de desperdício
export const itensDesperdicioService = {
  // Listar itens de um desperdício
  async listarPorDesperdicio(desperdicioId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('desperdicios_itens')
        .select(`
          *,
          produtos (nome, categoria, cod_item, codigo_barras)
        `)
        .eq('desperdicio_id', desperdicioId)
        .order('created_at')

      if (error) throw error

      const itensProcessados = data?.map(item => ({
        ...item,
        produto_nome: item.produtos?.nome,
        produto_categoria: item.produtos?.categoria,
        produto_cod_item: item.produtos?.cod_item,
        produto_codigo_barras: item.produtos?.codigo_barras
      })) || []

      return itensProcessados as ItemDesperdicio[]
    })
  },

  // Adicionar item a um desperdício
  async adicionar(item: NovoItemDesperdicio & { desperdicio_id: string }) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('desperdicios_itens')
        .insert({
          ...item,
          valor_total: (item.valor_unitario || 0) * item.quantidade
        })
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Atualizar item
  async atualizar(id: string, updates: Partial<ItemDesperdicio>) {
    return withRetry(async () => {
      const updateData = {
        ...updates,
        valor_total: updates.quantidade && updates.valor_unitario 
          ? updates.quantidade * updates.valor_unitario 
          : undefined
      }

      const { data, error } = await supabase
        .from('desperdicios_itens')
        .update(updateData)
        .eq('id', id)
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
        .from('desperdicios_itens')
        .delete()
        .eq('id', id)

      if (error) throw error
    })
  },

  // Atualizar todos os itens de um desperdício
  async atualizarItens(desperdicioId: string, itens: NovoItemDesperdicio[]) {
    return withRetry(async () => {
      // Remover itens existentes
      const { error: deleteError } = await supabase
        .from('desperdicios_itens')
        .delete()
        .eq('desperdicio_id', desperdicioId)

      if (deleteError) throw deleteError

      // Inserir novos itens
      if (itens.length > 0) {
        const itensParaInserir = itens.map(item => ({
          desperdicio_id: desperdicioId,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valor_unitario: item.valor_unitario || 0,
          valor_total: (item.valor_unitario || 0) * item.quantidade,
          observacoes: item.observacoes
        }))

        const { error: insertError } = await supabase
          .from('desperdicios_itens')
          .insert(itensParaInserir)

        if (insertError) throw insertError
      }

      return true
    })
  }
}

// Serviço de relatórios e análises
export const relatoriosDesperdicioService = {
  // Relatório por período
  async relatorioPorPeriodo(lojaId: string, dataInicio: string, dataFim: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('vw_desperdicios_por_setor')
        .select('*')
        .eq('loja_id', lojaId)
        .gte('mes', dataInicio)
        .lte('mes', dataFim)
        .order('mes', { ascending: false })

      if (error) throw error
      return data || []
    })
  },

  // Top produtos desperdiçados
  async topProdutosDesperdiciados(lojaId: string, limite: number = 10) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('desperdicios_itens')
        .select(`
          produtos (nome, categoria),
          quantidade,
          valor_total,
          desperdicios!inner (loja_id, status)
        `)
        .eq('desperdicios.loja_id', lojaId)
        .eq('desperdicios.status', 'ativo')

      if (error) throw error

      // Agrupar por produto e calcular totais
      const produtosAgrupados = data?.reduce((acc: any, item: any) => {
        const produtoNome = item.produtos?.nome || 'Produto não encontrado'
        
        if (!acc[produtoNome]) {
          acc[produtoNome] = {
            nome: produtoNome,
            categoria: item.produtos?.categoria,
            quantidade_total: 0,
            valor_total: 0,
            ocorrencias: 0
          }
        }
        
        acc[produtoNome].quantidade_total += item.quantidade
        acc[produtoNome].valor_total += item.valor_total || 0
        acc[produtoNome].ocorrencias += 1
        
        return acc
      }, {})

      const resultado = Object.values(produtosAgrupados || {})
        .sort((a: any, b: any) => b.quantidade_total - a.quantidade_total)
        .slice(0, limite)

      return resultado
    })
  },

  // Análise por setor
  async analisePorSetor(lojaId: string, periodo?: { inicio: string; fim: string }) {
    return withRetry(async () => {
      let query = supabase
        .from('desperdicios')
        .select(`
          setor,
          valor_total,
          data_desperdicio,
          desperdicios_itens (quantidade, valor_total)
        `)
        .eq('loja_id', lojaId)
        .eq('status', 'ativo')

      if (periodo) {
        query = query
          .gte('data_desperdicio', periodo.inicio)
          .lte('data_desperdicio', periodo.fim)
      }

      const { data, error } = await query

      if (error) throw error

      // Agrupar por setor
      const setoresAgrupados = data?.reduce((acc: any, desperdicio: any) => {
        const setor = desperdicio.setor
        
        if (!acc[setor]) {
          acc[setor] = {
            setor,
            total_desperdicios: 0,
            valor_total: 0,
            quantidade_total: 0
          }
        }
        
        acc[setor].total_desperdicios += 1
        acc[setor].valor_total += desperdicio.valor_total || 0
        acc[setor].quantidade_total += desperdicio.desperdicios_itens?.reduce((sum: number, item: any) => sum + item.quantidade, 0) || 0
        
        return acc
      }, {})

      return Object.values(setoresAgrupados || {})
        .sort((a: any, b: any) => b.valor_total - a.valor_total)
    })
  }
}