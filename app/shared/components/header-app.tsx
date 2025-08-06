"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, User, Crown, Users } from "lucide-react"
import { authService, type Usuario } from "../lib/auth"

interface HeaderAppProps {
  usuario: Usuario
  onLogout: () => void
  onGerenciarUsuarios?: () => void
}

export function HeaderApp({ usuario, onLogout, onGerenciarUsuarios }: HeaderAppProps) {
  const handleLogout = async () => {
    try {
      await authService.logout()
      onLogout()
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const isAdmin = usuario.permissoes?.includes("excluir")

  return (
    <Card className="border-2 border-[#C9B07A] shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#fabd07] rounded-full flex items-center justify-center">
              {isAdmin ? <Crown className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="font-semibold text-[#000000] text-sm">{usuario.nome}</div>
              <div className="text-xs text-[#5F6B6D]">{usuario.loja_nome}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isAdmin && onGerenciarUsuarios && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onGerenciarUsuarios}
                className="text-[#3599B8] hover:bg-[#3599B8]/10"
              >
                <Users className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#FB8281] hover:bg-[#FB8281]/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
