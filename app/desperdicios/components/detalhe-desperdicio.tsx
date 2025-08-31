"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Calendar, User, AlertTriangle, Package, Camera, FileText, Edit3 } from "lucide-react"
import { desperdiciosService, type Desperdicio } from "../../shared/lib/desperdicios-service"
import type { Usuario } from "../../shared/lib/auth"

interface DetalheDesperdicioProps {
  desperdicioId: string
  usuario: Usuario
  onVoltar: () => void
}

export function DetalheDesperdicio({ desperdicioId, usuario, onVoltar }: DetalheDesperdicioProps) {
  const [desperdicio, setDesperdicio] = useState<Desperdicio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fotoSelecionada, setFotoSelecionada] = useState<number | null>(null)

  useEffect(() => {
    carregarDesperdicio()
  }, [desperdicioId])

  const carregarDesperdicio = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await desperdiciosService.obter(desperdicioId)
      setDesperdicio(data)
    } catch (error) {
      console.error('Erro ao carregar desperdício:', error)
      setError('Erro ao carregar dados do desperdício')
    } finally {
      setLoading(false)
    }
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

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3599B8] mx-auto"></div>
          <p className="text-[#5F6B6D] mt-4">Carregando detalhes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-[#5F6B6D] text-lg mb-4">{error}</p>
          <button
            onClick={onVoltar}
            className="bg-[#3599B8] text-white px-6 py-3 rounded-lg hover:bg-[#3599B8]/90 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (!desperdicio) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onVoltar}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#5F6B6D]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#5F6B6D]">
                🗑️ Detalhes do Desperdício
              </h1>
              <p className="text-[#5F6B6D]/70">
                {desperdicio.setor} • {formatarData(desperdicio.data_desperdicio)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#5F6B6D]/70">Valor Total</p>
            <p className="text-2xl font-bold text-[#FB8281]">
              {formatarMoeda(desperdicio.valor_total || 0)}
            </p>
          </div>
        </div>

        {/* Informações Gerais */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
          <h2 className="text-lg font-semibold text-[#5F6B6D] mb-6">Informações Gerais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#5F6B6D]/60">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Data do Desperdício</span>
              </div>
              <p className="font-semibold text-[#5F6B6D]">
                {formatarData(desperdicio.data_desperdicio)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#5F6B6D]/60">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Setor</span>
              </div>
              <p className="font-semibold text-[#5F6B6D]">
                {desperdicio.setor}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#5F6B6D]/60">
                <User className="w-4 h-4" />
                <span className="text-sm">Responsável</span>
              </div>
              <p className="font-semibold text-[#5F6B6D]">
                {desperdicio.responsavel_nome}
              </p>
              {desperdicio.responsavel_email && (
                <p className="text-sm text-[#5F6B6D]/60">
                  {desperdicio.responsavel_email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#5F6B6D]/60">
                <Package className="w-4 h-4" />
                <span className="text-sm">Total de Itens</span>
              </div>
              <p className="font-semibold text-[#5F6B6D]">
                {desperdicio.total_itens} produto(s)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#5F6B6D]/60">
                <div className="w-4 h-4 bg-[#4AC5BB] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Kg</span>
                </div>
                <span className="text-sm">Quantidade Total</span>
              </div>
              <p className="font-semibold text-[#5F6B6D]">
                {(desperdicio.quantidade_total_itens || 0).toFixed(1)} unidades
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#5F6B6D]/60">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Registrado em</span>
              </div>
              <p className="font-semibold text-[#5F6B6D]">
                {formatarDataHora(desperdicio.created_at!)}
              </p>
              {desperdicio.criado_por_nome && (
                <p className="text-sm text-[#5F6B6D]/60">
                  por {desperdicio.criado_por_nome}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Comentários */}
        {desperdicio.comentario && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
            <h3 className="text-lg font-semibold text-[#5F6B6D] mb-4">
              <FileText className="w-5 h-5 inline mr-2" />
              Motivos do Desperdício
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#FB8281]">
              <p className="text-[#5F6B6D] leading-relaxed">
                {desperdicio.comentario}
              </p>
            </div>
          </div>
        )}

        {/* Produtos Desperdiçados */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
          <h3 className="text-lg font-semibold text-[#5F6B6D] mb-6">
            <Package className="w-5 h-5 inline mr-2" />
            Produtos Desperdiçados ({desperdicio.itens?.length || 0})
          </h3>

          {desperdicio.itens && desperdicio.itens.length > 0 ? (
            <div className="space-y-4">
              {desperdicio.itens.map((item, index) => (
                <div key={item.id || index} className="border border-[#E8E8E8] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#5F6B6D] text-lg">
                        {item.produto_nome}
                      </h4>
                      {item.produto_categoria && (
                        <p className="text-[#5F6B6D]/60 text-sm">
                          {item.produto_categoria}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#FB8281]">
                        {formatarMoeda(item.valor_total || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-medium text-[#5F6B6D]/60 mb-1">Quantidade</p>
                      <p className="font-semibold text-[#5F6B6D]">
                        {item.quantidade} {item.unidade}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-[#5F6B6D]/60 mb-1">Unidade</p>
                      <p className="font-semibold text-[#5F6B6D]">
                        {item.unidade}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-[#5F6B6D]/60 mb-1">Valor Unitário</p>
                      <p className="font-semibold text-[#5F6B6D]">
                        {formatarMoeda(item.valor_unitario || 0)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-[#5F6B6D]/60 mb-1">Valor Total</p>
                      <p className="font-semibold text-[#FB8281]">
                        {formatarMoeda(item.valor_total || 0)}
                      </p>
                    </div>
                  </div>

                  {(item.produto_cod_item || item.produto_codigo_barras) && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {item.produto_cod_item && (
                        <div>
                          <p className="text-xs font-medium text-[#5F6B6D]/60 mb-1">Código do Item</p>
                          <p className="font-mono text-sm text-[#5F6B6D]">
                            {item.produto_cod_item}
                          </p>
                        </div>
                      )}
                      
                      {item.produto_codigo_barras && (
                        <div>
                          <p className="text-xs font-medium text-[#5F6B6D]/60 mb-1">Código de Barras</p>
                          <p className="font-mono text-sm text-[#5F6B6D]">
                            {item.produto_codigo_barras}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {item.observacoes && (
                    <div className="bg-gray-50 rounded p-3 border-l-2 border-[#4AC5BB]">
                      <p className="text-xs font-medium text-[#5F6B6D]/60 mb-1">Observações</p>
                      <p className="text-sm text-[#5F6B6D]">
                        {item.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Resumo dos Itens */}
              <div className="border-t border-[#E8E8E8] pt-4 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#5F6B6D] font-medium">Total Geral:</span>
                  <span className="text-xl font-bold text-[#FB8281]">
                    {formatarMoeda(desperdicio.valor_total || 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[#5F6B6D]/60">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum item registrado</p>
            </div>
          )}
        </div>

        {/* Fotos */}
        {desperdicio.fotos && desperdicio.fotos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
            <h3 className="text-lg font-semibold text-[#5F6B6D] mb-6">
              <Camera className="w-5 h-5 inline mr-2" />
              Fotos do Desperdício ({desperdicio.fotos.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {desperdicio.fotos.map((foto, index) => (
                <div key={index} className="group cursor-pointer" onClick={() => setFotoSelecionada(index)}>
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={foto.url}
                      alt={foto.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-[#5F6B6D] truncate">
                      {foto.nome}
                    </p>
                    <p className="text-xs text-[#5F6B6D]/60">
                      {new Date(foto.data_upload).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Foto */}
      {fotoSelecionada !== null && desperdicio.fotos && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl max-h-full">
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-[#5F6B6D]">
                  {desperdicio.fotos[fotoSelecionada].nome}
                </h3>
                <button
                  onClick={() => setFotoSelecionada(null)}
                  className="text-[#5F6B6D] hover:text-red-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4">
                <img
                  src={desperdicio.fotos[fotoSelecionada].url}
                  alt={desperdicio.fotos[fotoSelecionada].nome}
                  className="max-w-full max-h-[70vh] object-contain mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}