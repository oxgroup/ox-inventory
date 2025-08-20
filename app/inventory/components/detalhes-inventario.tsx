"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Edit, Check, X, Package, CheckCircle, Download, Search, Filter } from "lucide-react"
import { itemInventarioService, inventarioService } from "../../shared/lib/supabase"
import { exportService } from "../../shared/lib/export-service"

// Mapeamento de categorias para subgrupos
const SUBGRUPOS = {
  Carnes: "Bovinos",
  Peixes: "Pescados",
  "Frutos do Mar": "Pescados",
  Legumes: "Hortifruti",
  Verduras: "Hortifruti",
  Óleos: "Condimentos",
  Temperos: "Condimentos",
  Condimentos: "Condimentos",
  Laticínios: "Laticínios",
  Vinhos: "Destilados",
  Espumantes: "Destilados",
  Cervejas: "Destilados",
  Destilados: "Destilados",
  Bebidas: "Soft Drinks",
  Sucos: "Soft Drinks",
  Refrigerantes: "Soft Drinks",
  Limpeza: "Limpeza",
  Grãos: "Secos",
  Massas: "Secos",
  Farinhas: "Secos",
  Açúcares: "Secos",
}

interface DetalhesInventarioProps {
  inventario: any
  usuario: any
  onVoltar: () => void
  onInventarioAtualizado?: (inventario: any) => void
}

export function DetalhesInventario({ inventario, usuario, onVoltar, onInventarioAtualizado }: DetalhesInventarioProps) {
  const [itens, setItens] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [itensAgrupados, setItensAgrupados] = useState<any>({})
  const [itemEditando, setItemEditando] = useState<any>(null)
  const [dialogEdicao, setDialogEdicao] = useState(false)
  const [dialogConciliar, setDialogConciliar] = useState(false)
  const [quantidadeFechada, setQuantidadeFechada] = useState("")
  const [exportando, setExportando] = useState(false)
  const [filtroTexto, setFiltroTexto] = useState("")
  const [itensFiltrados, setItensFiltrados] = useState<any[]>([])

  useEffect(() => {
    if (inventario?.id) {
      carregarItens()
    }
  }, [inventario?.id])

  const carregarItens = async () => {
    try {
      setCarregando(true)
      const itensCarregados = await itemInventarioService.listarPorInventario(inventario.id)
      setItens(itensCarregados || [])
    } catch (error) {
      console.error("Erro ao carregar itens:", error)
      alert("Erro ao carregar itens do inventário.")
    } finally {
      setCarregando(false)
    }
  }

  // Effect para aplicar filtro
  useEffect(() => {
    if (!filtroTexto.trim()) {
      setItensFiltrados(itens)
    } else {
      const filtroLower = filtroTexto.toLowerCase()
      const filtrados = itens.filter(item => 
        item.produto_nome.toLowerCase().includes(filtroLower) ||
        item.produto_categoria?.toLowerCase().includes(filtroLower) ||
        item.produto_cod_item?.toLowerCase().includes(filtroLower) ||
        item.observacoes?.toLowerCase().includes(filtroLower)
      )
      setItensFiltrados(filtrados)
    }
  }, [itens, filtroTexto])

  useEffect(() => {
    // Agrupar itens filtrados por subgrupo baseado na categoria do produto
    const agrupados = itensFiltrados.reduce((acc, item) => {
      // Usar a categoria do produto ou uma categoria padrão
      const categoria = item.produto_categoria || "Outros"
      const subgrupo = SUBGRUPOS[categoria] || "Outros"

      if (!acc[subgrupo]) {
        acc[subgrupo] = []
      }
      acc[subgrupo].push(item)
      return acc
    }, {} as any)

    // Ordenar subgrupos alfabeticamente e itens dentro de cada subgrupo
    const subgruposOrdenados = {}
    Object.keys(agrupados)
      .sort()
      .forEach((subgrupo) => {
        subgruposOrdenados[subgrupo] = agrupados[subgrupo].sort((a, b) => a.produto_nome.localeCompare(b.produto_nome))
      })

    setItensAgrupados(subgruposOrdenados)
  }, [itensFiltrados])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "em_contagem":
        return "bg-[#F4D25A] text-[#000000]"
      case "finalizado":
        return "bg-[#4AC5BB] text-white"
      case "conciliado":
        return "bg-[#8B8C7E] text-white"
      default:
        return "bg-[#DFBFBF] text-[#000000]"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "em_contagem":
        return "Em Contagem"
      case "finalizado":
        return "Finalizado"
      case "conciliado":
        return "Conciliado"
      default:
        return "Rascunho"
    }
  }

  const podeEditar = () => {
    if (inventario?.status === "conciliado") return false
    return usuario?.permissoes?.includes("editar")
  }

  const podeConciliar = () => {
    // Pode conciliar se:
    // 1. Status é "finalizado"
    // 2. Usuário tem permissão de "excluir" (admin) OU "editar"
    return (
      inventario?.status === "finalizado" &&
      (usuario?.permissoes?.includes("excluir") || usuario?.permissoes?.includes("editar"))
    )
  }

  const abrirDialogEdicao = (item: any) => {
    if (inventario?.status !== "em_contagem" || !usuario?.permissoes?.includes("editar")) {
      return
    }
    setItemEditando(item)
    setQuantidadeFechada(item.quantidade_fechada.toString())
    setDialogEdicao(true)
  }

  const excluirItem = async (item: any) => {
    if (!confirm(`Tem certeza que deseja excluir "${item.produto_nome}"?`)) {
      return
    }

    try {
      await itemInventarioService.excluir(item.id)
      const itensAtualizados = itens.filter(i => i.id !== item.id)
      setItens(itensAtualizados)
    } catch (error) {
      console.error('Erro ao excluir item:', error)
      alert('Erro ao excluir item. Tente novamente.')
    }
  }

  const salvarEdicao = async () => {
    if (!itemEditando) return

    const qtdFechada = Number.parseFloat(quantidadeFechada) || 0

    if (qtdFechada === 0) {
      alert("Por favor, informe a quantidade")
      return
    }

    try {
      const updates = {
        quantidade_fechada: qtdFechada,
        quantidade_em_uso: itemEditando.quantidade_em_uso, // Mantém valor atual
      }

      await itemInventarioService.atualizar(itemEditando.id, updates)

      const itensAtualizados = itens.map((item) => {
        if (item.id === itemEditando.id) {
          return { ...item, ...updates }
        }
        return item
      })

      setItens(itensAtualizados)
      setDialogEdicao(false)
      setItemEditando(null)
    } catch (error) {
      console.error("Erro ao salvar edição:", error)
      alert("Erro ao salvar alterações. Tente novamente.")
    }
  }

  const abrirDialogConciliar = () => {
    setDialogConciliar(true)
  }

  const conciliarInventario = async () => {
    try {
      await inventarioService.atualizar(inventario.id, { status: "conciliado" })

      const inventarioAtualizado = { ...inventario, status: "conciliado" }
      onInventarioAtualizado?.(inventarioAtualizado)

      setDialogConciliar(false)
      alert("Inventário conciliado com sucesso!")
    } catch (error) {
      console.error("Erro ao conciliar inventário:", error)
      alert("Erro ao conciliar inventário. Tente novamente.")
    }
  }

  const exportarContagem = async () => {
    try {
      setExportando(true)
      await exportService.exportarContagem(inventario.id, inventario.setor)
      // Sucesso silencioso - o arquivo será baixado automaticamente
    } catch (error) {
      console.error("Erro ao exportar contagem:", error)
      alert("Erro ao exportar contagem. Verifique se há itens no inventário e tente novamente.")
    } finally {
      setExportando(false)
    }
  }

  const calcularTotais = () => {
    return itensFiltrados.reduce(
      (acc, item) => {
        acc.totalFechada += item.quantidade_fechada
        acc.totalEmUso += item.quantidade_em_uso
        acc.totalItens += 1
        return acc
      },
      { totalFechada: 0, totalEmUso: 0, totalItens: 0 },
    )
  }

  const calcularTotaisGerais = () => {
    return itens.reduce(
      (acc, item) => {
        acc.totalFechada += item.quantidade_fechada
        acc.totalEmUso += item.quantidade_em_uso
        acc.totalItens += 1
        return acc
      },
      { totalFechada: 0, totalEmUso: 0, totalItens: 0 },
    )
  }

  const totais = calcularTotais()
  const totaisGerais = calcularTotaisGerais()

  // Função para obter cor do subgrupo
  const getSubgrupoColor = (subgrupo: string) => {
    switch (subgrupo) {
      case "Bovinos":
        return "bg-[#FB8281] text-white"
      case "Pescados":
        return "bg-[#3599B8] text-white"
      case "Hortifruti":
        return "bg-[#4AC5BB] text-white"
      case "Condimentos":
        return "bg-[#F4D25A] text-[#000000]"
      case "Laticínios":
        return "bg-[#fabd07] text-white"
      case "Destilados":
        return "bg-[#8B8C7E] text-white"
      case "Soft Drinks":
        return "bg-[#C9B07A] text-white"
      case "Limpeza":
        return "bg-[#5F6B6D] text-white"
      case "Secos":
        return "bg-[#DFBFBF] text-[#000000]"
      default:
        return "bg-[#A9C4E5] text-[#000000]"
    }
  }

  // Função para calcular estatísticas por subgrupo
  const calcularEstatisticasPorSubgrupo = () => {
    return Object.entries(itensAgrupados)
      .map(([subgrupo, itensDoSubgrupo]: [string, any]) => {
        const stats = itensDoSubgrupo.reduce(
          (acc, item) => {
            acc.totalFechada += item.quantidade_fechada
            acc.totalEmUso += item.quantidade_em_uso
            acc.totalItens += 1
            return acc
          },
          { totalFechada: 0, totalEmUso: 0, totalItens: 0 },
        )
        return { subgrupo, ...stats }
      })
      .sort((a, b) => b.totalItens - a.totalItens)
  }

  // Função utilitária para agrupar itens por produto_categoria
  function agruparPorCategoria(itens: any[]) {
    return itens.reduce((acc, item) => {
      const categoria = item.produto_categoria || "Sem categoria"
      if (!acc[categoria]) acc[categoria] = []
      acc[categoria].push(item)
      return acc
    }, {} as Record<string, any[]>)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg border-2 border-[#fabd07] p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" onClick={onVoltar} className="text-[#000000] hover:bg-[#fabd07]/10 p-2">
              <ArrowLeft className="w-5 h-5 mr-1" />
              Voltar
            </Button>
            <h1 className="text-lg font-bold text-[#000000]">Detalhes do Inventário</h1>
            <div className="w-16"></div>
          </div>

          {/* Informações do Inventário */}
          <div className="bg-[#F4DDAE] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[#5F6B6D] font-medium text-sm">ID:</span>
                <span className="text-[#000000] ml-1 font-mono text-sm">#{inventario?.id?.slice(-8) || "N/A"}</span>
              </div>
              <Badge className={`${getStatusColor(inventario?.status)} text-xs`}>
                {getStatusText(inventario?.status)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#5F6B6D] font-medium">Setor:</span>
                <span className="text-[#000000] ml-1 font-semibold">{inventario?.setor}</span>
              </div>
              <div>
                <span className="text-[#5F6B6D] font-medium">Usuário:</span>
                <span className="text-[#000000] ml-1">{inventario?.usuario_nome || "Admin"}</span>
              </div>
            </div>

            <div className="text-sm">
              <span className="text-[#5F6B6D] font-medium">Data:</span>
              <span className="text-[#000000] ml-1">
                {inventario?.data_criacao
                  ? new Date(inventario.data_criacao).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Campo de Filtro */}
        <Card className="border-2 border-[#4AC5BB]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#5F6B6D]" />
              <Input
                placeholder="Filtrar produtos (nome, categoria, código, observações...)"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="border-[#3599B8] focus:border-[#fabd07] text-sm"
              />
              {filtroTexto && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltroTexto("")}
                  className="text-[#FB8281] hover:bg-[#FB8281]/10 px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {filtroTexto && (
              <div className="mt-2 text-xs text-[#5F6B6D]">
                📊 Mostrando {itensFiltrados.length} de {itens.length} itens
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo Expandido */}
        <Card className="border-2 border-[#3599B8]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#000000] text-lg flex items-center">
              <Package className="w-5 h-5 mr-2" />
              {filtroTexto ? "Resumo Filtrado" : "Resumo Geral"}
              {filtroTexto && (
                <Filter className="w-4 h-4 ml-2 text-[#4AC5BB]" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Totais Gerais */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[#fabd07]">{totais.totalItens}</div>
                <div className="text-xs text-[#5F6B6D]">Itens</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#4AC5BB]">{totais.totalFechada.toFixed(1)}</div>
                <div className="text-xs text-[#5F6B6D]">Quantidade Total</div>
              </div>
            </div>

            {/* Top 3 Subgrupos */}
            <div className="border-t border-[#DFBFBF] pt-3">
              <h4 className="text-sm font-semibold text-[#000000] mb-2">Principais Categorias:</h4>
              <div className="space-y-2">
                {calcularEstatisticasPorSubgrupo()
                  .slice(0, 3)
                  .map((stat, index) => (
                    <div key={stat.subgrupo} className="flex items-center justify-between text-xs">
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${getSubgrupoColor(stat.subgrupo).split(" ")[0]}`}
                        ></div>
                        <span className="text-[#000000]">{stat.subgrupo}</span>
                      </div>
                      <span className="text-[#5F6B6D] font-medium">{stat.totalItens} itens</span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão Exportar Contagem */}
        {exportService.podeExportar(inventario) && (
          <Card className="border-2 border-[#fabd07]">
            <CardContent className="p-4">
              <Button
                onClick={exportarContagem}
                disabled={exportando}
                className="w-full h-12 bg-[#fabd07] hover:bg-[#b58821] text-white font-semibold rounded-xl"
              >
                {exportando ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exportando...
                  </div>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Exportar Contagem
                  </>
                )}
              </Button>
              <p className="text-xs text-[#5F6B6D] text-center mt-2">
                Gera arquivo TXT com produto_cod_item;quantidade_total
              </p>
            </CardContent>
          </Card>
        )}

        {/* Botão Conciliar Inventário */}
        {podeConciliar() && (
          <Card className="border-2 border-[#8B8C7E]">
            <CardContent className="p-4">
              <Button
                onClick={abrirDialogConciliar}
                className="w-full h-12 bg-[#8B8C7E] hover:bg-[#5F6B6D] text-white font-semibold rounded-xl"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Conciliar Inventário
              </Button>
              <p className="text-xs text-[#5F6B6D] text-center mt-2">
                Após conciliar, não será mais possível fazer alterações
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lista de Itens Agrupados */}
        <div className="space-y-4">
          {itensFiltrados.length === 0 && !carregando ? (
            <Card className="border-2 border-[#C9B07A] shadow-lg">
              <CardContent className="p-8 text-center">
                <Package className="w-16 h-16 text-[#C9B07A] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#5F6B6D] mb-2">
                  {filtroTexto ? "Nenhum item encontrado" : "Nenhum item no inventário"}
                </h3>
                <p className="text-[#8B8C7E]">
                  {filtroTexto 
                    ? "Tente ajustar o filtro ou limpar a busca para ver todos os itens."
                    : "Este inventário ainda não possui itens adicionados."
                  }
                </p>
                {filtroTexto && (
                  <Button
                    onClick={() => setFiltroTexto("")}
                    className="mt-4 bg-[#4AC5BB] hover:bg-[#3599B8] text-white"
                  >
                    Limpar Filtro
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            Object.entries(agruparPorCategoria(itensFiltrados)).map(([categoria, itensDoGrupo]: [string, any[]]) => (
            <Card key={categoria} className="border border-[#C9B07A] shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#000000] text-lg flex items-center">
                    {categoria}
                  </CardTitle>
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-[#F4DDAE]">
                    {itensDoGrupo.length} {itensDoGrupo.length === 1 ? "item" : "itens"}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {itensDoGrupo.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-lg border border-[#DFBFBF] hover:border-[#C9B07A] transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div 
                        className="flex-1 cursor-pointer" 
                        onClick={() => abrirDialogEdicao(item)}
                        title="Clique para editar a quantidade"
                      >
                        <div className="font-semibold text-[#000000] text-sm flex items-center justify-between">
                          <span>{item.produto_nome}</span>
                          {item.produto_cod_item && (
                            <span className="bg-[#8B8C7E] text-white px-2 py-1 rounded text-xs font-mono ml-2">
                              {item.produto_cod_item}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#5F6B6D] mt-1">
                          Quantidade: {item.quantidade_fechada} {item.produto_unidade}
                        </div>
                        {item.observacoes && (
                          <div className="text-xs text-[#5F6B6D] mt-1 italic">
                            💬 {item.observacoes}
                          </div>
                        )}
                      </div>
                      
                      {/* Botão de excluir */}
                      {inventario?.status === "em_contagem" && usuario?.permissoes?.includes("editar") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            excluirItem(item)
                          }}
                          className="text-[#FB8281] hover:bg-[#FB8281]/10 h-8 w-8 p-0"
                          title="Excluir item"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
          )}
        </div>

        {/* Aviso quando conciliado */}
        {inventario?.status === "conciliado" && (
          <Card className="border border-[#8B8C7E] bg-[#8B8C7E]/10">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-[#8B8C7E] mx-auto mb-2" />
              <h3 className="font-semibold text-[#000000] mb-1">Inventário Conciliado</h3>
              <p className="text-[#5F6B6D] text-sm">Este inventário foi conciliado e não pode mais ser alterado.</p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Edição */}
        <Dialog open={dialogEdicao} onOpenChange={setDialogEdicao}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-[#000000]">Editar Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-[#F4DDAE] p-3 rounded-lg">
                <div className="font-semibold text-[#000000] flex items-center justify-between">
                  <span>{itemEditando?.produto_nome}</span>
                  {itemEditando?.produto_cod_item && (
                    <span className="bg-[#8B8C7E] text-white px-2 py-1 rounded text-xs font-mono">
                      {itemEditando?.produto_cod_item}
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#5F6B6D]">{itemEditando?.produto_categoria}</div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#000000] block mb-1">Quantidade</label>
                <Input
                  type="number"
                  step="0.01"
                  value={quantidadeFechada}
                  onChange={(e) => setQuantidadeFechada(e.target.value)}
                  className="h-10 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                  placeholder="0.00"
                />
                <div className="text-xs text-[#5F6B6D] mt-1">{itemEditando?.produto_unidade}</div>
              </div>
            </div>
            <DialogFooter className="flex-col space-y-2">
              <Button onClick={salvarEdicao} className="w-full bg-[#4AC5BB] hover:bg-[#3599B8] text-white">
                <Check className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogEdicao(false)}
                className="w-full border-[#C9B07A] text-[#000000] hover:bg-[#F4DDAE]"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Conciliação */}
        <Dialog open={dialogConciliar} onOpenChange={setDialogConciliar}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-[#8B8C7E]">
                <CheckCircle className="w-5 h-5 mr-2" />
                Conciliar Inventário
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-[#000000]">
                Deseja conciliar este inventário do setor <strong>{inventario?.setor}</strong>?
              </p>

              <div className="bg-[#F4DDAE] p-3 rounded-lg text-sm space-y-1">
                <div className="text-[#000000]">
                  <strong>Total de itens:</strong> {totaisGerais.totalItens}
                </div>
                <div className="text-[#000000]">
                  <strong>Quantidade fechada:</strong> {totaisGerais.totalFechada.toFixed(1)}
                </div>
                <div className="text-[#000000]">
                  <strong>Quantidade em uso:</strong> {totaisGerais.totalEmUso.toFixed(1)}
                </div>
              </div>

              <div className="bg-[#8B8C7E]/10 p-3 rounded-lg">
                <p className="text-sm text-[#8B8C7E]">
                  ⚠️ Após conciliar, este inventário não poderá mais ser alterado. Esta ação é irreversível.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col space-y-2">
              <Button onClick={conciliarInventario} className="w-full bg-[#8B8C7E] hover:bg-[#5F6B6D] text-white">
                <CheckCircle className="w-4 h-4 mr-2" />
                Sim, Conciliar
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogConciliar(false)}
                className="w-full border-[#C9B07A] text-[#000000] hover:bg-[#F4DDAE]"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
