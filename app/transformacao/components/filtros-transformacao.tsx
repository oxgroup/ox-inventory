"use client"

import { useState, useEffect } from "react"
import { Search, Filter, X } from "lucide-react"
import { type FiltrosTransformacao } from "../../shared/lib/transformacao-service"

interface FiltrosTransformacaoProps {
  filtros: FiltrosTransformacao
  onChange: (filtros: FiltrosTransformacao) => void
  usuario: any
}

export function FiltrosTransformacao({ filtros, onChange, usuario }: FiltrosTransformacaoProps) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [filtrosLocal, setFiltrosLocal] = useState<FiltrosTransformacao>(filtros)

  // Definir período padrão (mês atual)
  useEffect(() => {
    if (!filtros.data_inicio && !filtros.data_fim) {
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      
      const filtrosIniciais = {
        data_inicio: inicioMes.toISOString().split('T')[0],
        data_fim: fimMes.toISOString().split('T')[0]
      }
      
      setFiltrosLocal(filtrosIniciais)
      onChange(filtrosIniciais)
    }
  }, [])

  const aplicarFiltros = () => {
    onChange(filtrosLocal)
    setMostrarFiltros(false)
  }

  const limparFiltros = () => {
    const filtrosVazios: FiltrosTransformacao = {}
    setFiltrosLocal(filtrosVazios)
    onChange(filtrosVazios)
    setMostrarFiltros(false)
  }

  const handleInputChange = (campo: keyof FiltrosTransformacao, valor: string) => {
    setFiltrosLocal(prev => ({
      ...prev,
      [campo]: valor || undefined
    }))
  }

  const temFiltrosAtivos = Object.values(filtros).some(v => v !== undefined && v !== '')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-[#5F6B6D] flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtros
          {temFiltrosAtivos && (
            <span className="bg-[#3599B8] text-white text-xs px-2 py-1 rounded-full">
              {Object.values(filtros).filter(v => v !== undefined && v !== '').length}
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="text-[#3599B8] hover:underline text-sm"
          >
            {mostrarFiltros ? 'Ocultar' : 'Expandir'}
          </button>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="text-[#FB8281] hover:underline text-sm flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Resumo dos filtros ativos */}
      {temFiltrosAtivos && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filtros.data_inicio && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              Data início: {new Date(filtros.data_inicio).toLocaleDateString('pt-BR')}
              <button
                onClick={() => onChange({ ...filtros, data_inicio: undefined })}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filtros.data_fim && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              Data fim: {new Date(filtros.data_fim).toLocaleDateString('pt-BR')}
              <button
                onClick={() => onChange({ ...filtros, data_fim: undefined })}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filtros.status && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              Status: {filtros.status}
              <button
                onClick={() => onChange({ ...filtros, status: undefined })}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filtros.produto_bruto && (
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              Produto: {filtros.produto_bruto}
              <button
                onClick={() => onChange({ ...filtros, produto_bruto: undefined })}
                className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filtros.numero_lote && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              Lote: {filtros.numero_lote}
              <button
                onClick={() => onChange({ ...filtros, numero_lote: undefined })}
                className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Formulário de filtros */}
      {mostrarFiltros && (
        <div className="border-t border-[#E8E8E8] pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Data Início */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#5F6B6D]">
                Data Início
              </label>
              <input
                type="date"
                value={filtrosLocal.data_inicio || ''}
                onChange={(e) => handleInputChange('data_inicio', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#5F6B6D]">
                Data Fim
              </label>
              <input
                type="date"
                value={filtrosLocal.data_fim || ''}
                onChange={(e) => handleInputChange('data_fim', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#5F6B6D]">
                Status
              </label>
              <select
                value={filtrosLocal.status || ''}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Produto Bruto */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#5F6B6D]">
                Produto Bruto
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Nome do produto..."
                  value={filtrosLocal.produto_bruto || ''}
                  onChange={(e) => handleInputChange('produto_bruto', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                />
              </div>
            </div>

            {/* Número do Lote */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#5F6B6D]">
                Número do Lote
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="L20240829001..."
                  value={filtrosLocal.numero_lote || ''}
                  onChange={(e) => handleInputChange('numero_lote', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={limparFiltros}
              className="px-4 py-2 text-[#5F6B6D] border border-[#E8E8E8] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpar Filtros
            </button>
            <button
              onClick={aplicarFiltros}
              className="px-4 py-2 bg-[#3599B8] text-white rounded-lg hover:bg-[#3599B8]/90 transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}