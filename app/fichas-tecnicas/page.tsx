"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, List, FileText, Users, TrendingUp, Search } from "lucide-react"
import { ListagemFichas } from "./components/listagem-fichas"
import { DetalhesFicha } from "./components/detalhes-ficha"
import { Login } from "../auth/components/login"
import { HeaderApp } from "../shared/components/header-app"
import { ErrorBoundary } from "../shared/components/error-boundary"
import { ClientOnly } from "../shared/components/client-only"
import { useAuth } from "../shared/hooks/useAuth"
import { pratosService, type Prato } from "../shared/lib/fichas-tecnicas-service"
import type { Usuario } from "../shared/lib/auth"

type TelaAtiva = "home" | "listagem" | "detalhes"

export default function FichasTecnicasPage() {
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>("home")
  const [pratoAtivo, setPratoAtivo] = useState<Prato | null>(null)
  const { usuario, loading, login, logout } = useAuth()
  const router = useRouter()
  const [estatisticas, setEstatisticas] = useState<{
    total: number
    minhas: number
    este_mes: number
    crescimento_mensal: number
  }>({
    total: 0,
    minhas: 0,
    este_mes: 0,
    crescimento_mensal: 0
  })

  useEffect(() => {
    if (usuario) {
      carregarEstatisticas()
    }
  }, [usuario])

  const carregarEstatisticas = async () => {
    if (!usuario) return
    
    try {
      const stats = await pratosService.obterEstatisticas(
        usuario.loja_id,
        usuario.id
      )
      setEstatisticas(stats)
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  const handleLoginSuccess = (user: Usuario) => {
    setTelaAtiva("home")
  }

  const handleFichaAtualizada = () => {
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

  const podeCriar = usuario.permissoes?.includes("criar") || usuario.permissoes?.includes("editar")
  const podeExcluir = usuario.permissoes?.includes("excluir")

  const renderTela = () => {
    switch (telaAtiva) {
      case "listagem":
        return (
          <ListagemFichas
            usuario={usuario}
            onVoltar={() => setTelaAtiva("home")}
            onVerDetalhes={(prato) => {
              setPratoAtivo(prato)
              setTelaAtiva("detalhes")
            }}
            onAtualizar={handleFichaAtualizada}
          />
        )
      case "detalhes":
        return (
          <DetalhesFicha
            prato={pratoAtivo!}
            usuario={usuario}
            onVoltar={() => setTelaAtiva("listagem")}
            onAtualizar={handleFichaAtualizada}
          />
        )
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
            <div className="max-w-md mx-auto space-y-6">
              {/* Header */}
              <div className="mb-4">
                <HeaderApp
                  usuario={usuario}
                  onLogout={logout}
                  onGerenciarUsuarios={
                    podeExcluir ? undefined : undefined
                  }
                />
              </div>

              {/* Header do App */}
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 p-2">
                  <FileText className="w-12 h-12 text-[#000000]" />
                </div>
                <h1 className="text-3xl font-bold text-[#000000] mb-2">Fichas Técnicas</h1>
                <p className="text-[#5F6B6D] text-lg">Sistema de Fichas Técnicas de Produção</p>
              </div>

              {/* Estatísticas */}
              <Card className="border-2 border-[#fabd07] shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#000000] text-lg">Resumo Geral</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-[#fabd07]">{estatisticas.total}</div>
                      <div className="text-xs text-[#5F6B6D]">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#4AC5BB]">{estatisticas.este_mes}</div>
                      <div className="text-xs text-[#5F6B6D]">Este Mês</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#3599B8]">{estatisticas.minhas}</div>
                      <div className="text-xs text-[#5F6B6D]">Minhas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#F4D25A]">
                        {estatisticas.crescimento_mensal >= 0 ? '+' : ''}{estatisticas.crescimento_mensal}%
                      </div>
                      <div className="text-xs text-[#5F6B6D]">Crescimento</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Menu Principal */}
              <div className="space-y-4">
                {/* Botão Criar (para usuários com permissão) */}
                {podeCriar && (
                  <Card className="border-2 border-[#fabd07] shadow-lg">
                    <CardContent className="p-6">
                      <Button
                        onClick={() => router.push('/fichas-tecnicas/nova')}
                        className="w-full h-16 bg-[#fabd07] hover:bg-[#b58821] text-white text-lg font-semibold rounded-xl"
                      >
                        <Plus className="w-6 h-6 mr-3" />
                        Nova Ficha Técnica
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Botão Ver Todas */}
                <Card className="border-2 border-[#3599B8] shadow-lg">
                  <CardContent className="p-6">
                    <Button
                      onClick={() => setTelaAtiva("listagem")}
                      className="w-full h-16 bg-[#3599B8] hover:bg-[#4AC5BB] text-white text-lg font-semibold rounded-xl"
                    >
                      <List className="w-6 h-6 mr-3" />
                      Ver Todas as Fichas
                    </Button>
                  </CardContent>
                </Card>

                {/* Ações Rápidas */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-2 border-[#C9B07A] shadow-lg">
                    <CardContent className="p-4">
                      <Button
                        onClick={() => setTelaAtiva("listagem")}
                        className="w-full h-12 bg-[#C9B07A] hover:bg-[#8B8C7E] text-white text-sm font-semibold rounded-xl"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Buscar
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#DFBFBF] shadow-lg">
                    <CardContent className="p-4">
                      <Button
                        disabled
                        className="w-full h-12 bg-[#DFBFBF] text-[#5F6B6D] text-sm font-semibold rounded-xl cursor-not-allowed"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Relatórios
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Status do Sistema */}
              <Card className="border-2 border-[#C9B07A] shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#000000] text-lg">Status do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center text-sm">
                    <div>
                      <p className="text-[#5F6B6D] mb-1">Fichas ativas:</p>
                      <p className="font-semibold text-[#4AC5BB]">{estatisticas.total}</p>
                    </div>
                    <div>
                      <p className="text-[#5F6B6D] mb-1">Último acesso:</p>
                      <p className="font-semibold text-[#000000]">
                        {new Date().toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-[#F4DDAE] rounded-lg">
                    <p className="text-xs text-[#5F6B6D]">
                      📋 <strong>Dica:</strong> Use o módulo de Fichas Técnicas para criar receitas 
                      detalhadas com ingredientes, quantidades, quebra e fatores de correção para 
                      uma produção mais precisa.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="text-center pt-4">
                <p className="text-[#5F6B6D] text-sm">Módulo Fichas Técnicas - OX Management System</p>
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