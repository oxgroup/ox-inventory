"use client"

import { Clock, TrendingUp, FileText, Package, BarChart3 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { SetorAtivo } from "../../shared/lib/setores-dashboard-service"
import type { Usuario } from "../../shared/lib/auth"

interface ListaSetoresProps {
  usuario: Usuario
  setores: SetorAtivo[]
  loading: boolean
  onRecarregar: () => void
}

export function ListaSetores({ usuario, setores, loading, onRecarregar }: ListaSetoresProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3599B8] mx-auto"></div>
          <p className="text-[#5F6B6D] mt-4">Carregando setores...</p>
        </div>
      </div>
    )
  }

  if (setores.length === 0) {
    return (
      <div className="text-center py-20">
        <Package className="w-16 h-16 text-[#5F6B6D] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[#5F6B6D] mb-2">
          Nenhum setor ativo encontrado
        </h3>
        <p className="text-[#5F6B6D] mb-6">
          Comece criando fichas técnicas, requisições ou inventários para ver os setores aqui.
        </p>
        <button
          onClick={onRecarregar}
          className="bg-[#3599B8] text-white px-6 py-3 rounded-lg hover:bg-[#3599B8]/90 transition-colors"
        >
          Recarregar
        </button>
      </div>
    )
  }

  const categorizeSetores = (setores: SetorAtivo[]) => {
    const categorias = {
      preparo: setores.filter(s => s.categoria === 'preparo'),
      cocção: setores.filter(s => s.categoria === 'coccao'),
      bebidas: setores.filter(s => s.categoria === 'bebidas'),
      armazenamento: setores.filter(s => s.categoria === 'armazenamento'),
      outros: setores.filter(s => !['preparo', 'coccao', 'bebidas', 'armazenamento'].includes(s.categoria))
    }
    
    return categorias
  }

  const categorizados = categorizeSetores(setores)

  const formatarUltimaAtividade = (data: string) => {
    try {
      return formatDistanceToNow(new Date(data), {
        addSuffix: true,
        locale: ptBR
      })
    } catch (error) {
      return "Data inválida"
    }
  }

  const renderSetorCard = (setor: SetorAtivo) => (
    <Link
      key={setor.nome}
      href={`/setores/${encodeURIComponent(setor.nome)}`}
      className="block"
    >
      <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] hover:shadow-md transition-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{setor.emoji}</div>
            <div>
              <h3 className="font-semibold text-[#5F6B6D] text-lg">{setor.nome}</h3>
              <span className="text-xs text-[#5F6B6D]/60 capitalize">{setor.categoria}</span>
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-[#4AC5BB]" />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <FileText className="w-4 h-4 text-[#3599B8] mr-1" />
              <span className="text-lg font-bold text-[#5F6B6D]">{setor.total_fichas}</span>
            </div>
            <span className="text-xs text-[#5F6B6D]/60">Fichas</span>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <BarChart3 className="w-4 h-4 text-[#fabd07] mr-1" />
              <span className="text-lg font-bold text-[#5F6B6D]">{setor.total_requisicoes}</span>
            </div>
            <span className="text-xs text-[#5F6B6D]/60">Requisições</span>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Package className="w-4 h-4 text-[#4AC5BB] mr-1" />
              <span className="text-lg font-bold text-[#5F6B6D]">{setor.total_inventarios}</span>
            </div>
            <span className="text-xs text-[#5F6B6D]/60">Inventários</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#5F6B6D]/60">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>Última atividade</span>
          </div>
          <span className="font-medium">
            {formatarUltimaAtividade(setor.ultima_atividade)}
          </span>
        </div>
      </div>
    </Link>
  )

  const renderCategoria = (titulo: string, setores: SetorAtivo[]) => {
    if (setores.length === 0) return null

    return (
      <div key={titulo} className="mb-8">
        <h2 className="text-lg font-semibold text-[#5F6B6D] mb-4 capitalize">
          {titulo === 'coccao' ? 'Cocção' : titulo}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {setores.map(renderSetorCard)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#5F6B6D] mb-2">
            🏗️ Setores - {usuario.loja_nome}
          </h1>
          <p className="text-[#5F6B6D]/70">
            Visualize atividades e estatísticas por setor da operação
          </p>
        </div>
        <button
          onClick={onRecarregar}
          className="bg-[#3599B8] text-white px-4 py-2 rounded-lg hover:bg-[#3599B8]/90 transition-colors"
        >
          Recarregar
        </button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
        <h3 className="text-lg font-semibold text-[#5F6B6D] mb-4">Resumo Geral</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#3599B8]">{setores.length}</div>
            <div className="text-sm text-[#5F6B6D]/60">Setores Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#3599B8]">
              {setores.reduce((acc, s) => acc + s.total_fichas, 0)}
            </div>
            <div className="text-sm text-[#5F6B6D]/60">Total Fichas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#fabd07]">
              {setores.reduce((acc, s) => acc + s.total_requisicoes, 0)}
            </div>
            <div className="text-sm text-[#5F6B6D]/60">Total Requisições</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#4AC5BB]">
              {setores.reduce((acc, s) => acc + s.total_inventarios, 0)}
            </div>
            <div className="text-sm text-[#5F6B6D]/60">Total Inventários</div>
          </div>
        </div>
      </div>

      {/* Setores por Categoria */}
      {renderCategoria('Preparo', categorizados.preparo)}
      {renderCategoria('Cocção', categorizados.cocção)}
      {renderCategoria('Bebidas', categorizados.bebidas)}
      {renderCategoria('Armazenamento', categorizados.armazenamento)}
      {renderCategoria('Outros', categorizados.outros)}
    </div>
  )
}