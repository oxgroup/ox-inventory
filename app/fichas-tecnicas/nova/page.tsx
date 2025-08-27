"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Plus, X, Search, Package } from "lucide-react"
import { NovaFicha } from "../components/nova-ficha"
import { Login } from "../../auth/components/login"
import { ErrorBoundary } from "../../shared/components/error-boundary"
import { ClientOnly } from "../../shared/components/client-only"
import { useAuth } from "../../shared/hooks/useAuth"
import type { Usuario } from "../../shared/lib/auth"

export default function NovaFichaPage() {
  const { usuario, loading, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (usuario && !usuario.permissoes?.includes("criar") && !usuario.permissoes?.includes("editar")) {
      router.push('/fichas-tecnicas')
      return
    }
  }, [usuario, router])

  const handleLoginSuccess = (user: Usuario) => {
    if (!user.permissoes?.includes("criar") && !user.permissoes?.includes("editar")) {
      router.push('/fichas-tecnicas')
      return
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

  if (!usuario) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  if (!usuario.permissoes?.includes("criar") && !usuario.permissoes?.includes("editar")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-[#FB8281] shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-[#FB8281] mb-4">Sem permissão para criar fichas técnicas.</p>
            <Button
              onClick={() => router.push('/fichas-tecnicas')}
              className="bg-[#3599B8] hover:bg-[#4AC5BB] text-white"
            >
              Voltar ao Módulo
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
        <NovaFicha 
          usuario={usuario}
          onVoltar={() => router.push('/fichas-tecnicas')}
          onSalvar={() => {
            router.push('/fichas-tecnicas')
          }}
        />
      </ErrorBoundary>
    </ClientOnly>
  )
}