"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ConfirmarRecebimento } from "../components/confirmar-recebimento"
import { Login } from "../../auth/components/login"
import { useAuth } from "../../shared/hooks/useAuth"
import type { Usuario } from "../../shared/lib/auth"

export default function ConfirmarRecebimentoPage() {
  const { usuario, loading, login, checkAuthStatus } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Esta funcionalidade é para usuários de setor (que podem criar requisições)
    if (usuario && !usuario.permissoes?.includes("criar")) {
      router.push('/requisicoes')
    }
  }, [usuario, router])

  const handleLoginSuccess = async (user: Usuario) => {
    // Forçar re-verificação do useAuth para sincronizar estado
    await checkAuthStatus()
    
    if (!user.permissoes?.includes("criar")) {
      router.push('/requisicoes')
    }
    // Se tem permissão, permanece na página - o useAuth irá atualizar automaticamente
  }

  const handleVoltar = () => {
    router.push('/requisicoes')
  }

  const handleAtualizar = () => {
    router.refresh()
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

  // Verificar permissões - usuários de setor podem confirmar recebimentos
  if (!usuario.permissoes?.includes("criar")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="text-6xl">🚫</div>
          <h2 className="text-2xl font-bold text-[#000000]">Acesso Negado</h2>
          <p className="text-[#5F6B6D]">
            Você não tem permissão para confirmar recebimentos. Esta funcionalidade é para usuários de setor.
          </p>
          <button
            onClick={handleVoltar}
            className="bg-[#fabd07] hover:bg-[#b58821] text-white px-6 py-3 rounded-lg font-semibold"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <ConfirmarRecebimento
      usuario={usuario}
      onVoltar={handleVoltar}
      onAtualizar={handleAtualizar}
    />
  )
}