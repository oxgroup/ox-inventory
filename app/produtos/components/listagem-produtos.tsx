"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Package, Edit, Filter, X, Eye } from "lucide-react"
import { produtoService, type Produto } from "../../shared/lib/supabase"
import type { Usuario } from "../../shared/lib/auth"

interface ListagemProdutosProps {
  usuario: Usuario
  onVoltar: () => void
  onEditarProduto: (produto: Produto) => void
  onProdutoAtualizado: () => void
}

export function ListagemProdutos({ usuario, onVoltar, onEditarProduto, onProdutoAtualizado }: ListagemProdutosProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos")
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [filtroLoja, setFiltroLoja] = useState<string>("todos")
  const [categorias, setCategorias] = useState<string[]>([])
  const [lojas, setLojas] = useState<string[]>([])

  useEffect(() => {
    carregarProdutos()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [busca, filtroCategoria, filtroStatus, filtroLoja, produtos])

  const carregarProdutos = async () => {
    try {
      setCarregando(true)
      const produtosCarregados = await produtoService.listar()
      setProdutos(produtosCarregados)
      
      // Extrair categorias e lojas únicas
      const categoriasUnicas = [...new Set(produtosCarregados.map(p => p.categoria))].sort()
      const lojasUnicas = [...new Set(produtosCarregados.map(p => p.loja_id))].sort()
      
      setCategorias(categoriasUnicas)
      setLojas(lojasUnicas)
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    } finally {
      setCarregando(false)
    }
  }

  const aplicarFiltros = () => {
    let filtrados = [...produtos]

    // Filtro de busca (nome, categoria, código)
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase()
      filtrados = filtrados.filter(produto =>
        produto.nome.toLowerCase().includes(buscaLower) ||
        produto.categoria.toLowerCase().includes(buscaLower) ||
        produto.cod_item?.toLowerCase().includes(buscaLower) ||
        produto.codigo_barras?.includes(busca)
      )
    }

    // Filtro de categoria
    if (filtroCategoria !== "todos") {
      filtrados = filtrados.filter(produto => produto.categoria === filtroCategoria)
    }

    // Filtro de status
    if (filtroStatus !== "todos") {
      filtrados = filtrados.filter(produto => 
        filtroStatus === "ativo" ? produto.ativo : !produto.ativo
      )
    }

    // Filtro de loja
    if (filtroLoja !== "todos") {
      filtrados = filtrados.filter(produto => produto.loja_id === filtroLoja)
    }

    setProdutosFiltrados(filtrados)
  }

  const limparFiltros = () => {
    setBusca("")
    setFiltroCategoria("todos")
    setFiltroStatus("todos")
    setFiltroLoja("todos")
  }

  const toggleStatus = async (produto: Produto) => {
    try {
      await produtoService.atualizar(produto.id, { ativo: !produto.ativo })
      await carregarProdutos()
      onProdutoAtualizado()
    } catch (error) {
      console.error("Erro ao alterar status:", error)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fabd07] mx-auto"></div>
          <p className="text-[#5F6B6D] font-medium">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE]">
      <div className="container mx-auto px-4 py-4 md:p-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={onVoltar}
              variant="outline"
              className="border-[#3599B8] text-[#3599B8] hover:bg-[#3599B8]/10 flex-shrink-0"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[#000000] truncate">📦 Produtos</h1>
              <p className="text-sm text-[#5F6B6D]">
                {produtosFiltrados.length} de {produtos.length} produtos
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card className="border-2 border-[#fabd07] shadow-lg mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#000000] text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Busca */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5F6B6D]" />
                <Input
                  placeholder="Buscar por nome, código..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 border-[#3599B8] focus:border-[#fabd07]"
                />
              </div>

              {/* Categoria */}
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="border-[#3599B8] focus:border-[#fabd07]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status */}
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="border-[#3599B8] focus:border-[#fabd07]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Apenas ativos</SelectItem>
                  <SelectItem value="inativo">Apenas inativos</SelectItem>
                </SelectContent>
              </Select>

              {/* Loja */}
              <Select value={filtroLoja} onValueChange={setFiltroLoja}>
                <SelectTrigger className="border-[#3599B8] focus:border-[#fabd07]">
                  <SelectValue placeholder="Loja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as lojas</SelectItem>
                  {lojas.map(loja => (
                    <SelectItem key={loja} value={loja}>
                      Loja {loja}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={limparFiltros}
              variant="outline"
              className="border-[#FB8281] text-[#FB8281] hover:bg-[#FB8281]/10"
            >
              <X className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Produtos */}
        <div className="grid gap-4">
          {produtosFiltrados.length === 0 ? (
            <Card className="border-2 border-[#C9B07A] shadow-lg">
              <CardContent className="p-8 text-center">
                <Package className="w-16 h-16 text-[#C9B07A] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#5F6B6D] mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-[#8B8C7E]">
                  Tente ajustar os filtros ou cadastrar novos produtos.
                </p>
              </CardContent>
            </Card>
          ) : (
            produtosFiltrados.map((produto) => (
              <Card key={produto.id} className="border-2 border-[#3599B8] shadow-lg hover:border-[#fabd07] transition-colors">
                <CardContent className="p-4">
                  {/* Layout responsivo: stack em mobile, horizontal em desktop */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    
                    {/* Conteúdo principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-[#4AC5BB]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 md:w-6 md:h-6 text-[#4AC5BB]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-semibold text-[#000000] mb-1 leading-tight">
                            {produto.nome}
                          </h3>
                          
                          {/* Informações em stack para mobile */}
                          <div className="space-y-1 md:space-y-0 md:flex md:items-center md:gap-4 text-sm text-[#5F6B6D] mb-2">
                            <div className="flex items-center gap-3">
                              <span><strong>Categoria:</strong> {produto.categoria}</span>
                              <span><strong>Unidade:</strong> {produto.unidade}</span>
                            </div>
                            {produto.cod_item && (
                              <div className="md:block">
                                <span><strong>Código:</strong> {produto.cod_item}</span>
                              </div>
                            )}
                          </div>
                          
                          {produto.codigo_barras && (
                            <p className="text-xs text-[#8B8C7E] mb-3 font-mono break-all">
                              <strong>Código de barras:</strong> {produto.codigo_barras}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          className={produto.ativo 
                            ? "bg-[#97C93D] text-white hover:bg-[#7BA82E]" 
                            : "bg-[#FB8281] text-white hover:bg-[#FA6B6A]"}
                        >
                          {produto.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline" className="border-[#C9B07A] text-[#C9B07A]">
                          Loja {produto.loja_id}
                        </Badge>
                      </div>
                    </div>

                    {/* Ações - Full width em mobile, lado direito em desktop */}
                    <div className="flex items-center gap-2 md:flex-col md:gap-1 md:ml-4 md:flex-shrink-0">
                      <Button
                        onClick={() => onEditarProduto(produto)}
                        size="sm"
                        className="bg-[#3599B8] hover:bg-[#2A7A96] text-white flex-1 md:flex-none md:w-20"
                      >
                        <Eye className="w-4 h-4 md:mr-1" />
                        <span className="md:inline">Ver</span>
                      </Button>
                      <Button
                        onClick={() => toggleStatus(produto)}
                        size="sm"
                        variant="outline"
                        className={`flex-1 md:flex-none md:w-20 ${produto.ativo 
                          ? "border-[#FB8281] text-[#FB8281] hover:bg-[#FB8281]/10" 
                          : "border-[#97C93D] text-[#97C93D] hover:bg-[#97C93D]/10"}`}
                      >
                        <span className="text-xs md:text-sm">
                          {produto.ativo ? "Desativar" : "Ativar"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}