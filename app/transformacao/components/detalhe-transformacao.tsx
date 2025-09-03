"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Package, QrCode, Calendar, Weight, Hash, Info, Tag } from "lucide-react"
import { transformacaoService, type Transformacao } from "../../shared/lib/transformacao-service"

interface DetalheTransformacaoProps {
  transformacaoId: string
  usuario: any
  onVoltar: () => void
  onGeradorEtiquetas: (transformacaoId: string) => void
}

export function DetalheTransformacao({
  transformacaoId,
  usuario,
  onVoltar,
  onGeradorEtiquetas
}: DetalheTransformacaoProps) {
  const [transformacao, setTransformacao] = useState<Transformacao | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarTransformacao()
  }, [transformacaoId])

  const carregarTransformacao = async () => {
    setLoading(true)
    try {
      const data = await transformacaoService.obter(transformacaoId)
      setTransformacao(data)
    } catch (error) {
      console.error('Erro ao carregar transformação:', error)
      alert('Erro ao carregar transformação')
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarPeso = (peso: number) => {
    if (peso >= 1) {
      return `${peso.toFixed(3)} kg`
    }
    return `${(peso * 1000).toFixed(0)} g`
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!transformacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-8 text-center">
            <h2 className="text-xl font-semibold text-[#5F6B6D] mb-4">
              Transformação não encontrada
            </h2>
            <button
              onClick={onVoltar}
              className="bg-[#3599B8] text-white px-4 py-2 rounded-lg hover:bg-[#3599B8]/90 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onVoltar}
              className="flex items-center gap-2 text-[#5F6B6D] hover:text-[#3599B8] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#5F6B6D]">
                Transformação {transformacao.numero_lote}
              </h1>
              <p className="text-[#5F6B6D]/70">
                {transformacao.produto_bruto_nome}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transformacao.status)}`}>
              {transformacao.status === 'ativo' ? 'Ativo' : 
               transformacao.status === 'finalizado' ? 'Finalizado' : 'Cancelado'}
            </span>
            <button
              onClick={() => onGeradorEtiquetas(transformacao.id!)}
              className="bg-[#fabd07] hover:bg-[#fabd07]/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Gerar Etiquetas
            </button>
          </div>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Produto Base */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
            <h2 className="text-lg font-semibold text-[#5F6B6D] mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produto Base
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#5F6B6D]/70">Nome</label>
                  <p className="text-[#5F6B6D] font-medium">{transformacao.produto_bruto_nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#5F6B6D]/70">Código</label>
                  <p className="text-[#5F6B6D]">{transformacao.produto_bruto_codigo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#5F6B6D]/70">Quantidade Inicial</label>
                  <p className="text-[#5F6B6D] font-medium">
                    {formatarPeso(transformacao.quantidade_inicial)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#5F6B6D]/70">Custo Médio</label>
                  <p className="text-[#5F6B6D] font-medium">
                    {formatarMoeda(transformacao.custo_medio)} / {transformacao.unidade_inicial}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#5F6B6D]/70">Quebra</label>
                  <p className="text-[#FB8281] font-medium">{transformacao.percentual_quebra}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#5F6B6D]/70">Quantidade Líquida</label>
                  <p className="text-[#4AC5BB] font-medium">
                    {formatarPeso(transformacao.quantidade_liquida || 0)}
                  </p>
                </div>
              </div>
            </div>
            
            {transformacao.observacoes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-[#5F6B6D]/70">Observações</label>
                <p className="text-[#5F6B6D] mt-1">{transformacao.observacoes}</p>
              </div>
            )}
          </div>

          {/* Informações Gerais */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <h2 className="text-lg font-semibold text-[#5F6B6D] mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Informações
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-[#5F6B6D]/70" />
                  <div>
                    <label className="text-sm font-medium text-[#5F6B6D]/70">Lote</label>
                    <p className="text-[#5F6B6D] font-medium">{transformacao.numero_lote}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#5F6B6D]/70" />
                  <div>
                    <label className="text-sm font-medium text-[#5F6B6D]/70">Data</label>
                    <p className="text-[#5F6B6D]">{formatarData(transformacao.data_transformacao)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#5F6B6D]/70" />
                  <div>
                    <label className="text-sm font-medium text-[#5F6B6D]/70">Validade</label>
                    <p className="text-[#5F6B6D]">{transformacao.dias_validade} dias</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
              <h2 className="text-lg font-semibold text-[#5F6B6D] mb-4">Resumo</h2>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#3599B8]">
                    {transformacao.total_porcoes || 0}
                  </div>
                  <div className="text-sm text-[#5F6B6D]/70">Total de Porções</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#fabd07]">
                    {transformacao.total_itens || 0}
                  </div>
                  <div className="text-sm text-[#5F6B6D]/70">Tipos de Porção</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#4AC5BB]">
                    {formatarMoeda(transformacao.custo_liquido || 0)}
                  </div>
                  <div className="text-sm text-[#5F6B6D]/70">Custo Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Porções Resultantes */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
          <h2 className="text-lg font-semibold text-[#5F6B6D] mb-6 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Porções Resultantes ({transformacao.itens?.length || 0})
          </h2>

          {transformacao.itens && transformacao.itens.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-[#E8E8E8]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Produto
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Quantidade
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Peso Médio
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Peso Total
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Custo Unit.
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Etiquetas
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {transformacao.itens.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-[#5F6B6D]">
                            {item.produto_porcao_nome}
                          </div>
                          <div className="text-sm text-[#5F6B6D]/70">
                            {item.produto_porcao_codigo}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#5F6B6D]">
                        {item.quantidade_porcoes} {item.unidade_porcao}
                      </td>
                      <td className="px-4 py-4 text-[#5F6B6D]">
                        {formatarPeso(item.peso_medio_porcao)}
                      </td>
                      <td className="px-4 py-4 text-[#5F6B6D]">
                        {formatarPeso(item.quantidade_utilizada)}
                      </td>
                      <td className="px-4 py-4 text-[#5F6B6D]">
                        {formatarMoeda(item.custo_unitario)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-[#3599B8]">
                            {item.etiquetas?.length || 0} geradas
                          </div>
                          <div className="text-[#5F6B6D]/70">
                            {item.etiquetas?.filter(e => e.impresso).length || 0} impressas
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-[#5F6B6D]/60">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma porção definida ainda</p>
            </div>
          )}
        </div>

        {/* Histórico de Etiquetas */}
        {transformacao.itens?.some(item => item.etiquetas && item.etiquetas.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
            <h2 className="text-lg font-semibold text-[#5F6B6D] mb-6 flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Etiquetas Geradas
            </h2>

            <div className="space-y-4">
              {transformacao.itens.map((item) => 
                item.etiquetas && item.etiquetas.length > 0 && (
                  <div key={item.id} className="border border-[#E8E8E8] rounded-lg p-4">
                    <h3 className="font-medium text-[#5F6B6D] mb-3">
                      {item.produto_porcao_nome}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {item.etiquetas.slice(0, 6).map((etiqueta) => (
                        <div key={etiqueta.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">
                              Peça #{etiqueta.numero_peca}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              etiqueta.impresso ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {etiqueta.impresso ? 'Impressa' : 'Pendente'}
                            </span>
                          </div>
                          <div className="text-xs text-[#5F6B6D]/70 space-y-1">
                            <p>Peso: {formatarPeso(etiqueta.peso_real)}</p>
                            <p>Val: {formatarData(etiqueta.data_validade)}</p>
                            {etiqueta.reimpressoes > 0 && (
                              <p>Reimpressões: {etiqueta.reimpressoes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {item.etiquetas.length > 6 && (
                        <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center text-[#5F6B6D]/70">
                          +{item.etiquetas.length - 6} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}