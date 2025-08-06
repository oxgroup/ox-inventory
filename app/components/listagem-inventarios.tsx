"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trash2, Calendar, MapPin, Package, Eye, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { inventarioService } from "../lib/supabase"

interface ListagemInventariosProps {
  usuario: any
  onVoltar: () => void
  onEditarInventario: (inventario: any) => void
  onAdicionarItens: (inventario: any) => void
}

export function ListagemInventarios({
  usuario,
  onVoltar,
  onEditarInventario,
  onAdicionarItens,
}: ListagemInventariosProps) {
  const [inventarios, setInventarios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [inventariosAgrupados, setInventariosAgrupados] = useState<any>({})
  const [dialogExcluir, setDialogExcluir] = useState(false)
  const [inventarioParaExcluir, setInventarioParaExcluir] = useState<any>(null)

  useEffect(() => {
    carregarInventarios()
  }, [])

  const carregarInventarios = async () => {
    try {
      setCarregando(true)
      const dados = await inventarioService.listar(usuario.loja_id)

      // Calcular total de itens para cada inventário
      const inventariosComTotais = dados.map((inv) => ({
        ...inv,
        total_itens: inv.itens_inventario?.length || 0,
      }))

      setInventarios(inventariosComTotais)
    } catch (error) {
      console.error("Erro ao carregar inventários:", error)
      alert("Erro ao carregar inventários. Verifique sua conexão.")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    // Agrupar inventários por data
    const agrupados = inventarios.reduce((acc, inventario) => {
      const data = new Date(inventario.data_criacao).toLocaleDateString("pt-BR")
      if (!acc[data]) {
        acc[data] = []
      }
      acc[data].push(inventario)
      return acc
    }, {} as any)

    // Ordenar por data (mais recente primeiro)
    const datasOrdenadas = Object.keys(agrupados).sort((a, b) => {
      const dataA = new Date(a.split("/").reverse().join("-"))
      const dataB = new Date(b.split("/").reverse().join("-"))
      return dataB.getTime() - dataA.getTime()
    })

    const agrupadosOrdenados = {}
    datasOrdenadas.forEach((data) => {
      agrupadosOrdenados[data] = agrupados[data].sort(
        (a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime(),
      )
    })

    setInventariosAgrupados(agrupadosOrdenados)
  }, [inventarios])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "conciliado":
        return "bg-[#8B8C7E] text-white"
      case "finalizado":
        return "bg-[#4AC5BB] text-white"
      case "em_contagem":
        return "bg-[#F4D25A] text-[#000000]"
      default:
        return "bg-[#DFBFBF] text-[#000000]"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "conciliado":
        return "Conciliado"
      case "finalizado":
        return "Finalizado"
      case "em_contagem":
        return "Em Contagem"
      default:
        return "Rascunho"
    }
  }

  const confirmarExclusao = (inventario: any) => {
    setInventarioParaExcluir(inventario)
    setDialogExcluir(true)
  }

  const excluirInventario = async () => {
    if (inventarioParaExcluir) {
      try {
        await inventarioService.excluir(inventarioParaExcluir.id)
        setInventarios(inventarios.filter((inv) => inv.id !== inventarioParaExcluir.id))
        setDialogExcluir(false)
        setInventarioParaExcluir(null)
      } catch (error) {
        console.error("Erro ao excluir inventário:", error)
        alert("Erro ao excluir inventário. Tente novamente.")
      }
    }
  }

  const podeEditar = (inventario: any) => {
    return inventario.status !== "conciliado" && usuario?.permissoes?.includes("editar")
  }

  const podeExcluir = (inventario: any) => {
    return inventario.status === "em_contagem" && usuario?.permissoes?.includes("excluir")
  }

  // Nova função para verificar se pode adicionar itens
  const podeAdicionarItens = (inventario: any) => {
    return (
      (inventario.status === "em_contagem" || inventario.status === "finalizado") &&
      usuario?.permissoes?.includes("criar")
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      {carregando && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fabd07]"></div>
        </div>
      )}
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <Button variant="ghost" onClick={onVoltar} className="text-[#000000] hover:bg-white/20">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold text-[#000000]">Inventários</h1>
          <div className="w-20"></div>
        </div>

        {/* Estatísticas */}
        <Card className="border-2 border-[#fabd07]">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[#fabd07]">{inventarios.length}</div>
                <div className="text-xs text-[#5F6B6D]">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#4AC5BB]">
                  {inventarios.filter((inv) => inv.status === "finalizado").length}
                </div>
                <div className="text-xs text-[#5F6B6D]">Finalizados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#8B8C7E]">
                  {inventarios.filter((inv) => inv.status === "conciliado").length}
                </div>
                <div className="text-xs text-[#5F6B6D]">Conciliados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Inventários Agrupados */}
        <div className="space-y-4">
          {Object.entries(inventariosAgrupados).map(([data, inventariosDaData]: [string, any]) => (
            <div key={data}>
              {/* Cabeçalho da Data */}
              <div className="flex items-center mb-3">
                <Calendar className="w-4 h-4 text-[#5F6B6D] mr-2" />
                <h2 className="font-semibold text-[#000000]">{data}</h2>
                <div className="flex-1 h-px bg-[#C9B07A] ml-3"></div>
              </div>

              {/* Inventários da Data */}
              <div className="space-y-3">
                {inventariosDaData.map((inventario: any) => (
                  <Card key={inventario.id} className="border border-[#C9B07A] shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <MapPin className="w-4 h-4 text-[#5F6B6D] mr-1" />
                            <span className="font-semibold text-[#000000] text-sm">{inventario.setor}</span>
                          </div>
                          <div className="flex items-center text-xs text-[#5F6B6D] mb-2">
                            <Package className="w-3 h-3 mr-1" />
                            {inventario.total_itens} itens contados
                          </div>
                          <div className="text-xs text-[#8B8C7E]">
                            {new Date(inventario.data_criacao).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            - {inventario.usuario_nome}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(inventario.status)} text-xs`}>
                          {getStatusText(inventario.status)}
                        </Badge>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 pt-3 border-t border-[#DFBFBF]">
                        <Button
                          size="sm"
                          onClick={() => onEditarInventario(inventario)}
                          className="flex-1 bg-[#3599B8] hover:bg-[#4AC5BB] text-white h-8 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver Mais
                        </Button>

                        {/* Botão Adicionar Itens - aparece para inventários em contagem e finalizados */}
                        {podeAdicionarItens(inventario) && (
                          <Button
                            size="sm"
                            onClick={() => onAdicionarItens(inventario)}
                            className="flex-1 bg-[#fabd07] hover:bg-[#b58821] text-white h-8 text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Adicionar
                          </Button>
                        )}

                        {podeExcluir(inventario) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => confirmarExclusao(inventario)}
                            className="flex-1 border-[#FB8281] text-[#FB8281] hover:bg-[#FB8281]/10 h-8 text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Excluir
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mensagem quando não há inventários */}
        {inventarios.length === 0 && (
          <Card className="border border-[#DFBFBF]">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-[#8B8C7E] mx-auto mb-4" />
              <h3 className="font-semibold text-[#000000] mb-2">Nenhum inventário encontrado</h3>
              <p className="text-[#5F6B6D] text-sm">Crie seu primeiro inventário para começar a contagem.</p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={dialogExcluir} onOpenChange={setDialogExcluir}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-[#FB8281]">Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-[#000000]">
                Tem certeza que deseja excluir o inventário do setor <strong>{inventarioParaExcluir?.setor}</strong>?
              </p>
              <div className="bg-[#FB8281]/10 p-3 rounded-lg">
                <p className="text-sm text-[#FB8281]">
                  ⚠️ Esta ação não pode ser desfeita. Todos os dados serão perdidos permanentemente.
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col space-y-2">
              <Button onClick={excluirInventario} className="w-full bg-[#FB8281] hover:bg-[#FB8281]/80 text-white">
                Sim, Excluir
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogExcluir(false)}
                className="w-full border-[#C9B07A] text-[#000000] hover:bg-[#F4DDAE]"
              >
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
