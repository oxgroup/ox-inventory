"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../shared/hooks/useAuth"
import { setoresDashboardService, type SetorAtivo } from "../shared/lib/setores-dashboard-service"
import { ListaSetores } from "./components/lista-setores"

export default function SetoresPage() {
  const { usuario } = useAuth()
  const [setoresAtivos, setSetoresAtivos] = useState<SetorAtivo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (usuario) {
      carregarSetores()
    }
  }, [usuario])

  const carregarSetores = async () => {
    if (!usuario) return
    
    setLoading(true)
    try {
      const setores = await setoresDashboardService.obterSetoresAtivos(usuario.loja_id)
      setSetoresAtivos(setores)
    } catch (error) {
      console.error('Erro ao carregar setores:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <div className="text-[#5F6B6D]">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-6xl mx-auto">
        <ListaSetores 
          usuario={usuario}
          setores={setoresAtivos}
          loading={loading}
          onRecarregar={carregarSetores}
        />
      </div>
    </div>
  )
}