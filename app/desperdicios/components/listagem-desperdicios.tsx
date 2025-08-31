"use client"

import { useState } from "react"
import { ArrowLeft, Eye, Calendar, User, Package, Camera, AlertTriangle } from "lucide-react"
import type { Desperdicio, FiltrosDesperdicio } from "../../shared/lib/desperdicios-service"
import type { Usuario } from "../../shared/lib/auth"
import { FiltrosDesperdicio as ComponenteFiltros } from "./filtros-desperdicios"

interface ListagemDesperdicioProps {
  usuario: Usuario
  desperdicios: Desperdicio[]
  loading: boolean
  onVoltar: () => void
  onVerDetalhes: (id: string) => void
  onFiltrosChange: (filtros: FiltrosDesperdicio) => void
}

export function ListagemDesperdicio({
  usuario,
  desperdicios,
  loading,
  onVoltar,
  onVerDetalhes,
  onFiltrosChange
}: ListagemDesperdicioProps) {
  const [filtros, setFiltros] = useState<FiltrosDesperdicio>({})
  
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const handleFiltrosChange = (novosFiltros: FiltrosDesperdicio) => {
    setFiltros(novosFiltros)
    onFiltrosChange(novosFiltros)
  }

  const calcularTotais = () => {
    const valorTotal = desperdicios.reduce((sum, d) => sum + (d.valor_total || 0), 0)
    const quantidadeTotal = desperdicios.reduce((sum, d) => sum + (d.quantidade_total_itens || 0), 0)
    const itensTotal = desperdicios.reduce((sum, d) => sum + (d.total_itens || 0), 0)
    
    return { valorTotal, quantidadeTotal, itensTotal }
  }

  const { valorTotal, quantidadeTotal, itensTotal } = calcularTotais()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
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
                📋 Listagem de Desperdícios
              </h1>
              <p className="text-[#5F6B6D]/70">
                Histórico completo de desperdícios registrados
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <ComponenteFiltros
          filtros={filtros}
          onChange={handleFiltrosChange}
          usuario={usuario}
        />

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-[#E8E8E8] p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-[#FB8281]" />
              <div>
                <p className="text-2xl font-bold text-[#5F6B6D]">{desperdicios.length}</p>
                <p className="text-sm text-[#5F6B6D]/60">Desperdícios</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E8E8E8] p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-[#3599B8]" />
              <div>
                <p className="text-2xl font-bold text-[#5F6B6D]">{itensTotal}</p>
                <p className="text-sm text-[#5F6B6D]/60">Itens Total</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E8E8E8] p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#4AC5BB] rounded-full flex items-center justify-center text-white font-bold">
                Kg
              </div>
              <div>
                <p className="text-2xl font-bold text-[#5F6B6D]">{quantidadeTotal.toFixed(1)}</p>
                <p className="text-sm text-[#5F6B6D]/60">Quantidade</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E8E8E8] p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#fabd07] rounded-full flex items-center justify-center text-white font-bold">
                R$
              </div>
              <div>
                <p className="text-lg font-bold text-[#5F6B6D]">{formatarMoeda(valorTotal)}</p>
                <p className="text-sm text-[#5F6B6D]/60">Valor Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8]">
          <div className="p-6 border-b border-[#E8E8E8]">
            <h2 className="text-lg font-semibold text-[#5F6B6D]">
              Todos os Lançamentos ({desperdicios.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse border-b border-[#E8E8E8] pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : desperdicios.length === 0 ? (
            <div className="p-12 text-center text-[#5F6B6D]/60">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum desperdício encontrado</h3>
              <p>Ajuste os filtros ou verifique se existem registros no período selecionado</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8E8E8]">
              {desperdicios.map((desperdicio) => (
                <div
                  key={desperdicio.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onVerDetalhes(desperdicio.id!)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-[#5F6B6D] text-lg">
                          {desperdicio.setor}
                        </h3>
                        <span className="px-3 py-1 bg-[#FB8281]/10 text-[#FB8281] rounded-full text-sm font-medium">
                          {formatarData(desperdicio.data_desperdicio)}
                        </span>
                        {desperdicio.fotos && desperdicio.fotos.length > 0 && (
                          <span className="flex items-center gap-1 text-[#4AC5BB] text-sm">
                            <Camera className="w-4 h-4" />
                            {desperdicio.fotos.length}
                          </span>
                        )}
                      </div>
                      <p className="text-[#5F6B6D]/70 mb-3 line-clamp-2">
                        {desperdicio.comentario}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#FB8281] mb-1">
                        {formatarMoeda(desperdicio.valor_total || 0)}
                      </p>
                      <button className="text-[#3599B8] hover:underline text-sm flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Ver detalhes
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#5F6B6D]/60" />
                      <span className="text-[#5F6B6D]/60">Responsável:</span>
                      <span className="text-[#5F6B6D] font-medium truncate">
                        {desperdicio.responsavel_nome}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#5F6B6D]/60" />
                      <span className="text-[#5F6B6D]/60">Itens:</span>
                      <span className="text-[#5F6B6D] font-medium">
                        {desperdicio.total_itens}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#4AC5BB] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Kg</span>
                      </div>
                      <span className="text-[#5F6B6D]/60">Quantidade:</span>
                      <span className="text-[#5F6B6D] font-medium">
                        {(desperdicio.quantidade_total_itens || 0).toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#5F6B6D]/60" />
                      <span className="text-[#5F6B6D]/60">Registrado:</span>
                      <span className="text-[#5F6B6D] font-medium">
                        {formatarData(desperdicio.created_at!)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginação (se necessário) */}
        {desperdicios.length > 0 && (
          <div className="flex justify-center">
            <div className="bg-white rounded-lg shadow-sm border border-[#E8E8E8] px-6 py-3">
              <p className="text-sm text-[#5F6B6D]/60">
                Mostrando {desperdicios.length} resultado(s)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}