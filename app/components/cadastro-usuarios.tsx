"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, UserPlus, Users, Eye, EyeOff, Trash2, Edit, Check, X, AlertCircle } from "lucide-react"
import { supabase } from "../lib/supabase"
import type { Usuario } from "../lib/auth"
import { createUser } from "../actions/create-user"
import { updateUser } from "../actions/update-user" // Import the updateUser function

interface CadastroUsuariosProps {
  usuario: Usuario
  onVoltar: () => void
}

export function CadastroUsuarios({ usuario, onVoltar }: CadastroUsuariosProps) {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarSenhas, setMostrarSenhas] = useState(false)
  const [modo, setModo] = useState<"lista" | "novo" | "editar">("lista")
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  // Formulário
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [lojaSelecionada, setLojaSelecionada] = useState("")
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<string[]>(["visualizar", "criar"])

  const lojas = [
    { id: "CWB", codigo: "CWB", nome: "OX SteakHouse - Curitiba" },
    { id: "BC", codigo: "BC", nome: "OX SteakHouse - Balneário Camboriú" },
  ]

  const permissoesDisponiveis = [
    { id: "visualizar", nome: "Visualizar" },
    { id: "criar", nome: "Criar" },
    { id: "editar", nome: "Editar" },
    { id: "excluir", nome: "Excluir" },
  ]

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    try {
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
        setErro("Erro ao carregar usuários")
      } else {
        setUsuarios(data || [])
      }
    } catch (error) {
      console.error("Erro ao conectar com banco:", error)
      setErro("Erro ao conectar com banco de dados")
    } finally {
      setCarregando(false)
    }
  }

  const limparFormulario = () => {
    setNome("")
    setEmail("")
    setSenha("")
    setLojaSelecionada("")
    setPermissoesSelecionadas(["visualizar", "criar"])
    setErro("")
    setSucesso("")
    setUsuarioEditando(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")
    setSucesso("")

    if (!nome || !email || !senha || !lojaSelecionada) {
      setErro("Por favor, preencha todos os campos")
      return
    }

    try {
      const res =
        modo === "novo"
          ? await createUser({
              nome,
              email,
              senha,
              lojaCodigo: lojaSelecionada,
              permissoes: permissoesSelecionadas,
            })
          : await updateUser(usuarioEditando.id, {
              nome,
              email,
              senha,
              lojaCodigo: lojaSelecionada,
              permissoes: permissoesSelecionadas,
            }) // Use the updateUser function

      if (!res.ok) {
        setErro(res.message)
        return
      }

      setSucesso(modo === "novo" ? "Usuário criado com sucesso!" : "Usuário atualizado com sucesso!")
      await carregarUsuarios()
      setTimeout(() => {
        setModo("lista")
        limparFormulario()
      }, 1500)
    } catch (error: any) {
      console.error("Erro:", error)
      setErro(error.message || "Erro inesperado")
    }
  }

  const handleEditar = (usuarioParaEditar: any) => {
    setUsuarioEditando(usuarioParaEditar)
    setNome(usuarioParaEditar.nome)
    setEmail(usuarioParaEditar.email)
    setSenha("") // Deixar vazio para não alterar
    setLojaSelecionada(usuarioParaEditar.lojas?.codigo || "")
    setPermissoesSelecionadas(usuarioParaEditar.permissoes || [])
    setModo("editar")
  }

  const handleExcluir = async (usuarioParaExcluir: any) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${usuarioParaExcluir.nome}?`)) {
      return
    }

    try {
      // Excluir da tabela usuarios
      const { error: deleteError } = await supabase.from("usuarios").delete().eq("id", usuarioParaExcluir.id)

      if (deleteError) {
        console.error("Erro ao excluir usuário:", deleteError)
        setErro("Erro ao excluir usuário: " + deleteError.message)
        return
      }

      // Excluir do Auth se tiver auth_id
      if (usuarioParaExcluir.auth_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(usuarioParaExcluir.auth_id)
        if (authError) {
          console.error("Erro ao excluir do Auth:", authError)
        }
      }

      setSucesso("Usuário excluído com sucesso!")
      await carregarUsuarios()
    } catch (error: any) {
      console.error("Erro ao excluir:", error)
      setErro("Erro inesperado: " + error.message)
    }
  }

  const getTipoColor = (permissoes: string[]) => {
    if (permissoes?.includes("excluir")) {
      return "bg-[#FB8281] text-white"
    } else if (permissoes?.includes("editar")) {
      return "bg-[#4AC5BB] text-white"
    } else {
      return "bg-[#F4D25A] text-[#000000]"
    }
  }

  const getTipoNome = (permissoes: string[]) => {
    if (permissoes?.includes("excluir")) {
      return "Administrador"
    } else if (permissoes?.includes("editar")) {
      return "Funcionário"
    } else {
      return "Operador"
    }
  }

  const getLojaColor = (loja: string) => {
    if (loja?.includes("CWB")) {
      return "bg-[#fabd07] text-white"
    } else if (loja?.includes("BC")) {
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

  if (modo === "novo" || modo === "editar") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setModo("lista")
                limparFormulario()
              }}
              className="text-[#5F6B6D] hover:text-[#000000]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-[#000000]">{modo === "novo" ? "Novo Usuário" : "Editar Usuário"}</h1>
            <div></div>
          </div>

          {/* Formulário */}
          <Card className="border-2 border-[#fabd07] shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#000000] text-center flex items-center justify-center">
                <UserPlus className="w-5 h-5 mr-2" />
                {modo === "novo" ? "Cadastrar Usuário" : "Editar Usuário"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mostrar erro/sucesso */}
              {erro && (
                <div className="mb-4 p-3 bg-[#FB8281]/10 border border-[#FB8281] rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-[#FB8281] mr-2" />
                    <span className="text-sm text-[#FB8281]">{erro}</span>
                  </div>
                </div>
              )}

              {sucesso && (
                <div className="mb-4 p-3 bg-[#4AC5BB]/10 border border-[#4AC5BB] rounded-lg">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-[#4AC5BB] mr-2" />
                    <span className="text-sm text-[#4AC5BB]">{sucesso}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div className="space-y-2">
                  <label className="text-[#000000] font-semibold text-sm">Nome Completo *</label>
                  <Input
                    type="text"
                    placeholder="Nome completo do usuário"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[#000000] font-semibold text-sm">Email *</label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                    required
                  />
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <label className="text-[#000000] font-semibold text-sm">
                    Senha * {modo === "editar" && "(deixe vazio para não alterar)"}
                  </label>
                  <Input
                    type="password"
                    placeholder="Senha do usuário"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                    required={modo === "novo"}
                  />
                </div>

                {/* Loja */}
                <div className="space-y-2">
                  <label className="text-[#000000] font-semibold text-sm">Loja *</label>
                  <Select value={lojaSelecionada} onValueChange={setLojaSelecionada}>
                    <SelectTrigger className="h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]">
                      <SelectValue placeholder="Selecione a loja..." />
                    </SelectTrigger>
                    <SelectContent>
                      {lojas.map((loja) => (
                        <SelectItem key={loja.codigo} value={loja.codigo}>
                          {loja.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Permissões */}
                <div className="space-y-2">
                  <label className="text-[#000000] font-semibold text-sm">Permissões *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {permissoesDisponiveis.map((permissao) => (
                      <label key={permissao.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissoesSelecionadas.includes(permissao.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPermissoesSelecionadas([...permissoesSelecionadas, permissao.id])
                            } else {
                              setPermissoesSelecionadas(permissoesSelecionadas.filter((p) => p !== permissao.id))
                            }
                          }}
                          className="rounded border-[#C9B07A]"
                        />
                        <span className="text-sm text-[#000000]">{permissao.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setModo("lista")
                      limparFormulario()
                    }}
                    className="flex-1 border-[#C9B07A] text-[#000000] hover:bg-[#F4DDAE]"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-[#fabd07] hover:bg-[#b58821] text-white">
                    <Check className="w-4 h-4 mr-2" />
                    {modo === "novo" ? "Cadastrar" : "Salvar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onVoltar} className="text-[#5F6B6D] hover:text-[#000000]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold text-[#000000]">Gerenciar Usuários</h1>
          <Button
            onClick={() => {
              setModo("novo")
              limparFormulario()
            }}
            className="bg-[#fabd07] hover:bg-[#b58821] text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo
          </Button>
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
            </div>
          </CardContent>
        </Card>

        {/* Mensagens */}
        {erro && (
          <div className="p-3 bg-[#FB8281]/10 border border-[#FB8281] rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-[#FB8281] mr-2" />
              <span className="text-sm text-[#FB8281]">{erro}</span>
            </div>
          </div>
        )}

        {sucesso && (
          <div className="p-3 bg-[#4AC5BB]/10 border border-[#4AC5BB] rounded-lg">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-[#4AC5BB] mr-2" />
              <span className="text-sm text-[#4AC5BB]">{sucesso}</span>
            </div>
          </div>
        )}

        {/* Lista de Usuários */}
        <div className="space-y-4">
          {usuarios.map((usuarioItem, index) => (
            <Card key={index} className="border border-[#C9B07A] shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header do usuário */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-[#000000]">{usuarioItem.nome}</h3>
                        <Badge className={getTipoColor(usuarioItem.permissoes)}>
                          {getTipoNome(usuarioItem.permissoes)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getLojaColor(usuarioItem.lojas?.codigo)}>
                          {usuarioItem.lojas?.codigo} -{" "}
                          {usuarioItem.lojas?.nome?.split(" - ")[1] || usuarioItem.lojas?.nome}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditar(usuarioItem)}
                        className="text-[#3599B8] hover:bg-[#3599B8]/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluir(usuarioItem)}
                        className="text-[#FB8281] hover:bg-[#FB8281]/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Credenciais */}
                  <div className="bg-[#F4DDAE] p-3 rounded-lg space-y-2">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-[#5F6B6D] font-medium">Email:</span>
                        <span className="text-[#000000] ml-2 font-mono">{usuarioItem.email}</span>
                      </div>
                      <div>
                        <span className="text-[#5F6B6D] font-medium">Senha:</span>
                        <span className="text-[#000000] ml-2 font-mono">{mostrarSenhas ? "••••••" : "••••••"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Permissões */}
                  <div>
                    <span className="text-[#5F6B6D] font-medium text-sm">Permissões:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {usuarioItem.permissoes?.map((permissao: string, idx: number) => (
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

        {usuarios.length === 0 && (
          <Card className="border border-[#DFBFBF] bg-white/80">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-[#8B8C7E] mx-auto mb-4" />
              <h3 className="font-semibold text-[#000000] mb-2">Nenhum usuário cadastrado</h3>
              <p className="text-sm text-[#5F6B6D] mb-4">
                Clique em "Novo" para cadastrar o primeiro usuário do sistema.
              </p>
              <Button
                onClick={() => {
                  setModo("novo")
                  limparFormulario()
                }}
                className="bg-[#fabd07] hover:bg-[#b58821] text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Usuário
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
