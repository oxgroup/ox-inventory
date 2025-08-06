"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { inventarioService } from "../lib/supabase"
import type { Usuario } from "../lib/auth"

const SETORES = [
  "Câmara Congelada",
  "Câmara Resfriada",
  "Dry Aged",
  "Estoque Seco",
  "Estoque Limpeza",
  "Bar",
  "Estoque Bebidas",
  "Prep",
  "Linha",
  "Delivery",
]

interface NovoInventarioProps {
  usuario: Usuario
  onVoltar: () => void
  onInventarioCriado: (inventario: any) => void
}

export function NovoInventario({ usuario, onVoltar, onInventarioCriado }: NovoInventarioProps) {
  const [setorSelecionado, setSetorSelecionado] = useState("")
  const [carregando, setCarregando] = useState(false)

  const criarInventario = async () => {
    if (!setorSelecionado) {
      alert("Por favor, selecione um setor")
      return
    }

    setCarregando(true)

    try {
      const novoInventario = {
        setor: setorSelecionado,
        status: "em_contagem" as const,
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        // loja_id removido daqui, será passado como argumento
      }

      // Passar o id da loja do usuário logado como segundo argumento
      const inventarioCriado = await inventarioService.criar(novoInventario, usuario.loja_id)
      onInventarioCriado(inventarioCriado)
    } catch (error) {
      console.error("Erro ao criar inventário:", error)
      alert("Erro ao criar inventário. Verifique sua conexão e tente novamente.")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <Button variant="ghost" onClick={onVoltar} className="text-[#000000] hover:bg-white/20">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold text-[#000000]">Novo Inventário</h1>
          <div className="w-20"></div>
        </div>

        {/* Formulário */}
        <Card className="border-2 border-[#fabd07] shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#000000] text-center">Criar Novo Inventário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Setor */}
            <div className="space-y-2">
              <label className="text-[#000000] font-semibold text-sm">Selecione o Setor *</label>
              <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                <SelectTrigger className="h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]">
                  <SelectValue placeholder="Escolha um setor..." />
                </SelectTrigger>
                <SelectContent>
                  {SETORES.map((setor) => (
                    <SelectItem key={setor} value={setor}>
                      {setor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Informações do Inventário */}
            <div className="bg-[#F4DDAE] p-4 rounded-lg border border-[#C9B07A]">
              <h3 className="font-semibold text-[#000000] mb-2">Informações:</h3>
              <div className="space-y-1 text-sm text-[#5F6B6D]">
                <p>
                  <strong>Loja:</strong> {usuario.loja_nome}
                </p>
                <p>
                  <strong>Data:</strong> {new Date().toLocaleDateString("pt-BR")}
                </p>
                <p>
                  <strong>Hora:</strong>{" "}
                  {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p>
                  <strong>Usuário:</strong> {usuario.nome}
                </p>
              </div>
            </div>

            {/* Botão Criar */}
            <Button
              onClick={criarInventario}
              disabled={!setorSelecionado || carregando}
              className="w-full h-12 bg-[#fabd07] hover:bg-[#b58821] text-white font-semibold rounded-xl"
            >
              {carregando ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </div>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Criar Inventário
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Dicas */}
        <Card className="border border-[#DFBFBF] bg-white/80">
          <CardContent className="p-4">
            <h3 className="font-semibold text-[#000000] mb-2">💡 Dicas:</h3>
            <ul className="text-sm text-[#5F6B6D] space-y-1">
              <li>• Escolha o setor onde será realizada a contagem</li>
              <li>• Após criar, você poderá adicionar os produtos</li>
              <li>• Todos os produtos estão disponíveis em todos os setores</li>
              <li>
                • Este inventário será criado para a loja: <strong>{usuario.loja_nome}</strong>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
