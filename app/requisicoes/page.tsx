"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, List, Package, Clock, CheckCircle } from "lucide-react"
import { ListagemRequisicoes } from "./components/listagem-requisicoes"
import { DetalhesRequisicao } from "./components/detalhes-requisicao"
import { Login } from "../auth/components/login"
import { HeaderApp } from "../shared/components/header-app"
import { ErrorBoundary } from "../shared/components/error-boundary"
import { ClientOnly } from "../shared/components/client-only"
import { useAuth } from "../shared/hooks/useAuth"
import { requisicoesService, type Requisicao } from "../shared/lib/requisicoes-service"
import type { Usuario } from "../shared/lib/auth"

type TelaAtiva = "home" | "listagem" | "detalhes"

export default function RequisicoesPage() {
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>("home")
  const [requisicaoAtiva, setRequisicaoAtiva] = useState<Requisicao | null>(null)
  const { usuario, loading, login, logout } = useAuth()
  const router = useRouter()
  const [estatisticas, setEstatisticas] = useState<{
    total: number
    pendentes: number
    separadas: number
    entregues: number
    minhas_pendentes?: number
    aguardando_confirmacao?: number
  }>({
    total: 0,
    pendentes: 0,
    separadas: 0,
    entregues: 0
  })

  useEffect(() => {
    if (usuario) {
      carregarEstatisticas()
    }
  }, [usuario])

  const carregarEstatisticas = async () => {
    if (!usuario) return
    
    try {
      const stats = await requisicoesService.obterEstatisticas(
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

  const handleRequisicaoAtualizada = () => {
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

  const podeGerenciarEstoque = usuario.permissoes?.includes("editar") || usuario.permissoes?.includes("excluir")
  const podeCrear = usuario.permissoes?.includes("criar")

  const renderTela = () => {
    switch (telaAtiva) {
      case "listagem":
        return (
          <ListagemRequisicoes
            usuario={usuario}
            onVoltar={() => setTelaAtiva("home")}
            onVerDetalhes={(requisicao) => {
              setRequisicaoAtiva(requisicao)
              setTelaAtiva("detalhes")
            }}
            onAtualizar={handleRequisicaoAtualizada}
          />
        )
      case "detalhes":
        return (
          <DetalhesRequisicao
            requisicao={requisicaoAtiva!}
            usuario={usuario}
            onVoltar={() => setTelaAtiva("listagem")}
            onAtualizar={handleRequisicaoAtualizada}
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
                    usuario.permissoes?.includes("excluir") ? undefined : undefined
                  }
                />
              </div>

              {/* Header do App */}
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 p-2">
                  <Package className="w-12 h-12 text-[#000000]" />
                </div>
                <h1 className="text-3xl font-bold text-[#000000] mb-2">Requisições</h1>
                <p className="text-[#5F6B6D] text-lg">Sistema de Requisições de Estoque</p>
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
                      <div className="text-2xl font-bold text-[#F4D25A]">{estatisticas.pendentes}</div>
                      <div className="text-xs text-[#5F6B6D]">Pendentes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#3599B8]">{estatisticas.separadas}</div>
                      <div className="text-xs text-[#5F6B6D]">Separadas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#4AC5BB]">{estatisticas.entregues}</div>
                      <div className="text-xs text-[#5F6B6D]">Entregues</div>
                    </div>
                  </div>

                  {/* Estatísticas pessoais para usuários de setor */}
                  {!podeGerenciarEstoque && (estatisticas.minhas_pendentes || estatisticas.aguardando_confirmacao) && (
                    <div className="border-t border-[#DFBFBF] pt-3 mt-3">
                      <h4 className="text-sm font-semibold text-[#000000] mb-2">Minhas Requisições:</h4>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-[#F4D25A]">{estatisticas.minhas_pendentes}</div>
                          <div className="text-xs text-[#5F6B6D]">Pendentes</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-[#fabd07]">{estatisticas.aguardando_confirmacao}</div>
                          <div className="text-xs text-[#5F6B6D]">Confirmar</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Menu Principal */}
              <div className="space-y-4">
                {/* Botões para usuários de setor */}
                {podeCrear && (
                  <>
                    <Card className="border-2 border-[#fabd07] shadow-lg">
                      <CardContent className="p-6">
                        <Button
                          onClick={() => router.push('/requisicoes/nova')}
                          className="w-full h-16 bg-[#fabd07] hover:bg-[#b58821] text-white text-lg font-semibold rounded-xl"
                        >
                          <Plus className="w-6 h-6 mr-3" />
                          Nova Requisição
                        </Button>
                      </CardContent>
                    </Card>

                    {estatisticas.aguardando_confirmacao && estatisticas.aguardando_confirmacao > 0 && (
                      <Card className="border-2 border-[#4AC5BB] shadow-lg">
                        <CardContent className="p-6">
                          <Button
                            onClick={() => router.push('/requisicoes/confirmar')}
                            className="w-full h-16 bg-[#4AC5BB] hover:bg-[#3599B8] text-white text-lg font-semibold rounded-xl"
                          >
                            <CheckCircle className="w-6 h-6 mr-3" />
                            Confirmar Recebimentos
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Botões para estoque central */}
                {podeGerenciarEstoque && (
                  <>
                    {estatisticas.pendentes > 0 && (
                      <Card className="border-2 border-[#F4D25A] shadow-lg">
                        <CardContent className="p-6">
                          <Button
                            onClick={() => router.push('/requisicoes/separacao')}
                            className="w-full h-16 bg-[#F4D25A] hover:bg-[#b58821] text-[#000000] text-lg font-semibold rounded-xl"
                          >
                            <Package className="w-6 h-6 mr-3" />
                            Separar Itens ({estatisticas.pendentes})
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {estatisticas.separadas > 0 && (
                      <Card className="border-2 border-[#3599B8] shadow-lg">
                        <CardContent className="p-6">
                          <Button
                            onClick={() => router.push('/requisicoes/entregas')}
                            className="w-full h-16 bg-[#3599B8] hover:bg-[#4AC5BB] text-white text-lg font-semibold rounded-xl"
                          >
                            <Clock className="w-6 h-6 mr-3" />
                            Registrar Entregas ({estatisticas.separadas})
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Botão ver todas (sempre disponível) */}
                <Card className="border-2 border-[#3599B8] shadow-lg">
                  <CardContent className="p-6">
                    <Button
                      onClick={() => setTelaAtiva("listagem")}
                      className="w-full h-16 bg-[#3599B8] hover:bg-[#4AC5BB] text-white text-lg font-semibold rounded-xl"
                    >
                      <List className="w-6 h-6 mr-3" />
                      Ver Todas as Requisições
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Footer */}
              <div className="text-center pt-4">
                <p className="text-[#5F6B6D] text-sm">Módulo Requisições - OX Management System</p>
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