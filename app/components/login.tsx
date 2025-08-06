"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, LogIn, AlertCircle, RefreshCw } from "lucide-react"
import { authService } from "../lib/auth"

interface LoginProps {
  onLoginSuccess: (user: any) => void
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")

    if (!email || !senha) {
      setErro("Por favor, preencha todos os campos")
      return
    }

    setCarregando(true)

    try {
      console.log("Iniciando login...")
      const result = await authService.login(email, senha)
      console.log("Login concluído:", result.user?.nome)

      if (result.user) {
        onLoginSuccess(result.user)
      }
    } catch (error: any) {
      console.error("Erro de autenticação:", error)

      let mensagem = "Erro desconhecido"

      if (error.message?.includes("Invalid login credentials")) {
        mensagem = "Email ou senha incorretos"
      } else if (error.message?.includes("Email not confirmed")) {
        mensagem = "Email não confirmado"
      } else if (error.message?.includes("Invalid email")) {
        mensagem = "Email inválido"
      } else {
        mensagem = "Erro ao fazer login. Verifique suas credenciais."
      }

      setErro(mensagem)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 p-2">
            <img src="/images/ox-logo.png" alt="OX Group" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-[#000000] mb-2">OX Inventory</h1>
          <p className="text-[#5F6B6D] text-lg">Sistema de Contagem de Inventário</p>
        </div>

        {/* Formulário de Login */}
        <Card className="border-2 border-[#fabd07] shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#000000] text-center">Acesso ao Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mostrar erro se houver */}
            {erro && (
              <div className="mb-4 p-3 bg-[#FB8281]/10 border border-[#FB8281] rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-[#FB8281] mr-2" />
                  <span className="text-sm text-[#FB8281]">{erro}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[#000000] font-semibold text-sm">Email *</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                  required
                />
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label className="text-[#000000] font-semibold text-sm">Senha *</label>
                <div className="relative">
                  <Input
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-12 border-2 border-[#C9B07A] focus:border-[#fabd07] pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-2 top-2 h-8 w-8 p-0 text-[#5F6B6D] hover:text-[#000000]"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Botão Submit */}
              <Button
                type="submit"
                disabled={carregando}
                className="w-full h-12 bg-[#fabd07] hover:bg-[#b58821] text-white font-semibold rounded-xl"
              >
                {carregando ? (
                  <div className="flex items-center">
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Entrando...
                  </div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informações de contato */}
        <Card className="border border-[#DFBFBF] bg-white/80">
          <CardContent className="p-4">
            <h3 className="font-semibold text-[#000000] mb-2">📞 Precisa de acesso?</h3>
            <p className="text-sm text-[#5F6B6D]">
              Entre em contato com o administrador do sistema para solicitar suas credenciais de acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
