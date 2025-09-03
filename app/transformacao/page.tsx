"use client"

import { useState, useEffect } from "react"
import { Package, Plus, Printer, QrCode, TrendingUp, Weight } from "lucide-react"
import { useAuth } from "../shared/hooks/useAuth"
import { transformacaoService, type Transformacao, type EstatisticasTransformacao, type FiltrosTransformacao } from "../shared/lib/transformacao-service"
import { NovaTransformacao } from "./components/nova-transformacao"
import { ListagemTransformacoes } from "./components/listagem-transformacoes"
import { DetalheTransformacao } from "./components/detalhe-transformacao"
import { GeradorEtiquetas } from "./components/gerador-etiquetas"
import { FiltrosTransformacao as ComponenteFiltros } from "./components/filtros-transformacao"

type TelaAtiva = 'dashboard' | 'nova' | 'listagem' | 'detalhes' | 'etiquetas'

export default function TransformacaoPage() {
  const { usuario } = useAuth()
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('dashboard')
  const [transformacoes, setTransformacoes] = useState<Transformacao[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasTransformacao | null>(null)
  const [transformacaoSelecionada, setTransformacaoSelecionada] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosTransformacao>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (usuario) {
      carregarDados()
    }
  }, [usuario, filtros])

  const carregarDados = async () => {
    if (!usuario) return
    
    console.log('🔄 Iniciando carregamento de dados de transformação para usuário:', usuario.loja_id)
    setLoading(true)
    try {
      // Carregar lista de transformações
      console.log('📋 Carregando lista de transformações...')
      const listaResult = await transformacaoService.listar(usuario.loja_id, filtros)
      console.log('📋 Lista carregada:', listaResult.length, 'itens')
      
      // Carregar estatísticas
      console.log('📊 Carregando estatísticas...')
      const statsResult = await transformacaoService.obterEstatisticas(
        usuario.loja_id, 
        filtros.data_inicio, 
        filtros.data_fim
      )
      console.log('📊 Estatísticas carregadas:', statsResult)
      
      setTransformacoes(listaResult)
      setEstatisticas(statsResult)
    } catch (error) {
      console.error('❌ Erro ao carregar dados de transformação:', error)
      // Se há erro, definir valores padrão para não quebrar a interface
      setTransformacoes([])
      setEstatisticas({
        total_transformacoes: 0,
        total_porcoes_geradas: 0,
        peso_total_processado: 0,
        quebra_media: 0,
        produto_mais_transformado: 'N/A',
        transformacoes_mes_atual: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNovaTransformacao = () => {
    setTelaAtiva('nova')
  }

  const handleVoltar = () => {
    setTelaAtiva('dashboard')
    setTransformacaoSelecionada(null)
  }

  const handleVerListagem = () => {
    setTelaAtiva('listagem')
  }

  const handleVerDetalhes = (id: string) => {
    setTransformacaoSelecionada(id)
    setTelaAtiva('detalhes')
  }

  const handleGeradorEtiquetas = (transformacaoId?: string) => {
    if (transformacaoId) {
      setTransformacaoSelecionada(transformacaoId)
    }
    setTelaAtiva('etiquetas')
  }

  const handleTransformacaoCriada = () => {
    carregarDados()
    setTelaAtiva('dashboard')
  }

  const handleFiltrosChange = (novosFiltros: FiltrosTransformacao) => {
    setFiltros(novosFiltros)
  }

  const handleDeletarTransformacao = async (id: string, numeroLote: string) => {
    try {
      await transformacaoService.deletar(id, usuario!.id)
      alert(`✅ Transformação ${numeroLote} deletada com sucesso!`)
      carregarDados() // Recarregar a lista
    } catch (error: any) {
      console.error('Erro ao deletar transformação:', error)
      alert(`❌ Erro ao deletar transformação: ${error.message}`)
    }
  }

  const formatarPeso = (peso: number) => {
    if (peso >= 1000) {
      return `${(peso / 1000).toFixed(1)}kg`
    }
    return `${peso.toFixed(0)}g`
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
  if (telaAtiva === 'nova') {
    return (
      <NovaTransformacao 
        usuario={usuario}
        onVoltar={handleVoltar}
        onTransformacaoCriada={handleTransformacaoCriada}
      />
    )
  }

  if (telaAtiva === 'listagem') {
    return (
      <ListagemTransformacoes
        usuario={usuario}
        transformacoes={transformacoes}
        loading={loading}
        onVoltar={handleVoltar}
        onVerDetalhes={handleVerDetalhes}
        onFiltrosChange={handleFiltrosChange}
        onGeradorEtiquetas={handleGeradorEtiquetas}
        onDeletarTransformacao={handleDeletarTransformacao}
      />
    )
  }

  if (telaAtiva === 'detalhes' && transformacaoSelecionada) {
    return (
      <DetalheTransformacao
        transformacaoId={transformacaoSelecionada}
        usuario={usuario}
        onVoltar={handleVoltar}
        onGeradorEtiquetas={handleGeradorEtiquetas}
      />
    )
  }

  if (telaAtiva === 'etiquetas') {
    return (
      <GeradorEtiquetas
        transformacaoId={transformacaoSelecionada}
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
              🥩 Transformação de Proteínas
            </h1>
            <p className="text-[#5F6B6D]/70">
              Transforme produtos brutos em porções etiquetadas - {usuario.loja_nome}
            </p>
          </div>
          <button
            onClick={handleNovaTransformacao}
            className="bg-[#FB8281] hover:bg-[#FB8281]/90 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Transformação
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
                <Package className="w-8 h-8 text-[#3599B8]" />
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#5F6B6D]">
                  {estatisticas.total_transformacoes}
                </h3>
                <p className="text-sm text-[#5F6B6D]/60">Transformações</p>
                <p className="text-xs text-blue-600">
                  +{estatisticas.transformacoes_mes_atual} este mês
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <div className="flex items-center justify-between mb-4">
                <QrCode className="w-8 h-8 text-[#fabd07]" />
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#5F6B6D]">
                  {estatisticas.total_porcoes_geradas}
                </h3>
                <p className="text-sm text-[#5F6B6D]/60">Porções Geradas</p>
                <p className="text-xs text-orange-600">Etiquetas individuais</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <div className="flex items-center justify-between mb-4">
                <Weight className="w-8 h-8 text-[#4AC5BB]" />
                <TrendingUp className="w-5 h-5 text-teal-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#5F6B6D]">
                  {formatarPeso(estatisticas.peso_total_processado)}
                </h3>
                <p className="text-sm text-[#5F6B6D]/60">Total Processado</p>
                <p className="text-xs text-teal-600">
                  Quebra média: {estatisticas.quebra_media.toFixed(3)} kg
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <div className="flex items-center justify-between mb-4">
                <Printer className="w-8 h-8 text-[#5F6B6D]" />
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#5F6B6D]">
                  {estatisticas.produto_mais_transformado}
                </h3>
                <p className="text-sm text-[#5F6B6D]/60">Mais Transformado</p>
                <p className="text-xs text-purple-600">Produto líder</p>
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
          {/* Transformações Recentes */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#5F6B6D]">Transformações Recentes</h2>
              <button
                onClick={handleVerListagem}
                className="text-[#3599B8] hover:underline text-sm font-medium"
              >
                Ver todas →
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
            ) : transformacoes.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transformacoes.slice(0, 5).map((transformacao) => (
                  <div
                    key={transformacao.id}
                    className="border-b border-[#E8E8E8] pb-4 hover:bg-gray-50 p-2 rounded cursor-pointer"
                    onClick={() => handleVerDetalhes(transformacao.id!)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-[#5F6B6D]">
                        {transformacao.numero_lote} - {transformacao.produto_bruto_nome}
                      </h4>
                      <span className="text-sm font-bold text-[#3599B8]">
                        {formatarPeso(transformacao.quantidade_inicial)}
                      </span>
                    </div>
                    <p className="text-sm text-[#5F6B6D]/70 mb-2">
                      Data: {formatarData(transformacao.data_transformacao)}
                    </p>
                    <div className="flex justify-between items-center text-xs text-[#5F6B6D]/60">
                      <span>{transformacao.total_itens} tipos • {transformacao.total_porcoes} porções</span>
                      <span className="text-[#FB8281]">Quebra: {transformacao.percentual_quebra}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#5F6B6D]/60">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Módulo de Transformação</h3>
                <p className="mb-4">Nenhuma transformação registrada ainda</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-lg mx-auto mb-6">
                  <p className="text-sm text-amber-800 mb-3">
                    <strong>⚠️ Módulo não configurado</strong>
                  </p>
                  <div className="text-xs text-amber-700 text-left space-y-2">
                    <p><strong>Para ativar o módulo de transformação:</strong></p>
                    <ol className="space-y-1 pl-4">
                      <li>1. Execute o script: <code className="bg-amber-100 px-2 py-1 rounded">scripts/38-create-transformacao-module.sql</code></li>
                      <li>2. Recarregue a página</li>
                      <li>3. Faça a primeira transformação</li>
                    </ol>
                    <div className="mt-3 p-2 bg-amber-100 rounded">
                      <p><strong>💡 Dica:</strong> O script cria as tabelas necessárias no banco Supabase</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleNovaTransformacao}
                  className="bg-[#FB8281] text-white px-6 py-3 rounded-lg hover:bg-[#FB8281]/90 transition-colors"
                >
                  Fazer Primeira Transformação
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
                  onClick={handleNovaTransformacao}
                  className="w-full bg-[#FB8281] hover:bg-[#FB8281]/90 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nova Transformação
                </button>
                <button
                  onClick={() => handleGeradorEtiquetas()}
                  className="w-full bg-[#3599B8] hover:bg-[#3599B8]/90 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  Gerar Etiquetas
                </button>
                <button
                  onClick={handleVerListagem}
                  className="w-full bg-[#4AC5BB] hover:bg-[#4AC5BB]/90 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Ver Histórico
                </button>
              </div>
            </div>

            {/* Dicas */}
            <div className="bg-[#F4DDAE]/30 rounded-xl border-2 border-[#fabd07]/20 p-6">
              <h3 className="text-lg font-semibold text-[#5F6B6D] mb-4">💡 Dicas</h3>
              <div className="space-y-3 text-sm text-[#5F6B6D]/80">
                <p>• Registre quebras reais para cálculos precisos</p>
                <p>• Imprima etiquetas imediatamente após transformação</p>
                <p>• Configure datas de validade apropriadas</p>
                <p>• Mantenha a impressora conectada via USB</p>
                <p>• Use QR codes para rastreabilidade completa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}