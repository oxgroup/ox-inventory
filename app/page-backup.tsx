"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, BarChart3, Users, Settings, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { authService, type Usuario } from "./shared/lib/auth"
import { Login } from "./auth/components/login"
import { ClientOnly } from "./shared/components/client-only"
import { ErrorBoundary } from "./shared/components/error-boundary"

interface ModuleCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  disabled?: boolean
}

function ModuleCard({ title, description, icon, href, disabled = false }: ModuleCardProps) {
  if (disabled) {
    return (
      <Card className="border-2 border-gray-300 opacity-50 cursor-not-allowed">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-500 text-lg flex items-center gap-3">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm mb-4">{description}</p>
          <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            Em desenvolvimento
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Link href={href}>
      <Card className="border-2 border-[#fabd07] hover:border-[#b58821] transition-colors cursor-pointer group shadow-lg hover:shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#000000] text-lg flex items-center gap-3 group-hover:text-[#b58821]">
            {icon}
            {title}
            <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#5F6B6D] text-sm">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function DashboardContent() {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const currentUser = await authService.obterUsuarioAtual()
      setUser(currentUser)
    } catch (error) {
      console.error("Erro ao verificar usuário:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuccess = (user: Usuario) => {
    setUser(user)
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      setUser(null)
    } catch (error) {
      console.error("Erro no logout:", error)
    }
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

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE]">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-6">
            <div></div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 p-2">
                <img src="/images/ox-logo.png" alt="OX Group" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-4xl font-bold text-[#000000]">OX Management System</h1>
              <p className="text-[#5F6B6D] text-lg mt-2">Plataforma Integrada de Gestão</p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-sm text-[#5F6B6D] mb-2">Olá, <strong>{user.nome}</strong></p>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm"
                className="border-[#FB8281] text-[#FB8281] hover:bg-[#FB8281]/10"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="border-2 border-[#3599B8] shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5F6B6D]">Loja atual:</p>
                  <p className="font-semibold text-[#000000]">{user.loja_nome}</p>
                  <p className="text-xs text-[#8B8C7E] mt-1">Código: {user.loja_codigo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#5F6B6D]">Permissões:</p>
                  <div className="flex gap-1 mt-1">
                    {user.permissoes.map((perm) => (
                      <span 
                        key={perm} 
                        className="bg-[#4AC5BB] text-white px-2 py-1 rounded text-xs"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <ModuleCard
            title="📦 Inventário"
            description="Sistema de Contagem de Inventário com leitura de código de barras"
            icon={<Package className="w-6 h-6" />}
            href="/inventory"
          />
          
          <ModuleCard
            title="📊 Analytics"
            description="Relatórios, dashboards e análises de dados"
            icon={<BarChart3 className="w-6 h-6" />}
            href="/analytics"
            disabled
          />
          
          <ModuleCard
            title="👥 Usuários"
            description="Gestão de usuários e permissões"
            icon={<Users className="w-6 h-6" />}
            href="/users"
            disabled
          />
          
          <ModuleCard
            title="⚙️ Configurações"
            description="Configurações do sistema e preferências"
            icon={<Settings className="w-6 h-6" />}
            href="/settings"
            disabled
          />

          {/* Card de Status */}
          <Card className="border-2 border-[#C9B07A] shadow-lg md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#000000] text-lg">Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#5F6B6D] mb-1">Módulos ativos:</p>
                  <p className="font-semibold text-[#4AC5BB]">1 de 4</p>
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
                  💡 <strong>Dica:</strong> O módulo de Inventário está totalmente funcional com 
                  suporte a código de barras, busca inteligente e modo offline.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-4">
          <p className="text-[#5F6B6D] text-sm">Versão 2.0 - OX Management System</p>
          <p className="text-[#8B8C7E] text-xs mt-1">Sistema modular escalável</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
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
        <DashboardContent />
      </ErrorBoundary>
    </ClientOnly>
  )
}