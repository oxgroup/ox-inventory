import { supabase } from './supabase'
import { SETORES } from './setores'

// Types para dashboard de setores
export interface EstatisticasSetor {
  setor: string
  loja_id: string
  // Fichas Técnicas
  total_fichas: number
  fichas_ativas: number
  fichas_mes_atual: number
  // Requisições
  requisicoes_solicitadas: number
  requisicoes_para_setor: number
  requisicoes_pendentes: number
  // Inventários
  inventarios_realizados: number
  ultimo_inventario?: string
  // Atividade
  ultima_atividade: string
}

export interface AtividadeSetor {
  id: string
  tipo: 'ficha' | 'requisicao' | 'inventario'
  acao: 'criado' | 'atualizado' | 'finalizado'
  titulo: string
  descricao: string
  usuario: string
  data: string
  setor: string
}

export interface ResumoSetor {
  setor: string
  estatisticas: EstatisticasSetor
  atividades_recentes: AtividadeSetor[]
  fichas_populares: any[]
  requisicoes_pendentes: any[]
}

export interface SetorAtivo {
  nome: string
  emoji: string
  categoria: string
  total_fichas: number
  total_requisicoes: number
  total_inventarios: number
  ultima_atividade: string
  ativo: boolean
}

// Função auxiliar para retry
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000
        console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`, error)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError!
}

// Serviço principal do dashboard de setores
export const setoresDashboardService = {
  // Obter estatísticas completas de um setor
  async obterEstatisticasSetor(lojaId: string, setor: string): Promise<EstatisticasSetor> {
    return withRetry(async () => {
      console.log(`🔍 Obtendo estatísticas para setor: ${setor}`)
      
      try {
        // Fichas Técnicas do setor
        const fichasQuery = await supabase
          .from('pratos')
          .select('id, created_at, updated_at, setores')
          .eq('loja_id', lojaId)
          .eq('ativo', true)

        let fichas: any[] = []
        if (fichasQuery.data) {
          // Filtrar fichas que contêm o setor no array JSONB
          fichas = fichasQuery.data.filter((prato: any) => 
            prato.setores && Array.isArray(prato.setores) && prato.setores.includes(setor)
          )
        }

        const fichasMesAtual = fichas.filter(f => {
          const created = new Date(f.created_at)
          const umMesAtras = new Date()
          umMesAtras.setMonth(umMesAtras.getMonth() - 1)
          return created >= umMesAtras
        }).length

        // Requisições solicitadas pelo setor
        const reqSolicitadasQuery = await supabase
          .from('requisicoes')
          .select('id, status, created_at')
          .eq('loja_id', lojaId)
          .eq('setor_solicitante', setor)

        const reqSolicitadas = reqSolicitadasQuery.data || []
        const reqPendentes = reqSolicitadas.filter(r => r.status === 'pendente').length

        // Requisições PARA o setor (via produtos com setor_1)
        const reqParaSetorQuery = await supabase
          .from('itens_requisicao')
          .select(`
            id,
            produto_id,
            produtos!inner(setor_1),
            requisicoes!inner(id, loja_id, status)
          `)

        let reqParaSetor = 0
        if (reqParaSetorQuery.data) {
          reqParaSetor = reqParaSetorQuery.data.filter((item: any) => 
            item.requisicoes?.loja_id === lojaId && 
            item.produtos?.setor_1 === setor
          ).length
        }

        // Inventários do setor
        const inventariosQuery = await supabase
          .from('inventarios')
          .select('id, setor, data_criacao, status')
          .eq('loja_id', lojaId)
          .eq('setor', setor)

        const inventarios = inventariosQuery.data || []
        const ultimoInventario = inventarios.length > 0 
          ? inventarios.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime())[0]
          : null

        // Última atividade (mais recente entre fichas, requisições e inventários)
        const ultimasAtividades = [
          ...fichas.map(f => f.updated_at || f.created_at),
          ...reqSolicitadas.map(r => r.created_at),
          ...inventarios.map(i => i.data_criacao)
        ].sort().reverse()

        return {
          setor,
          loja_id: lojaId,
          // Fichas
          total_fichas: fichas.length,
          fichas_ativas: fichas.length,
          fichas_mes_atual: fichasMesAtual,
          // Requisições
          requisicoes_solicitadas: reqSolicitadas.length,
          requisicoes_para_setor: reqParaSetor,
          requisicoes_pendentes: reqPendentes,
          // Inventários
          inventarios_realizados: inventarios.length,
          ultimo_inventario: ultimoInventario?.data_criacao,
          // Atividade
          ultima_atividade: ultimasAtividades[0] || new Date().toISOString()
        }
      } catch (error) {
        console.error('Erro ao obter estatísticas do setor:', error)
        throw error
      }
    })
  },

  // Obter atividades recentes do setor
  async obterAtividadesRecentes(lojaId: string, setor: string, limite = 10): Promise<AtividadeSetor[]> {
    return withRetry(async () => {
      const atividades: AtividadeSetor[] = []

      try {
        // Atividades de Fichas Técnicas
        const fichasQuery = await supabase
          .from('pratos')
          .select(`
            id, nome, created_at, updated_at, setores,
            usuarios!pratos_usuario_id_fkey(nome)
          `)
          .eq('loja_id', lojaId)
          .eq('ativo', true)
          .order('updated_at', { ascending: false })
          .limit(limite * 2) // Buscar mais para depois filtrar

        if (fichasQuery.data) {
          const fichasFiltradas = fichasQuery.data.filter((f: any) => 
            f.setores && Array.isArray(f.setores) && f.setores.includes(setor)
          ).slice(0, limite)

          atividades.push(...fichasFiltradas.map((f: any) => ({
            id: f.id,
            tipo: 'ficha' as const,
            acao: f.created_at === f.updated_at ? 'criado' as const : 'atualizado' as const,
            titulo: f.nome,
            descricao: `Ficha técnica ${f.created_at === f.updated_at ? 'criada' : 'atualizada'}`,
            usuario: f.usuarios?.nome || 'Usuário desconhecido',
            data: f.updated_at || f.created_at,
            setor
          })))
        }

        // Atividades de Requisições
        const reqQuery = await supabase
          .from('requisicoes')
          .select(`
            id, numero_requisicao, status, created_at,
            usuarios!requisicoes_usuario_solicitante_id_fkey(nome)
          `)
          .eq('loja_id', lojaId)
          .eq('setor_solicitante', setor)
          .order('created_at', { ascending: false })
          .limit(limite)

        const requisicoes = reqQuery.data || []
        atividades.push(...requisicoes.map((r: any) => ({
          id: r.id,
          tipo: 'requisicao' as const,
          acao: r.status === 'pendente' ? 'criado' as const : 'atualizado' as const,
          titulo: `Requisição ${r.numero_requisicao}`,
          descricao: `Status: ${r.status}`,
          usuario: r.usuarios?.nome || 'Usuário desconhecido',
          data: r.created_at,
          setor
        })))

        // Atividades de Inventários
        const invQuery = await supabase
          .from('inventarios')
          .select(`
            id, setor, status, data_criacao,
            usuarios!inventarios_usuario_id_fkey(nome)
          `)
          .eq('loja_id', lojaId)
          .eq('setor', setor)
          .order('data_criacao', { ascending: false })
          .limit(limite)

        const inventarios = invQuery.data || []
        atividades.push(...inventarios.map((i: any) => ({
          id: i.id,
          tipo: 'inventario' as const,
          acao: i.status === 'em_contagem' ? 'criado' as const : 'finalizado' as const,
          titulo: `Inventário ${i.setor}`,
          descricao: `Status: ${i.status}`,
          usuario: i.usuarios?.nome || 'Usuário desconhecido',
          data: i.data_criacao,
          setor
        })))

        // Ordenar por data e limitar
        return atividades
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
          .slice(0, limite)

      } catch (error) {
        console.error('Erro ao obter atividades do setor:', error)
        return []
      }
    })
  },

  // Obter resumo completo do setor
  async obterResumoSetor(lojaId: string, setor: string): Promise<ResumoSetor> {
    return withRetry(async () => {
      try {
        const [estatisticas, atividades] = await Promise.all([
          this.obterEstatisticasSetor(lojaId, setor),
          this.obterAtividadesRecentes(lojaId, setor, 5)
        ])

        // Fichas mais populares (por número de ingredientes ou recentes)
        const fichasQuery = await supabase
          .from('pratos')
          .select('id, nome, created_at, setores')
          .eq('loja_id', lojaId)
          .eq('ativo', true)
          .order('created_at', { ascending: false })
          .limit(10)

        let fichasPopulares: any[] = []
        if (fichasQuery.data) {
          fichasPopulares = fichasQuery.data
            .filter((f: any) => f.setores && Array.isArray(f.setores) && f.setores.includes(setor))
            .slice(0, 3)
        }

        // Requisições pendentes
        const reqPendentesQuery = await supabase
          .from('requisicoes')
          .select('id, numero_requisicao, created_at')
          .eq('loja_id', lojaId)
          .eq('setor_solicitante', setor)
          .eq('status', 'pendente')
          .order('created_at', { ascending: false })
          .limit(3)

        return {
          setor,
          estatisticas,
          atividades_recentes: atividades,
          fichas_populares: fichasPopulares,
          requisicoes_pendentes: reqPendentesQuery.data || []
        }
      } catch (error) {
        console.error('Erro ao obter resumo do setor:', error)
        throw error
      }
    })
  },

  // Obter todos os setores com atividade na loja
  async obterSetoresAtivos(lojaId: string): Promise<SetorAtivo[]> {
    return withRetry(async () => {
      try {
        console.log('🔍 Buscando setores ativos para loja:', lojaId)

        const [fichasSetores, reqSetores, invSetores] = await Promise.all([
          // Setores com fichas técnicas
          supabase
            .from('pratos')
            .select('setores, updated_at')
            .eq('loja_id', lojaId)
            .eq('ativo', true),
          
          // Setores com requisições
          supabase
            .from('requisicoes')
            .select('setor_solicitante, created_at')
            .eq('loja_id', lojaId),
            
          // Setores com inventários
          supabase
            .from('inventarios')
            .select('setor, data_criacao')
            .eq('loja_id', lojaId)
        ])

        // Coletar estatísticas por setor
        const setoresMap = new Map<string, {
          fichas: number
          requisicoes: number
          inventarios: number
          ultimaAtividade: string
        }>()

        // Processar fichas técnicas
        fichasSetores.data?.forEach(ficha => {
          if (ficha.setores && Array.isArray(ficha.setores)) {
            ficha.setores.forEach((setor: string) => {
              const stats = setoresMap.get(setor) || {
                fichas: 0,
                requisicoes: 0,
                inventarios: 0,
                ultimaAtividade: ''
              }
              stats.fichas++
              if (!stats.ultimaAtividade || ficha.updated_at > stats.ultimaAtividade) {
                stats.ultimaAtividade = ficha.updated_at
              }
              setoresMap.set(setor, stats)
            })
          }
        })

        // Processar requisições
        reqSetores.data?.forEach(req => {
          if (req.setor_solicitante) {
            const stats = setoresMap.get(req.setor_solicitante) || {
              fichas: 0,
              requisicoes: 0,
              inventarios: 0,
              ultimaAtividade: ''
            }
            stats.requisicoes++
            if (!stats.ultimaAtividade || req.created_at > stats.ultimaAtividade) {
              stats.ultimaAtividade = req.created_at
            }
            setoresMap.set(req.setor_solicitante, stats)
          }
        })

        // Processar inventários
        invSetores.data?.forEach(inv => {
          if (inv.setor) {
            const stats = setoresMap.get(inv.setor) || {
              fichas: 0,
              requisicoes: 0,
              inventarios: 0,
              ultimaAtividade: ''
            }
            stats.inventarios++
            if (!stats.ultimaAtividade || inv.data_criacao > stats.ultimaAtividade) {
              stats.ultimaAtividade = inv.data_criacao
            }
            setoresMap.set(inv.setor, stats)
          }
        })

        // Converter para array e enriquecer com dados dos setores
        const setoresAtivos: SetorAtivo[] = []
        setoresMap.forEach((stats, nomeSetor) => {
          const setorInfo = SETORES.find(s => s.nome === nomeSetor)
          setoresAtivos.push({
            nome: nomeSetor,
            emoji: setorInfo?.emoji || '📍',
            categoria: setorInfo?.categoria || 'outros',
            total_fichas: stats.fichas,
            total_requisicoes: stats.requisicoes,
            total_inventarios: stats.inventarios,
            ultima_atividade: stats.ultimaAtividade || new Date().toISOString(),
            ativo: stats.fichas > 0 || stats.requisicoes > 0 || stats.inventarios > 0
          })
        })

        // Ordenar por última atividade
        return setoresAtivos.sort((a, b) => 
          new Date(b.ultima_atividade).getTime() - new Date(a.ultima_atividade).getTime()
        )

      } catch (error) {
        console.error('Erro ao obter setores ativos:', error)
        return []
      }
    })
  },

  // Buscar setores similares ou sugeridos
  async obterSetoresSugeridos(lojaId: string): Promise<string[]> {
    return withRetry(async () => {
      try {
        // Buscar setores que já têm alguma atividade mas podem ter mais
        const setoresAtivos = await this.obterSetoresAtivos(lojaId)
        const setoresComAtividade = setoresAtivos.map(s => s.nome)
        
        // Sugerir setores básicos que toda operação deveria ter
        const setoresEssenciais = [
          'Prep', 'Fogão', 'Bar', 'Estoque Seco', 
          'Câmara Resfriada', 'Câmara Congelada'
        ]
        
        // Retornar setores essenciais que ainda não têm atividade
        return setoresEssenciais.filter(setor => 
          !setoresComAtividade.includes(setor)
        )
      } catch (error) {
        console.error('Erro ao obter setores sugeridos:', error)
        return []
      }
    })
  }
}