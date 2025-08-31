"use client"

import { useState, useEffect } from "react"
import { Search, X, Package, Filter } from "lucide-react"
import type { Produto } from "../../shared/lib/supabase"

interface SeletorProdutosProps {
  produtos: Produto[]
  onSelecionar: (produto: Produto) => void
  onFechar: () => void
}

export function SeletorProdutos({ produtos, onSelecionar, onFechar }: SeletorProdutosProps) {
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>(produtos)

  console.log('🔍 SeletorProdutos - Produtos recebidos:', produtos.length)
  
  // Obter categorias únicas
  const categorias = Array.from(new Set(produtos.map(p => p.categoria).filter(Boolean)))
  console.log('📂 Categorias encontradas:', categorias.length, categorias)

  useEffect(() => {
    console.log('🔄 Aplicando filtros - Busca:', busca, 'Categoria:', categoriaFiltro)
    let resultado = produtos

    // Filtrar por busca
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase()
      console.log('🔍 Filtrando por termo:', termoBusca)
      resultado = resultado.filter(produto =>
        produto.nome?.toLowerCase().includes(termoBusca) ||
        produto.cod_item?.toLowerCase().includes(termoBusca) ||
        produto.codigo_barras?.toLowerCase().includes(termoBusca)
      )
      console.log('📋 Produtos após busca:', resultado.length)
    }

    // Filtrar por categoria
    if (categoriaFiltro) {
      console.log('📂 Filtrando por categoria:', categoriaFiltro)
      resultado = resultado.filter(produto => produto.categoria === categoriaFiltro)
      console.log('📋 Produtos após categoria:', resultado.length)
    }

    console.log('✅ Produtos filtrados final:', resultado.length)
    setProdutosFiltrados(resultado)
  }, [busca, categoriaFiltro, produtos])

  const handleProdutoClick = (produto: Produto) => {
    onSelecionar(produto)
  }

  const limparFiltros = () => {
    setBusca('')
    setCategoriaFiltro('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8E8E8]">
          <div>
            <h2 className="text-xl font-bold text-[#5F6B6D]">
              <Package className="w-5 h-5 inline mr-2" />
              Selecionar Produto
            </h2>
            <p className="text-sm text-[#5F6B6D]/60 mt-1">
              Escolha os produtos que foram desperdiçados
            </p>
          </div>
          <button
            onClick={onFechar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#5F6B6D]" />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b border-[#E8E8E8] bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5F6B6D]/60" />
              <input
                type="text"
                placeholder="Buscar por nome, código ou código de barras..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
              />
            </div>

            {/* Filtro de Categoria */}
            <div className="sm:w-48">
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
              >
                <option value="">Todas as categorias</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            {/* Limpar Filtros */}
            {(busca || categoriaFiltro) && (
              <button
                onClick={limparFiltros}
                className="px-4 py-2 text-[#5F6B6D] border border-[#E8E8E8] rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Limpar
              </button>
            )}
          </div>

          {/* Resultados da busca */}
          <div className="mt-4 text-sm text-[#5F6B6D]/60">
            {produtosFiltrados.length} produto(s) encontrado(s)
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="flex-1 overflow-y-auto p-6">
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-[#5F6B6D]/60">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Nenhum produto encontrado</p>
              <p className="text-sm">
                Tente ajustar os filtros ou verificar a busca
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {produtosFiltrados.map((produto, index) => (
                <div
                  key={produto.id || `produto-${index}`}
                  onClick={() => handleProdutoClick(produto)}
                  className="border border-[#E8E8E8] rounded-lg p-4 hover:border-[#3599B8] hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-[#5F6B6D] group-hover:text-[#3599B8] transition-colors">
                        {produto.nome || 'Produto sem nome'}
                      </h3>
                      {produto.categoria && (
                        <p className="text-sm text-[#5F6B6D]/60 mt-1">
                          {produto.categoria}
                        </p>
                      )}
                    </div>
                    <Package className="w-5 h-5 text-[#5F6B6D]/40 group-hover:text-[#3599B8] transition-colors flex-shrink-0" />
                  </div>

                  <div className="space-y-2">
                    {produto.cod_item && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#5F6B6D]/60">Código:</span>
                        <span className="text-[#5F6B6D] font-mono">
                          {produto.cod_item}
                        </span>
                      </div>
                    )}

                    {produto.codigo_barras && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#5F6B6D]/60">Código de Barras:</span>
                        <span className="text-[#5F6B6D] font-mono">
                          {produto.codigo_barras}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs">
                      <span className="text-[#5F6B6D]/60">Unidade:</span>
                      <span className="text-[#5F6B6D]">
                        {produto.unidade || 'UN'}
                      </span>
                    </div>

                    {produto.status && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#5F6B6D]/60">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          produto.status === 'ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {produto.status}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E8E8E8]">
                    <button className="w-full bg-[#3599B8] text-white py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Selecionar Produto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E8E8E8] bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#5F6B6D]/60">
              Clique em um produto para adicioná-lo à lista de desperdícios
            </p>
            <button
              onClick={onFechar}
              className="px-6 py-2 border border-[#E8E8E8] text-[#5F6B6D] rounded-lg hover:bg-gray-100 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}