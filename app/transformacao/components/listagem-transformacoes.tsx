"use client"

import { useState } from "react"
import { ArrowLeft, Search, Eye, QrCode, Package, Calendar, Weight, Hash, Printer, Trash2 } from "lucide-react"
import { type Transformacao, type FiltrosTransformacao } from "../../shared/lib/transformacao-service"
import { FiltrosTransformacao as ComponenteFiltros } from "./filtros-transformacao"

interface ListagemTransformacoesProps {
  usuario: any
  transformacoes: Transformacao[]
  loading: boolean
  onVoltar: () => void
  onVerDetalhes: (id: string) => void
  onFiltrosChange: (filtros: FiltrosTransformacao) => void
  onGeradorEtiquetas: (transformacaoId: string) => void
  onDeletarTransformacao: (id: string, numeroLote: string) => void
}

export function ListagemTransformacoes({
  usuario,
  transformacoes,
  loading,
  onVoltar,
  onVerDetalhes,
  onFiltrosChange,
  onGeradorEtiquetas,
  onDeletarTransformacao
}: ListagemTransformacoesProps) {
  const [termoBusca, setTermoBusca] = useState('')

  const handleDeletarClick = (transformacao: Transformacao) => {
    const confirmacao = confirm(
      `⚠️ CONFIRMAR EXCLUSÃO\n\n` +
      `Deseja realmente deletar a transformação?\n\n` +
      `Lote: ${transformacao.numero_lote}\n` +
      `Produto: ${transformacao.produto_bruto_nome}\n` +
      `Status: ${getStatusText(transformacao.status)}\n\n` +
      `⚠️ Esta ação não pode ser desfeita!\n` +
      `Todas as porções e etiquetas também serão deletadas.`
    )

    if (confirmacao) {
      onDeletarTransformacao(transformacao.id!, transformacao.numero_lote)
    }
  }

  const transformacoesFiltradas = transformacoes.filter(transformacao =>
    transformacao.produto_bruto_nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    transformacao.numero_lote.toLowerCase().includes(termoBusca.toLowerCase())
  )

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarPeso = (peso: number) => {
    if (peso >= 1000) {
      return `${(peso / 1000).toFixed(1)}kg`
    }
    return `${peso.toFixed(0)}g`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800'
      case 'finalizado':
        return 'bg-blue-100 text-blue-800'
      case 'cancelado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo'
      case 'finalizado':
        return 'Finalizado'
      case 'cancelado':
        return 'Cancelado'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onVoltar}
            className="flex items-center gap-2 text-[#5F6B6D] hover:text-[#3599B8] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#5F6B6D]">Histórico de Transformações</h1>
            <p className="text-[#5F6B6D]/70">
              {transformacoesFiltradas.length} transformações encontradas
            </p>
          </div>
        </div>

        {/* Filtros */}
        <ComponenteFiltros
          filtros={{}}
          onChange={onFiltrosChange}
          usuario={usuario}
        />

        {/* Busca */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por produto ou número de lote..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] overflow-hidden">
          {loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse border-b border-[#E8E8E8] pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : transformacoesFiltradas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-[#E8E8E8]">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-[#5F6B6D]">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Lote
                      </div>
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-[#5F6B6D]">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Produto Base
                      </div>
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-[#5F6B6D]">
                      <div className="flex items-center gap-2">
                        <Weight className="w-4 h-4" />
                        Quantidade
                      </div>
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-[#5F6B6D]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Data
                      </div>
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-[#5F6B6D]">
                      Porções
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-[#5F6B6D]">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-[#5F6B6D]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {transformacoesFiltradas.map((transformacao) => (
                    <tr key={transformacao.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#5F6B6D]">
                          {transformacao.numero_lote}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-[#5F6B6D]">
                            {transformacao.produto_bruto_nome}
                          </div>
                          <div className="text-sm text-[#5F6B6D]/70">
                            {transformacao.produto_bruto_codigo}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatarPeso(transformacao.quantidade_inicial)}
                          </div>
                          <div className="text-[#5F6B6D]/70">
                            Quebra: {transformacao.percentual_quebra}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {formatarData(transformacao.data_transformacao)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium">
                            {transformacao.total_porcoes || 0} porções
                          </div>
                          <div className="text-[#5F6B6D]/70">
                            {transformacao.total_itens || 0} tipos
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transformacao.status)}`}>
                          {getStatusText(transformacao.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onVerDetalhes(transformacao.id!)}
                            className="text-[#3599B8] hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onGeradorEtiquetas(transformacao.id!)}
                            className="text-[#fabd07] hover:bg-yellow-50 p-2 rounded-lg transition-colors"
                            title="Gerar etiquetas"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          {transformacao.status !== 'finalizado' && (
                            <button
                              onClick={() => handleDeletarClick(transformacao)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="Deletar transformação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-[#5F6B6D]/60">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhuma transformação encontrada</h3>
              {termoBusca ? (
                <p>Tente ajustar os filtros ou termo de busca</p>
              ) : (
                <p>Nenhuma transformação foi registrada ainda</p>
              )}
            </div>
          )}
        </div>

        {/* Resumo */}
        {transformacoesFiltradas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
            <h3 className="font-medium text-[#5F6B6D] mb-4">Resumo dos Resultados</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#3599B8]">
                  {transformacoesFiltradas.length}
                </div>
                <div className="text-sm text-[#5F6B6D]/70">Transformações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#fabd07]">
                  {transformacoesFiltradas.reduce((acc, t) => acc + (t.total_porcoes || 0), 0)}
                </div>
                <div className="text-sm text-[#5F6B6D]/70">Total de Porções</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#4AC5BB]">
                  {formatarPeso(transformacoesFiltradas.reduce((acc, t) => acc + t.quantidade_inicial, 0))}
                </div>
                <div className="text-sm text-[#5F6B6D]/70">Peso Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FB8281]">
                  {transformacoesFiltradas.length > 0 
                    ? (transformacoesFiltradas.reduce((acc, t) => acc + t.percentual_quebra, 0) / transformacoesFiltradas.length).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-[#5F6B6D]/70">Quebra Média</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}