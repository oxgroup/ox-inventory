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
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={onVoltar}
              variant="outline"
              className="border-[#3599B8] text-[#3599B8] hover:bg-[#3599B8]/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#000000]">📦 Produtos</h1>
              <p className="text-[#5F6B6D]">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#4AC5BB]/20 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-[#4AC5BB]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-[#000000] mb-1 truncate">
                            {produto.nome}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-[#5F6B6D] mb-2">
                            <span><strong>Categoria:</strong> {produto.categoria}</span>
                            <span><strong>Unidade:</strong> {produto.unidade}</span>
                            {produto.cod_item && (
                              <span><strong>Código:</strong> {produto.cod_item}</span>
                            )}
                          </div>
                          {produto.codigo_barras && (
                            <p className="text-xs text-[#8B8C7E] mb-2">
                              <strong>Código de barras:</strong> {produto.codigo_barras}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
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
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => onEditarProduto(produto)}
                        size="sm"
                        className="bg-[#3599B8] hover:bg-[#2A7A96] text-white"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        onClick={() => toggleStatus(produto)}
                        size="sm"
                        variant="outline"
                        className={produto.ativo 
                          ? "border-[#FB8281] text-[#FB8281] hover:bg-[#FB8281]/10" 
                          : "border-[#97C93D] text-[#97C93D] hover:bg-[#97C93D]/10"}
                      >
                        {produto.ativo ? "Desativar" : "Ativar"}
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