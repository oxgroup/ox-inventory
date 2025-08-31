"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Clock, FileText, Package, BarChart3, Calendar, User, TrendingUp } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAuth } from "../../shared/hooks/useAuth"
import { setoresDashboardService, type ResumoSetor, type AtividadeSetor } from "../../shared/lib/setores-dashboard-service"
import { SETORES } from "../../shared/lib/setores"

export default function SetorPage() {
  const { usuario } = useAuth()
  const params = useParams()
  const router = useRouter()
  const setor = decodeURIComponent(params.setor as string)
  
  const [resumo, setResumo] = useState<ResumoSetor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (usuario && setor) {
      carregarResumo()
    }
  }, [usuario, setor])

  const carregarResumo = async () => {
    if (!usuario) return
    
    setLoading(true)
    try {
      const dados = await setoresDashboardService.obterResumoSetor(usuario.loja_id, setor)
      setResumo(dados)
    } catch (error) {
      console.error('Erro ao carregar resumo do setor:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatarDataAtividade = (data: string) => {
    try {
      return formatDistanceToNow(new Date(data), {
        addSuffix: true,
        locale: ptBR
      })
    } catch (error) {
      return "Data inválida"
    }
  }

  const obterInfoSetor = () => {
    return SETORES.find(s => s.nome === setor) || {
      nome: setor,
      emoji: '📍',
      categoria: 'outros'
    }
  }

  const renderAtividade = (atividade: AtividadeSetor) => {
    const getIconeAtividade = () => {
      switch (atividade.tipo) {
        case 'ficha':
          return <FileText className="w-4 h-4 text-[#3599B8]" />
        case 'requisicao':
          return <BarChart3 className="w-4 h-4 text-[#fabd07]" />
        case 'inventario':
          return <Package className="w-4 h-4 text-[#4AC5BB]" />
        default:
          return <Calendar className="w-4 h-4 text-[#5F6B6D]" />
      }
    }

    const getCorAcao = () => {
      switch (atividade.acao) {
        case 'criado':
          return 'text-green-600'
        case 'atualizado':
          return 'text-blue-600'
        case 'finalizado':
          return 'text-purple-600'
        default:
          return 'text-[#5F6B6D]'
      }
    }

    return (
      <div key={atividade.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
        <div className="flex-shrink-0 mt-1">
          {getIconeAtividade()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-[#5F6B6D] truncate">
              {atividade.titulo}
            </h4>
            <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${getCorAcao()}`}>
              {atividade.acao}
            </span>
          </div>
          <p className="text-xs text-[#5F6B6D]/60 mt-1">{atividade.descricao}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-[#5F6B6D]/60">
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              <span>{atividade.usuario}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatarDataAtividade(atividade.data)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <div className="text-[#5F6B6D]">Carregando...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3599B8] mx-auto"></div>
              <p className="text-[#5F6B6D] mt-4">Carregando dados do setor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const infoSetor = obterInfoSetor()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#5F6B6D]" />
            </button>
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{infoSetor.emoji}</span>
              <div>
                <h1 className="text-2xl font-bold text-[#5F6B6D]">{setor}</h1>
                <p className="text-[#5F6B6D]/70 capitalize">{infoSetor.categoria}</p>
              </div>
            </div>
          </div>
          <Link
            href="/setores"
            className="bg-white/20 text-[#5F6B6D] px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            Todos os Setores
          </Link>
        </div>

        {resumo && (
          <>
            {/* Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 text-[#3599B8]" />
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-[#5F6B6D]">
                    {resumo.estatisticas.total_fichas}
                  </h3>
                  <p className="text-sm text-[#5F6B6D]/60">Fichas Técnicas</p>
                  <p className="text-xs text-green-600">
                    +{resumo.estatisticas.fichas_mes_atual} este mês
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-8 h-8 text-[#fabd07]" />
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-[#5F6B6D]">
                    {resumo.estatisticas.requisicoes_solicitadas}
                  </h3>
                  <p className="text-sm text-[#5F6B6D]/60">Requisições</p>
                  <p className="text-xs text-orange-600">
                    {resumo.estatisticas.requisicoes_pendentes} pendentes
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
                <div className="flex items-center justify-between mb-4">
                  <Package className="w-8 h-8 text-[#4AC5BB]" />
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-[#5F6B6D]">
                    {resumo.estatisticas.inventarios_realizados}
                  </h3>
                  <p className="text-sm text-[#5F6B6D]/60">Inventários</p>
                  {resumo.estatisticas.ultimo_inventario && (
                    <p className="text-xs text-purple-600">
                      Último: {formatarDataAtividade(resumo.estatisticas.ultimo_inventario)}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-[#5F6B6D]" />
                  <TrendingUp className="w-5 h-5 text-gray-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#5F6B6D]">Atividade</h3>
                  <p className="text-sm text-[#5F6B6D]/60">Última atualização</p>
                  <p className="text-xs text-gray-600">
                    {formatarDataAtividade(resumo.estatisticas.ultima_atividade)}
                  </p>
                </div>
              </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Atividades Recentes */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#5F6B6D]">Atividades Recentes</h2>
                  <Clock className="w-5 h-5 text-[#5F6B6D]/60" />
                </div>
                
                {resumo.atividades_recentes.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {resumo.atividades_recentes.map(renderAtividade)}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#5F6B6D]/60">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma atividade recente encontrada</p>
                  </div>
                )}
              </div>

              {/* Seção Lateral */}
              <div className="space-y-6">
                {/* Fichas Populares */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
                  <h3 className="text-lg font-semibold text-[#5F6B6D] mb-4">Fichas Recentes</h3>
                  {resumo.fichas_populares.length > 0 ? (
                    <div className="space-y-3">
                      {resumo.fichas_populares.map((ficha: any) => (
                        <div key={ficha.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <span className="text-sm text-[#5F6B6D] truncate">{ficha.nome}</span>
                          <Link
                            href={`/fichas-tecnicas?setor=${encodeURIComponent(setor)}`}
                            className="text-xs text-[#3599B8] hover:underline"
                          >
                            Ver
                          </Link>
                        </div>
                      ))}
                      <Link
                        href={`/fichas-tecnicas?setor=${encodeURIComponent(setor)}`}
                        className="block text-center text-sm text-[#3599B8] hover:underline pt-2 border-t"
                      >
                        Ver todas as fichas do setor →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-[#5F6B6D]/60">Nenhuma ficha encontrada</p>
                  )}
                </div>

                {/* Requisições Pendentes */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
                  <h3 className="text-lg font-semibold text-[#5F6B6D] mb-4">Requisições Pendentes</h3>
                  {resumo.requisicoes_pendentes.length > 0 ? (
                    <div className="space-y-3">
                      {resumo.requisicoes_pendentes.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <span className="text-sm text-[#5F6B6D]">#{req.numero_requisicao}</span>
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                            Pendente
                          </span>
                        </div>
                      ))}
                      <Link
                        href={`/requisitions?setor=${encodeURIComponent(setor)}`}
                        className="block text-center text-sm text-[#3599B8] hover:underline pt-2 border-t"
                      >
                        Ver todas as requisições →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-[#5F6B6D]/60">Nenhuma requisição pendente</p>
                  )}
                </div>

                {/* Links Rápidos */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
                  <h3 className="text-lg font-semibold text-[#5F6B6D] mb-4">Ações Rápidas</h3>
                  <div className="space-y-3">
                    <Link
                      href={`/fichas-tecnicas?setor=${encodeURIComponent(setor)}`}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm text-[#5F6B6D]"
                    >
                      <span>Fichas Técnicas do Setor</span>
                      <FileText className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/inventory?setor=${encodeURIComponent(setor)}`}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm text-[#5F6B6D]"
                    >
                      <span>Inventários do Setor</span>
                      <Package className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}