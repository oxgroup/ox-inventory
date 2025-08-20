"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, List, Package, BarChart3, Filter } from "lucide-react"
import { ListagemProdutos } from "./components/listagem-produtos"
import { NovoProduto } from "./components/novo-produto"
import { DetalhesProduto } from "./components/detalhes-produto"
import { Login } from "../auth/components/login"
import { HeaderApp } from "../shared/components/header-app"
import { ErrorBoundary } from "../shared/components/error-boundary"
import { ClientOnly } from "../shared/components/client-only"
import { useAuth } from "../shared/hooks/useAuth"
import { produtoService, type Produto } from "../shared/lib/supabase"
import type { Usuario } from "../shared/lib/auth"

type TelaAtiva = "home" | "listagem" | "novo" | "detalhes"

export default function ProdutosPage() {
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>("home")
  const [produtoAtivo, setProdutoAtivo] = useState<Produto | null>(null)
  const { usuario, loading, logout } = useAuth()
  const [estatisticas, setEstatisticas] = useState<{
    total: number
    ativos: number
    inativos: number
    categorias: number
    com_codigo_barras: number
    sem_codigo_barras: number
  }>({
    total: 0,
    ativos: 0,
    inativos: 0,
    categorias: 0,
    com_codigo_barras: 0,
    sem_codigo_barras: 0
  })

  useEffect(() => {
    if (usuario) {
      carregarEstatisticas()
    }
  }, [usuario])

  const carregarEstatisticas = async () => {
    if (!usuario) return
    
    try {
      const produtos = await produtoService.listar()
      
      const stats = {
        total: produtos.length,
        ativos: produtos.filter(p => p.ativo).length,
        inativos: produtos.filter(p => !p.ativo).length,
        categorias: [...new Set(produtos.map(p => p.categoria))].length,
        com_codigo_barras: produtos.filter(p => p.codigo_barras).length,
        sem_codigo_barras: produtos.filter(p => !p.codigo_barras).length
      }
      
      setEstatisticas(stats)
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  const handleLoginSuccess = (user: Usuario) => {
    setTelaAtiva("home")
  }

  const handleProdutoAtualizado = () => {
    carregarEstatisticas()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fabd07] mx-auto"></div>
          <p className="text-[#5F6B6D] font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  const renderTela = () => {
    switch (telaAtiva) {
      case "listagem":
        return (
          <ListagemProdutos
            usuario={usuario}
            onVoltar={() => setTelaAtiva("home")}
            onEditarProduto={(produto) => {
              setProdutoAtivo(produto)
              setTelaAtiva("detalhes")
            }}
            onProdutoAtualizado={handleProdutoAtualizado}
          />
        )
      case "novo":
        return (
          <NovoProduto
            usuario={usuario}
            onVoltar={() => setTelaAtiva("home")}
            onProdutoCriado={(produto) => {
              setProdutoAtivo(produto)
              setTelaAtiva("detalhes")
              handleProdutoAtualizado()
            }}
          />
        )
      case "detalhes":
        return (
          <DetalhesProduto
            produto={produtoAtivo!}
            usuario={usuario}
            onVoltar={() => setTelaAtiva("listagem")}
            onProdutoAtualizado={handleProdutoAtualizado}
          />
        )
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE]">
            <HeaderApp
              usuario={usuario}
              onLogout={logout}
              titulo="📦 Gestão de Produtos"
              subtitulo="Cadastro e gerenciamento de produtos"
            />

            <div className="container mx-auto p-4 md:p-8">
              {/* Estatísticas */}
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <Card className="border-2 border-[#4AC5BB] shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-[#000000]">{estatisticas.total}</p>
                        <p className="text-sm text-[#5F6B6D]">Total</p>
                      </div>
                      <Package className="w-8 h-8 text-[#4AC5BB]" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#97C93D] shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-[#000000]">{estatisticas.ativos}</p>
                        <p className="text-sm text-[#5F6B6D]">Ativos</p>
                      </div>
                      <div className="w-3 h-3 bg-[#97C93D] rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#FB8281] shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-[#000000]">{estatisticas.inativos}</p>
                        <p className="text-sm text-[#5F6B6D]">Inativos</p>
                      </div>
                      <div className="w-3 h-3 bg-[#FB8281] rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#3599B8] shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-[#000000]">{estatisticas.categorias}</p>
                        <p className="text-sm text-[#5F6B6D]">Categorias</p>
                      </div>
                      <Filter className="w-6 h-6 text-[#3599B8]" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#fabd07] shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-[#000000]">{estatisticas.com_codigo_barras}</p>
                        <p className="text-sm text-[#5F6B6D]">C/ Código</p>
                      </div>
                      <div className="w-3 h-3 bg-[#fabd07] rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#C9B07A] shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-[#000000]">{estatisticas.sem_codigo_barras}</p>
                        <p className="text-sm text-[#5F6B6D]">S/ Código</p>
                      </div>
                      <div className="w-3 h-3 bg-[#C9B07A] rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Menu de Ações */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Button
                  onClick={() => setTelaAtiva("novo")}
                  className="h-32 bg-[#4AC5BB] hover:bg-[#3A9B94] text-white shadow-lg"
                  size="lg"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Plus className="w-8 h-8" />
                    <span className="text-lg font-semibold">Novo Produto</span>
                    <span className="text-sm opacity-90">Cadastrar produto</span>
                  </div>
                </Button>

                <Button
                  onClick={() => setTelaAtiva("listagem")}
                  className="h-32 bg-[#3599B8] hover:bg-[#2A7A96] text-white shadow-lg"
                  size="lg"
                >
                  <div className="flex flex-col items-center gap-2">
                    <List className="w-8 h-8" />
                    <span className="text-lg font-semibold">Listar Produtos</span>
                    <span className="text-sm opacity-90">Ver todos os produtos</span>
                  </div>
                </Button>

                <Button
                  disabled
                  className="h-32 bg-gray-300 text-gray-500 shadow-lg cursor-not-allowed"
                  size="lg"
                >
                  <div className="flex flex-col items-center gap-2">
                    <BarChart3 className="w-8 h-8" />
                    <span className="text-lg font-semibold">Relatórios</span>
                    <span className="text-sm opacity-70">Em desenvolvimento</span>
                  </div>
                </Button>
              </div>

              {/* Dica */}
              <div className="mt-8 max-w-2xl mx-auto">
                <Card className="border-2 border-[#F4DDAE] bg-[#F4DDAE]/20 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#fabd07] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">💡</span>
                      </div>
                      <div>
                        <p className="text-sm text-[#5F6B6D] font-medium mb-1">
                          <strong>Dica:</strong> Gestão completa de produtos
                        </p>
                        <p className="text-xs text-[#8B8C7E]">
                          Cadastre produtos com códigos de barras, organize por categorias e mantenha 
                          seu catálogo sempre atualizado para facilitar os inventários.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fabd07] mx-auto"></div>
            <p className="text-[#5F6B6D] font-medium">Carregando aplicação...</p>
          </div>
        </div>
      }
    >
      <ErrorBoundary>
        {renderTela()}
      </ErrorBoundary>
    </ClientOnly>
  )
}