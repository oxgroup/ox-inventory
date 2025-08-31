"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Calendar, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react"
import { useAuth } from "../shared/hooks/useAuth"
import { desperdiciosService, type Desperdicio, type EstatisticasDesperdicio, type FiltrosDesperdicio } from "../shared/lib/desperdicios-service"
import { NovoLancamento } from "./components/novo-lancamento"
import { ListagemDesperdicio } from "./components/listagem-desperdicios"
import { DetalheDesperdicio } from "./components/detalhe-desperdicio"
import { FiltrosDesperdicio as ComponenteFiltros } from "./components/filtros-desperdicios"

type TelaAtiva = 'dashboard' | 'novo' | 'listagem' | 'detalhes'

export default function DesperdiciosPage() {
  const { usuario } = useAuth()
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('dashboard')
  const [desperdicios, setDesperdicios] = useState<Desperdicio[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasDesperdicio | null>(null)
  const [desperdicioSelecionado, setDesperdicioSelecionado] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosDesperdicio>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (usuario) {
      carregarDados()
    }
  }, [usuario, filtros])

  const carregarDados = async () => {
    if (!usuario) return
    
    console.log('🔄 Iniciando carregamento de dados para usuário:', usuario.loja_id)
    setLoading(true)
    try {
      // Carregar lista de desperdícios primeiro
      console.log('📋 Carregando lista de desperdícios...')
      const listaResult = await desperdiciosService.listar(usuario.loja_id, filtros)
      console.log('📋 Lista carregada:', listaResult.length, 'itens')
      
      // Carregar estatísticas
      console.log('📊 Carregando estatísticas...')
      const statsResult = await desperdiciosService.obterEstatisticas(
        usuario.loja_id, 
        filtros.data_inicio, 
        filtros.data_fim
      )
      console.log('📊 Estatísticas carregadas:', statsResult)
      
      setDesperdicios(listaResult)
      setEstatisticas(statsResult)
    } catch (error) {
      console.error('❌ Erro ao carregar dados de desperdícios:', error)
      // Se há erro, definir valores padrão para não quebrar a interface
      setDesperdicios([])
      setEstatisticas({
        total_desperdicios: 0,
        valor_total: 0,
        media_valor_por_desperdicio: 0,
        setor_maior_desperdicio: 'N/A',
        produto_mais_desperdicado: 'N/A',
        desperdicios_mes_atual: 0,
        tendencia_mensal: 'estável'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNovoLancamento = () => {
    setTelaAtiva('novo')
  }

  const handleVoltar = () => {
    setTelaAtiva('dashboard')
    setDesperdicioSelecionado(null)
  }

  const handleVerListagem = () => {
    setTelaAtiva('listagem')
  }

  const handleVerDetalhes = (id: string) => {
    setDesperdicioSelecionado(id)
    setTelaAtiva('detalhes')
  }

  const handleLancamentoCriado = () => {
    carregarDados()
    setTelaAtiva('dashboard')
  }

  const handleFiltrosChange = (novosFiltros: FiltrosDesperdicio) => {
    setFiltros(novosFiltros)
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <div className="text-[#5F6B6D]">Carregando...</div>
      </div>
    )
  }

  // Renderizar tela ativa
  if (telaAtiva === 'novo') {
    return (
      <NovoLancamento 
        usuario={usuario}
        onVoltar={handleVoltar}
        onLancamentoCriado={handleLancamentoCriado}
      />
    )
  }

  if (telaAtiva === 'listagem') {
    return (
      <ListagemDesperdicio
        usuario={usuario}
        desperdicios={desperdicios}
        loading={loading}
        onVoltar={handleVoltar}
        onVerDetalhes={handleVerDetalhes}
        onFiltrosChange={handleFiltrosChange}
      />
    )
  }

  if (telaAtiva === 'detalhes' && desperdicioSelecionado) {
    return (
      <DetalheDesperdicio
        desperdicioId={desperdicioSelecionado}
        usuario={usuario}
        onVoltar={handleVoltar}
      />
    )
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#5F6B6D] mb-2">
              🗑️ Gestão de Desperdícios
            </h1>
            <p className="text-[#5F6B6D]/70">
              Controle e acompanhamento de desperdícios por setor - {usuario.loja_nome}
            </p>
          </div>
          <button
            onClick={handleNovoLancamento}
            className="bg-[#FB8281] hover:bg-[#FB8281]/90 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Lançamento
          </button>
        </div>

        {/* Estatísticas */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : estatisticas ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <div className="flex items-center justify-between mb-4">
                <Trash2 className="w-8 h-8 text-[#FB8281]" />
                <TrendingUp className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#5F6B6D]">
                  {estatisticas.total_desperdicios}
                </h3>
                <p className="text-sm text-[#5F6B6D]/60">Total de Desperdícios</p>
                <p className="text-xs text-red-600">
                  +{estatisticas.desperdicios_mes_atual} este mês
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-8 h-8 text-[#fabd07]" />
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#5F6B6D]">
                  {formatarMoeda(estatisticas.valor_total)}
                </h3>
                <p className="text-sm text-[#5F6B6D]/60">Valor Total</p>
                <p className="text-xs text-orange-600">
                  Média: {formatarMoeda(estatisticas.media_valor_por_desperdicio)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="w-8 h-8 text-[#4AC5BB]" />
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#5F6B6D]">
                  {estatisticas.setor_maior_desperdicio}
                </h3>
                <p className="text-sm text-[#5F6B6D]/60">Setor Crítico</p>
                <p className="text-xs text-blue-600">Maior incidência</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-8 h-8 text-[#5F6B6D]" />
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#5F6B6D]">
                  {estatisticas.produto_mais_desperdicado}
                </h3>
                <p className="text-sm text-[#5F6B6D]/60">Produto Crítico</p>
                <p className="text-xs text-purple-600">Mais desperdiçado</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Filtros */}
        <ComponenteFiltros
          filtros={filtros}
          onChange={handleFiltrosChange}
          usuario={usuario}
        />

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Desperdícios Recentes */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#5F6B6D]">Lançamentos Recentes</h2>
              <button
                onClick={handleVerListagem}
                className="text-[#3599B8] hover:underline text-sm font-medium"
              >
                Ver todos →
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse border-b border-[#E8E8E8] pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : desperdicios.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {desperdicios.slice(0, 5).map((desperdicio) => (
                  <div
                    key={desperdicio.id}
                    className="border-b border-[#E8E8E8] pb-4 hover:bg-gray-50 p-2 rounded cursor-pointer"
                    onClick={() => handleVerDetalhes(desperdicio.id!)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-[#5F6B6D]">
                        {desperdicio.setor} - {formatarData(desperdicio.data_desperdicio)}
                      </h4>
                      <span className="text-sm font-bold text-[#FB8281]">
                        {formatarMoeda(desperdicio.valor_total || 0)}
                      </span>
                    </div>
                    <p className="text-sm text-[#5F6B6D]/70 mb-2">
                      Responsável: {desperdicio.responsavel_nome}
                    </p>
                    <p className="text-xs text-[#5F6B6D]/60">
                      {desperdicio.total_itens} itens • {desperdicio.comentario?.substring(0, 50)}
                      {desperdicio.comentario && desperdicio.comentario.length > 50 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#5F6B6D]/60">
                <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Módulo de Desperdícios</h3>
                <p className="mb-4">Nenhum desperdício registrado ainda</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-lg mx-auto mb-6">
                  <p className="text-sm text-amber-800 mb-3">
                    <strong>⚠️ Módulo não configurado</strong>
                  </p>
                  <div className="text-xs text-amber-700 text-left space-y-2">
                    <p><strong>Para ativar o módulo de desperdícios:</strong></p>
                    <ol className="space-y-1 pl-4">
                      <li>1. Execute o script: <code className="bg-amber-100 px-2 py-1 rounded">scripts/36-desperdicios-simple-setup.sql</code></li>
                      <li>2. Recarregue a página</li>
                      <li>3. Faça o primeiro lançamento</li>
                    </ol>
                    <div className="mt-3 p-2 bg-amber-100 rounded">
                      <p><strong>💡 Dica:</strong> O script cria as tabelas necessárias no banco Supabase</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleNovoLancamento}
                  className="bg-[#FB8281] text-white px-6 py-3 rounded-lg hover:bg-[#FB8281]/90 transition-colors"
                >
                  Fazer Primeiro Lançamento
                </button>
              </div>
            )}
          </div>

          {/* Ações Rápidas */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <h3 className="text-lg font-semibold text-[#5F6B6D] mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <button
                  onClick={handleNovoLancamento}
                  className="w-full bg-[#FB8281] hover:bg-[#FB8281]/90 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Lançamento
                </button>
                <button
                  onClick={handleVerListagem}
                  className="w-full bg-[#3599B8] hover:bg-[#3599B8]/90 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Ver Relatórios
                </button>
              </div>
            </div>

            {/* Dicas */}
            <div className="bg-[#F4DDAE]/30 rounded-xl border-2 border-[#fabd07]/20 p-6">
              <h3 className="text-lg font-semibold text-[#5F6B6D] mb-4">💡 Dicas</h3>
              <div className="space-y-3 text-sm text-[#5F6B6D]/80">
                <p>• Registre desperdícios imediatamente para melhor controle</p>
                <p>• Tire fotos dos itens desperdiçados para análise</p>
                <p>• Identifique padrões por setor para ações preventivas</p>
                <p>• Revise periodicamente os produtos mais desperdiçados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}