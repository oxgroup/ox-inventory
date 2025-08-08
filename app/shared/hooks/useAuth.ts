"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authService, type Usuario } from "../lib/auth"

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const currentUser = await authService.obterUsuarioAtual()
      setUsuario(currentUser)
    } catch (error) {
      console.error("Erro ao verificar usuário:", error)
      setUsuario(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, senha: string) => {
    try {
      const user = await authService.login(email, senha)
      setUsuario(user)
      return user
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUsuario(null)
      router.push('/requisicoes')
    } catch (error) {
      console.error("Erro no logout:", error)
    }
  }

  const requireAuth = () => {
    if (!loading && !usuario) {
      router.push('/requisicoes')
      return false
    }
    return true
  }

  return {
    usuario,
    loading,
    login,
    logout,
    requireAuth,
    checkAuthStatus
  }
}