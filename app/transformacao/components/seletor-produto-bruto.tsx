"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Check, Package, ShoppingCart, Tag } from "lucide-react"
import { transformacaoService, type Produto } from "../../shared/lib/transformacao-service"

interface SeletorProdutoBrutoProps {
  usuario: any
  produtoSelecionado: Produto | null
  onSelecionarProduto: (produto: Produto) => void
  disabled?: boolean
}

export function SeletorProdutoBruto({ 
  usuario, 
  produtoSelecionado, 
  onSelecionarProduto,
  disabled = false 
}: SeletorProdutoBrutoProps) {
  const [termoBusca, setTermoBusca] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [loading, setLoading] = useState(false)
  const [produtosFavoritos, setProdutosFavoritos] = useState<Produto[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultadosRef = useRef<HTMLDivElement>(null)

  // Buscar produtos favoritos (mais usados) ao carregar
  useEffect(() => {
    buscarProdutosFavoritos()
  }, [usuario])

  // Buscar produtos quando o termo mudar
  useEffect(() => {
    if (termoBusca.length >= 2) {
      buscarProdutos()
    } else {
      setProdutos([])
      setMostrarResultados(false)
    }
  }, [termoBusca])

  // Fechar resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultadosRef.current && 
        !resultadosRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setMostrarResultados(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const buscarProdutosFavoritos = async () => {
    try {
      console.log('🌟 Buscando produtos favoritos...')
      // Buscar produtos sem termo específico para pegar alguns exemplos
      const favoritos = await transformacaoService.buscarProdutos(usuario.loja_id)
      console.log('🌟 Favoritos encontrados:', favoritos.length)
      setProdutosFavoritos(favoritos.slice(0, 8)) // Mais produtos para teste
    } catch (error) {
      console.error('❌ Erro ao buscar produtos favoritos:', error)
      setProdutosFavoritos([])
    }
  }

  const buscarProdutos = async () => {
    if (termoBusca.length < 2) return

    console.log('🔍 Buscando produtos para termo:', termoBusca, 'loja:', usuario.loja_id)
    setLoading(true)
    
    try {
      const resultados = await transformacaoService.buscarProdutos(usuario.loja_id, termoBusca)
      console.log('📦 Resultados da busca:', resultados.length)
      
      // Por enquanto, vamos mostrar todos os resultados sem filtro adicional
      const produtosFiltrados = resultados.slice(0, 20) // Limitar a 20 para teste
      
      console.log('✅ Produtos filtrados:', produtosFiltrados.length)
      
      setProdutos(produtosFiltrados)
      setMostrarResultados(produtosFiltrados.length > 0)
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error)
      setProdutos([])
      setMostrarResultados(false)
    } finally {
      setLoading(false)
    }
  }

  const selecionarProduto = (produto: Produto) => {
    onSelecionarProduto(produto)
    setTermoBusca(produto.nome)
    setMostrarResultados(false)
    setProdutos([])
  }

  const limparSelecao = () => {
    setTermoBusca('')
    setMostrarResultados(false)
    setProdutos([])
  }

  const formatarMoeda = (valor?: number) => {
    if (valor === undefined || valor === null) return 'N/A'
    if (valor === 0) return 'Sem preço'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const getIconeCategoria = (categoria?: string) => {
    if (!categoria) return <Package className="w-4 h-4" />
    
    const cat = categoria.toLowerCase()
    if (cat.includes('carne')) return <ShoppingCart className="w-4 h-4 text-red-500" />
    if (cat.includes('peixe')) return <ShoppingCart className="w-4 h-4 text-blue-500" />
    if (cat.includes('frango')) return <ShoppingCart className="w-4 h-4 text-yellow-500" />
    
    return <Package className="w-4 h-4" />
  }

  return (
    <div className="space-y-4">
      {/* Campo de Busca */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#5F6B6D]">
          Produto Bruto * 
          <span className="text-xs text-[#5F6B6D]/60 ml-2">
            (Digite para buscar produtos em estoque)
          </span>
        </label>
        
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Busque por nome, código ou categoria do produto bruto..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              onFocus={() => {
                if (produtos.length > 0) setMostrarResultados(true)
                if (!termoBusca && produtosFavoritos.length > 0) {
                  setProdutos(produtosFavoritos)
                  setMostrarResultados(true)
                }
              }}
              disabled={disabled}
              className="w-full pl-10 pr-4 py-3 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3599B8]"></div>
              </div>
            )}
          </div>

          {/* Resultados da Busca */}
          {mostrarResultados && (produtos.length > 0 || produtosFavoritos.length > 0) && (
            <div 
              ref={resultadosRef}
              className="absolute top-full left-0 right-0 z-10 mt-1 max-h-80 overflow-y-auto bg-white border border-[#E8E8E8] rounded-lg shadow-lg"
            >
              {/* Produtos Favoritos (quando não há busca) */}
              {!termoBusca && produtosFavoritos.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-gray-50 border-b text-xs font-medium text-[#5F6B6D]">
                    💡 Produtos Sugeridos (Proteínas)
                  </div>
                  {produtosFavoritos.map((produto) => (
                    <ProdutoItem 
                      key={produto.codigo}
                      produto={produto}
                      onSelecionar={selecionarProduto}
                      isSelected={produtoSelecionado?.codigo === produto.codigo}
                    />
                  ))}
                </>
              )}

              {/* Resultados da Busca */}
              {termoBusca && produtos.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-gray-50 border-b text-xs font-medium text-[#5F6B6D]">
                    🔍 {produtos.length} produtos encontrados
                  </div>
                  {produtos.map((produto) => (
                    <ProdutoItem 
                      key={produto.codigo}
                      produto={produto}
                      onSelecionar={selecionarProduto}
                      isSelected={produtoSelecionado?.codigo === produto.codigo}
                    />
                  ))}
                </>
              )}

              {/* Nenhum resultado */}
              {termoBusca && produtos.length === 0 && !loading && (
                <div className="px-4 py-6 text-center text-[#5F6B6D]/60">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum produto bruto encontrado</p>
                  <p className="text-xs mt-1">
                    Tente buscar por "carne", "frango", "peixe" ou código do produto
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Produto Selecionado */}
      {produtoSelecionado && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-green-900 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Produto Selecionado
            </h3>
            <button
              onClick={limparSelecao}
              className="text-green-700 hover:text-green-900 text-sm underline"
            >
              Alterar
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p><strong>Nome:</strong> {produtoSelecionado.nome}</p>
              <p><strong>Código:</strong> {produtoSelecionado.codigo}</p>
            </div>
            <div>
              <p><strong>Categoria:</strong> {produtoSelecionado.categoria || 'N/A'}</p>
              <p><strong>Unidade:</strong> {produtoSelecionado.unidade}</p>
            </div>
            <div className="md:col-span-2">
              <p><strong>Preço de Custo:</strong> {formatarMoeda(produtoSelecionado.preco_custo)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para cada item de produto
function ProdutoItem({ 
  produto, 
  onSelecionar, 
  isSelected 
}: {
  produto: Produto
  onSelecionar: (produto: Produto) => void
  isSelected: boolean
}) {
  const formatarMoeda = (valor?: number) => {
    if (valor === undefined || valor === null) return 'Sem preço'
    if (valor === 0) return 'Sem preço'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const getIconeCategoria = (categoria?: string) => {
    if (!categoria) return <Package className="w-4 h-4 text-gray-400" />
    
    const cat = categoria.toLowerCase()
    if (cat.includes('carne')) return <ShoppingCart className="w-4 h-4 text-red-500" />
    if (cat.includes('peixe')) return <ShoppingCart className="w-4 h-4 text-blue-500" />
    if (cat.includes('frango')) return <ShoppingCart className="w-4 h-4 text-yellow-500" />
    
    return <Package className="w-4 h-4 text-gray-400" />
  }

  return (
    <button
      onClick={() => onSelecionar(produto)}
      className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getIconeCategoria(produto.categoria)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[#5F6B6D] truncate">
              {produto.nome}
            </div>
            <div className="text-sm text-[#5F6B6D]/70 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {produto.codigo}
              </span>
              {produto.categoria && (
                <span>• {produto.categoria}</span>
              )}
              <span>• {produto.unidade}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-medium text-[#5F6B6D]">
            {formatarMoeda(produto.preco_custo)}
          </div>
          <div className="text-xs text-[#5F6B6D]/60">
            por {produto.unidade}
          </div>
        </div>
      </div>
      
      {isSelected && (
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
          <Check className="w-3 h-3" />
          Selecionado
        </div>
      )}
    </button>
  )
}