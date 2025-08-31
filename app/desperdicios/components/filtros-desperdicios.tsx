"use client"

import { useState, useEffect } from "react"
import { Calendar, Filter, X, User, AlertTriangle } from "lucide-react"
import type { FiltrosDesperdicio } from "../../shared/lib/desperdicios-service"
import type { Usuario } from "../../shared/lib/auth"
import { SETORES } from "../../shared/lib/setores"

interface FiltrosDesperdicioProps {
  filtros: FiltrosDesperdicio
  onChange: (filtros: FiltrosDesperdicio) => void
  usuario: Usuario
}

export function FiltrosDesperdicio({ filtros, onChange, usuario }: FiltrosDesperdicioProps) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [filtrosLocal, setFiltrosLocal] = useState<FiltrosDesperdicio>(filtros)

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
    const filtrosLimpos = {}
    setFiltrosLocal(filtrosLimpos)
    onChange(filtrosLimpos)
  }

  const handleFiltroChange = (campo: keyof FiltrosDesperdicio, valor: any) => {
    setFiltrosLocal(prev => ({
      ...prev,
      [campo]: valor || undefined
    }))
  }

  const definirPeriodo = (periodo: string) => {
    const hoje = new Date()
    let dataInicio: Date
    let dataFim: Date = hoje

    switch (periodo) {
      case 'hoje':
        dataInicio = hoje
        break
      case 'semana':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 7)
        break
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        break
      case 'trimestre':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1)
        break
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1)
        break
      default:
        return
    }

    const novosFiltros = {
      ...filtrosLocal,
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: dataFim.toISOString().split('T')[0]
    }

    setFiltrosLocal(novosFiltros)
    onChange(novosFiltros)
  }

  const temFiltrosAtivos = () => {
    return Object.keys(filtros).some(key => filtros[key as keyof FiltrosDesperdicio])
  }

  const contarFiltros = () => {
    return Object.keys(filtros).filter(key => filtros[key as keyof FiltrosDesperdicio]).length
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#5F6B6D]">
          <Filter className="w-5 h-5 inline mr-2" />
          Filtros
          {temFiltrosAtivos() && (
            <span className="ml-2 bg-[#3599B8] text-white text-xs px-2 py-1 rounded-full">
              {contarFiltros()}
            </span>
          )}
        </h3>
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="text-[#3599B8] hover:underline text-sm font-medium"
        >
          {mostrarFiltros ? 'Ocultar' : 'Mostrar'} filtros
        </button>
      </div>

      {/* Períodos Rápidos */}
      <div className="mb-4">
        <p className="text-sm font-medium text-[#5F6B6D] mb-2">Períodos rápidos:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'hoje', label: 'Hoje' },
            { key: 'semana', label: 'Últimos 7 dias' },
            { key: 'mes', label: 'Este mês' },
            { key: 'trimestre', label: 'Últimos 3 meses' },
            { key: 'ano', label: 'Este ano' }
          ].map(periodo => (
            <button
              key={periodo.key}
              onClick={() => definirPeriodo(periodo.key)}
              className="px-3 py-2 text-sm border border-[#E8E8E8] rounded-lg hover:border-[#3599B8] hover:text-[#3599B8] transition-colors"
            >
              {periodo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros Avançados */}
      {mostrarFiltros && (
        <div className="border-t border-[#E8E8E8] pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-[#5F6B6D] mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data Início
              </label>
              <input
                type="date"
                value={filtrosLocal.data_inicio || ''}
                onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-[#5F6B6D] mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data Fim
              </label>
              <input
                type="date"
                value={filtrosLocal.data_fim || ''}
                onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
              />
            </div>

            {/* Setor */}
            <div>
              <label className="block text-sm font-medium text-[#5F6B6D] mb-2">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Setor
              </label>
              <select
                value={filtrosLocal.setor || ''}
                onChange={(e) => handleFiltroChange('setor', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
              >
                <option value="">Todos os setores</option>
                {SETORES.map(setor => (
                  <option key={setor.nome} value={setor.nome}>
                    {setor.emoji} {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-[#5F6B6D] mb-2">
                Status
              </label>
              <select
                value={filtrosLocal.status || ''}
                onChange={(e) => handleFiltroChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E8E8E8]">
            <button
              onClick={limparFiltros}
              className="text-[#5F6B6D] hover:text-red-600 text-sm flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar todos
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarFiltros(false)}
                className="px-4 py-2 text-[#5F6B6D] border border-[#E8E8E8] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={aplicarFiltros}
                className="bg-[#3599B8] hover:bg-[#3599B8]/90 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros Ativos */}
      {temFiltrosAtivos() && (
        <div className="mt-4 pt-4 border-t border-[#E8E8E8]">
          <p className="text-sm font-medium text-[#5F6B6D] mb-2">Filtros ativos:</p>
          <div className="flex flex-wrap gap-2">
            {filtros.data_inicio && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#3599B8]/10 text-[#3599B8] rounded-full text-sm">
                Data início: {new Date(filtros.data_inicio).toLocaleDateString('pt-BR')}
                <button
                  onClick={() => {
                    const novosFiltros = { ...filtros }
                    delete novosFiltros.data_inicio
                    onChange(novosFiltros)
                  }}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filtros.data_fim && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#3599B8]/10 text-[#3599B8] rounded-full text-sm">
                Data fim: {new Date(filtros.data_fim).toLocaleDateString('pt-BR')}
                <button
                  onClick={() => {
                    const novosFiltros = { ...filtros }
                    delete novosFiltros.data_fim
                    onChange(novosFiltros)
                  }}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filtros.setor && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#4AC5BB]/10 text-[#4AC5BB] rounded-full text-sm">
                Setor: {filtros.setor}
                <button
                  onClick={() => {
                    const novosFiltros = { ...filtros }
                    delete novosFiltros.setor
                    onChange(novosFiltros)
                  }}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filtros.status && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#fabd07]/10 text-[#fabd07] rounded-full text-sm">
                Status: {filtros.status}
                <button
                  onClick={() => {
                    const novosFiltros = { ...filtros }
                    delete novosFiltros.status
                    onChange(novosFiltros)
                  }}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}