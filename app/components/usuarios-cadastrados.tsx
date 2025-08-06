"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Store, Eye, EyeOff, Copy, Check } from "lucide-react"
import { supabase } from "../lib/supabase"

interface UsuariosCadastradosProps {
  onFechar?: () => void
}

export function UsuariosCadastrados({ onFechar }: UsuariosCadastradosProps) {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarSenhas, setMostrarSenhas] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)

  // Lista de usuários com senhas padrão para demonstração
  const usuariosDemo = [
    {
      nome: "Admin CWB",
      email: "admin.cwb@oxgrill.com",
      senha: "123456",
      loja: "CWB - Curitiba",
      permissoes: ["visualizar", "criar", "editar", "excluir"],
      tipo: "Administrador",
    },
    {
      nome: "Admin BC",
      email: "admin.bc@oxgrill.com",
      senha: "123456",
      loja: "BC - Balneário Camboriú",
      permissoes: ["visualizar", "criar", "editar", "excluir"],
      tipo: "Administrador",
    },
    {
      nome: "João Silva",
      email: "joao.cwb@oxgrill.com",
      senha: "123456",
      loja: "CWB - Curitiba",
      permissoes: ["visualizar", "criar", "editar"],
      tipo: "Funcionário",
    },
    {
      nome: "Maria Santos",
      email: "maria.bc@oxgrill.com",
      senha: "123456",
      loja: "BC - Balneário Camboriú",
      permissoes: ["visualizar", "criar", "editar"],
      tipo: "Funcionário",
    },
    {
      nome: "Carlos Lima",
      email: "carlos.cwb@oxgrill.com",
      senha: "123456",
      loja: "CWB - Curitiba",
      permissoes: ["visualizar", "criar"],
      tipo: "Operador",
    },
    {
      nome: "Ana Oliveira",
      email: "ana.bc@oxgrill.com",
      senha: "123456",
      loja: "BC - Balneário Camboriú",
      permissoes: ["visualizar", "criar"],
      tipo: "Operador",
    },
  ]

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    try {
      // Tentar carregar usuários do banco
      const { data, error } = await supabase
        .from("usuarios")
        .select(`
          *,
          lojas (
            nome,
            codigo
          )
        `)
        .order("nome")

      if (error) {
        console.error("Erro ao carregar usuários:", error)
        // Usar dados demo se houver erro
        setUsuarios(usuariosDemo)
      } else {
        // Mapear dados do banco para formato esperado
        const usuariosMapeados =
          data?.map((user) => ({
            nome: user.nome,
            email: user.email,
            senha: "123456", // Senha padrão para demo
            loja: `${user.lojas?.codigo} - ${user.lojas?.nome?.split(" - ")[1] || user.lojas?.nome}`,
            permissoes: user.permissoes || [],
            tipo: user.permissoes?.includes("excluir")
              ? "Administrador"
              : user.permissoes?.includes("editar")
                ? "Funcionário"
                : "Operador",
          })) || []

        setUsuarios(usuariosMapeados.length > 0 ? usuariosMapeados : usuariosDemo)
      }
    } catch (error) {
      console.error("Erro ao conectar com banco:", error)
      setUsuarios(usuariosDemo)
    } finally {
      setCarregando(false)
    }
  }

  const copiarCredenciais = async (email: string, senha: string) => {
    const texto = `Email: ${email}\nSenha: ${senha}`
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(email)
      setTimeout(() => setCopiado(null), 2000)
    } catch (error) {
      console.error("Erro ao copiar:", error)
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "Administrador":
        return "bg-[#FB8281] text-white"
      case "Funcionário":
        return "bg-[#4AC5BB] text-white"
      case "Operador":
        return "bg-[#F4D25A] text-[#000000]"
      default:
        return "bg-[#8B8C7E] text-white"
    }
  }

  const getLojaColor = (loja: string) => {
    if (loja.includes("CWB")) {
      return "bg-[#fabd07] text-white"
    } else if (loja.includes("BC")) {
      return "bg-[#3599B8] text-white"
    }
    return "bg-[#C9B07A] text-white"
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fabd07] mx-auto mb-4"></div>
          <p className="text-[#5F6B6D]">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-[#fabd07] rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#000000] mb-2">Usuários Cadastrados</h1>
          <p className="text-[#5F6B6D]">Lista de usuários para teste do sistema</p>
        </div>

        {/* Controles */}
        <Card className="border-2 border-[#fabd07]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarSenhas(!mostrarSenhas)}
                  className="border-[#C9B07A] text-[#000000] hover:bg-[#F4DDAE]"
                >
                  {mostrarSenhas ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {mostrarSenhas ? "Ocultar Senhas" : "Mostrar Senhas"}
                </Button>
                <Badge className="bg-[#8B8C7E] text-white">{usuarios.length} usuários</Badge>
              </div>
              {onFechar && (
                <Button variant="ghost" onClick={onFechar} className="text-[#5F6B6D] hover:text-[#000000]">
                  Fechar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <div className="space-y-4">
          {usuarios.map((usuario, index) => (
            <Card key={index} className="border border-[#C9B07A] shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header do usuário */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-[#000000]">{usuario.nome}</h3>
                        <Badge className={getTipoColor(usuario.tipo)}>{usuario.tipo}</Badge>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Store className="w-4 h-4 text-[#5F6B6D]" />
                        <Badge className={getLojaColor(usuario.loja)}>{usuario.loja}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copiarCredenciais(usuario.email, usuario.senha)}
                      className="text-[#3599B8] hover:bg-[#3599B8]/10"
                    >
                      {copiado === usuario.email ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Credenciais */}
                  <div className="bg-[#F4DDAE] p-3 rounded-lg space-y-2">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-[#5F6B6D] font-medium">Email:</span>
                        <span className="text-[#000000] ml-2 font-mono">{usuario.email}</span>
                      </div>
                      <div>
                        <span className="text-[#5F6B6D] font-medium">Senha:</span>
                        <span className="text-[#000000] ml-2 font-mono">
                          {mostrarSenhas ? usuario.senha : "••••••"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Permissões */}
                  <div>
                    <span className="text-[#5F6B6D] font-medium text-sm">Permissões:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {usuario.permissoes.map((permissao, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-[#C9B07A] text-[#5F6B6D]">
                          {permissao}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Informações importantes */}
        <Card className="border border-[#DFBFBF] bg-white/80">
          <CardContent className="p-4">
            <h3 className="font-semibold text-[#000000] mb-2">ℹ️ Informações Importantes:</h3>
            <ul className="text-sm text-[#5F6B6D] space-y-1">
              <li>
                • <strong>Senha padrão:</strong> 123456 (para todos os usuários de teste)
              </li>
              <li>
                • <strong>Isolamento:</strong> Cada usuário só vê dados da sua loja
              </li>
              <li>
                • <strong>Permissões:</strong> Administradores podem excluir, funcionários podem editar
              </li>
              <li>
                • <strong>Cadastro:</strong> Novos usuários podem se cadastrar pelo app
              </li>
              <li>
                • <strong>Segurança:</strong> Em produção, use senhas seguras
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card className="border-2 border-[#4AC5BB]">
          <CardHeader>
            <CardTitle className="text-[#000000] text-lg">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[#fabd07]">
                  {usuarios.filter((u) => u.loja.includes("CWB")).length}
                </div>
                <div className="text-xs text-[#5F6B6D]">Usuários CWB</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#3599B8]">
                  {usuarios.filter((u) => u.loja.includes("BC")).length}
                </div>
                <div className="text-xs text-[#5F6B6D]">Usuários BC</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
