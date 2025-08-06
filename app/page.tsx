"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, List } from "lucide-react"
import { NovoInventario } from "./components/novo-inventario"
import { AdicionarItens } from "./components/adicionar-itens"
import { ListagemInventarios } from "./components/listagem-inventarios"
import { DetalhesInventario } from "./components/detalhes-inventario"
import { CadastroUsuarios } from "./components/cadastro-usuarios"
import { Login } from "./components/login"
import { HeaderApp } from "./components/header-app"
import { authService, type Usuario } from "./lib/auth"

export default function HomePage() {
  const [telaAtiva, setTelaAtiva] = useState<"home" | "novo" | "adicionar" | "listagem" | "detalhes" | "usuarios">(
    "home",
  )
  const [inventarioAtivo, setInventarioAtivo] = useState<any>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregandoAuth, setCarregandoAuth] = useState(true)

  useEffect(() => {
    // Verificar se há sessão ativa
    verificarSessaoAtiva()

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          const usuarioCompleto = await authService.obterUsuarioCompleto(session.user.id)
          setUsuario(usuarioCompleto)
        } catch (error) {
          console.error("Erro ao obter usuário:", error)
        }
      } else if (event === "SIGNED_OUT") {
        setUsuario(null)
        setTelaAtiva("home")
      }
      setCarregandoAuth(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const verificarSessaoAtiva = async () => {
    try {
      const session = await authService.verificarSessao()
      if (session) {
        const usuarioCompleto = await authService.obterUsuarioCompleto(session.user.id)
        setUsuario(usuarioCompleto)
      }
    } catch (error) {
      console.error("Erro ao verificar sessão:", error)
    } finally {
      setCarregandoAuth(false)
    }
  }

  const handleLoginSuccess = (user: Usuario) => {
    setUsuario(user)
    setTelaAtiva("home")
  }

  const handleLogout = () => {
    setUsuario(null)
    setTelaAtiva("home")
    setInventarioAtivo(null)
  }

  // Tela de carregamento
  if (carregandoAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fabd07] mx-auto mb-4"></div>
          <p className="text-[#5F6B6D]">Carregando...</p>
        </div>
      </div>
    )
  }

  // Tela de login se não estiver autenticado
  if (!usuario) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  const renderTela = () => {
    switch (telaAtiva) {
      case "novo":
        return (
          <NovoInventario
            usuario={usuario}
            onVoltar={() => setTelaAtiva("home")}
            onInventarioCriado={(inventario) => {
              setInventarioAtivo(inventario)
              setTelaAtiva("adicionar")
            }}
          />
        )
      case "adicionar":
        return <AdicionarItens inventario={inventarioAtivo} usuario={usuario} onVoltar={() => setTelaAtiva("home")} />
      case "listagem":
        return (
          <ListagemInventarios
            usuario={usuario}
            onVoltar={() => setTelaAtiva("home")}
            onEditarInventario={(inventario) => {
              setInventarioAtivo(inventario)
              setTelaAtiva("detalhes")
            }}
            onAdicionarItens={(inventario) => {
              setInventarioAtivo(inventario)
              setTelaAtiva("adicionar")
            }}
          />
        )
      case "detalhes":
        return (
          <DetalhesInventario
            inventario={inventarioAtivo}
            usuario={usuario}
            onVoltar={() => setTelaAtiva("listagem")}
            onInventarioAtualizado={(inventario) => {
              setInventarioAtivo(inventario)
            }}
          />
        )
      case "usuarios":
        return <CadastroUsuarios usuario={usuario} onVoltar={() => setTelaAtiva("home")} />
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
            <div className="max-w-md mx-auto space-y-6">
              {/* Header com info do usuário */}
              <HeaderApp
                usuario={usuario}
                onLogout={handleLogout}
                onGerenciarUsuarios={
                  usuario.permissoes?.includes("excluir") ? () => setTelaAtiva("usuarios") : undefined
                }
              />

              {/* Header do App */}
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 p-2">
                  <img src="/images/ox-logo.png" alt="OX Group" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-3xl font-bold text-[#000000] mb-2">OX Inventory</h1>
                <p className="text-[#5F6B6D] text-lg">Sistema de Contagem de Inventário</p>
              </div>

              {/* Menu Principal */}
              <div className="space-y-4">
                <Card className="border-2 border-[#fabd07] shadow-lg">
                  <CardContent className="p-6">
                    <Button
                      onClick={() => setTelaAtiva("novo")}
                      className="w-full h-16 bg-[#fabd07] hover:bg-[#b58821] text-white text-lg font-semibold rounded-xl"
                    >
                      <Plus className="w-6 h-6 mr-3" />
                      Novo Inventário
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#3599B8] shadow-lg">
                  <CardContent className="p-6">
                    <Button
                      onClick={() => setTelaAtiva("listagem")}
                      className="w-full h-16 bg-[#3599B8] hover:bg-[#4AC5BB] text-white text-lg font-semibold rounded-xl"
                    >
                      <List className="w-6 h-6 mr-3" />
                      Ver Inventários
                    </Button>
                  </CardContent>
                </Card>

                {/* Card de Status - Mostra último inventário */}
                <Card className="border-2 border-[#C9B07A] shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#000000] text-lg">Status da Loja</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-[#5F6B6D]">
                      <p className="text-sm mb-1">Loja atual:</p>
                      <p className="font-semibold text-[#000000]">{usuario.loja_nome}</p>
                      <p className="text-sm text-[#8B8C7E] mt-2">Último inventário: Hoje - 14:30</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Footer */}
              <div className="text-center pt-4">
                <p className="text-[#5F6B6D] text-sm">Versão 1.0 - OX Inventory System</p>
              </div>
            </div>
          </div>
        )
    }
  }

  return renderTela()
}
