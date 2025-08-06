"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Search, Package, AlertTriangle, Check, Info } from "lucide-react"
import { itemInventarioService, inventarioService, produtoService } from "../lib/supabase"

interface AdicionarItensProps {
  inventario: any
  usuario: any
  onVoltar: () => void
}

export function AdicionarItens({ inventario, usuario, onVoltar }: AdicionarItensProps) {
  const [produtos, setProdutos] = useState<any[]>([])
  const [produtosFiltrados, setProdutosFiltrados] = useState<any[]>([])
  const [busca, setBusca] = useState("")
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null)
  const [quantidadeFechada, setQuantidadeFechada] = useState("")
  const [quantidadeEmUso, setQuantidadeEmUso] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [itensInventario, setItensInventario] = useState<any[]>([])
  const [dialogDuplicata, setDialogDuplicata] = useState(false)
  const [itemDuplicado, setItemDuplicado] = useState<any>(null)
  const [dadosOffline, setDadosOffline] = useState<any>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [carregandoProdutos, setCarregandoProdutos] = useState(false)
  
  // Ref para auto-foco no campo de busca
  const buscaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Carregar produtos
    carregarProdutos()

    // Carregar itens do inventário se existir
    if (inventario?.id) {
      carregarItensInventario()
    }

    // Verificar status da conexão
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Carregar dados offline se existirem
    const dadosSalvos = localStorage.getItem(`inventario_${inventario?.id}`)
    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos)
      setDadosOffline(dados)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [inventario?.id])

  const carregarProdutos = async () => {
    try {
      const produtosCarregados = await produtoService.listar()
      setProdutos(produtosCarregados)
      setProdutosFiltrados(produtosCarregados)
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      // Fallback para produtos mock se houver erro
      const PRODUTOS_MOCK = [
        {
          id: "1",
          nome: "Carne Bovina - Alcatra",
          categoria: "Carnes",
          unidade: "kg",
          cod_item: "CARNE001",
          loja_id: "mock",
        },
        { id: "2", nome: "Frango - Peito", categoria: "Carnes", unidade: "kg", cod_item: "FRANGO001", loja_id: "mock" },
        { id: "3", nome: "Salmão - Filé", categoria: "Peixes", unidade: "kg", cod_item: "PEIXE001", loja_id: "mock" },
        { id: "4", nome: "Batata Inglesa", categoria: "Legumes", unidade: "kg", cod_item: "LEG001", loja_id: "mock" },
        { id: "5", nome: "Cebola Roxa", categoria: "Legumes", unidade: "kg", cod_item: "LEG003", loja_id: "mock" },
        {
          id: "6",
          nome: "Azeite Extra Virgem",
          categoria: "Óleos",
          unidade: "litro",
          cod_item: "OLEO001",
          loja_id: "mock",
        },
        { id: "7", nome: "Sal Grosso", categoria: "Temperos", unidade: "kg", cod_item: "TEMP001", loja_id: "mock" },
        {
          id: "8",
          nome: "Vinho Tinto Reserva",
          categoria: "Bebidas",
          unidade: "garrafa",
          cod_item: "VINHO001",
          loja_id: "mock",
        },
        {
          id: "9",
          nome: "Cerveja Artesanal IPA",
          categoria: "Bebidas",
          unidade: "garrafa",
          cod_item: "CERV001",
          loja_id: "mock",
        },
        {
          id: "10",
          nome: "Detergente Neutro",
          categoria: "Limpeza",
          unidade: "litro",
          cod_item: "LIMP001",
          loja_id: "mock",
        },
      ]
      setProdutos(PRODUTOS_MOCK)
      setProdutosFiltrados(PRODUTOS_MOCK)
    }
  }

  const carregarItensInventario = async () => {
    try {
      const itens = await itemInventarioService.listarPorInventario(inventario.id)
      setItensInventario(itens || [])
    } catch (error) {
      console.error("Erro ao carregar itens:", error)
    }
  }

  useEffect(() => {
    // Filtrar produtos baseado na busca
    if (busca.trim()) {
      setCarregandoProdutos(true)
      const timer = setTimeout(async () => {
        try {
          const filtrados = produtos.filter(
            (produto) =>
              produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
              produto.categoria.toLowerCase().includes(busca.toLowerCase()) ||
              produto.cod_item?.toLowerCase().includes(busca.toLowerCase()),
          )
          setProdutosFiltrados(filtrados)
        } catch (error) {
          // Fallback para busca local
          const filtrados = produtos.filter(
            (produto) =>
              produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
              produto.categoria.toLowerCase().includes(busca.toLowerCase()) ||
              produto.cod_item?.toLowerCase().includes(busca.toLowerCase()),
          )
          setProdutosFiltrados(filtrados)
        } finally {
          setCarregandoProdutos(false)
        }
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setProdutosFiltrados(produtos)
    }
  }, [busca, produtos])

  // Salvar dados offline sempre que itens mudarem
  useEffect(() => {
    if (inventario?.id && itensInventario.length > 0) {
      const dadosParaSalvar = {
        inventario_id: inventario.id,
        itens: itensInventario,
        ultima_atualizacao: new Date().toISOString(),
      }
      localStorage.setItem(`inventario_${inventario.id}`, JSON.stringify(dadosParaSalvar))
    }
  }, [itensInventario, inventario?.id])

  // Função corrigida para verificar duplicatas
  const verificarDuplicata = (produtoId: string) => {
    return itensInventario.find((item) => item.produto_id === produtoId)
  }

  // Função corrigida para contar duplicatas
  const contarDuplicatas = (produtoId: string) => {
    return itensInventario.filter((item) => item.produto_id === produtoId).length
  }

  const adicionarItem = () => {
    if (!produtoSelecionado) {
      alert("Por favor, selecione um produto")
      return
    }

    // Validar se pelo menos uma quantidade foi informada
    const qtdFechada = Number.parseFloat(quantidadeFechada) || 0
    const qtdEmUso = Number.parseFloat(quantidadeEmUso) || 0

    if (qtdFechada === 0 && qtdEmUso === 0) {
      alert("Por favor, informe pelo menos uma quantidade (fechada ou em uso)")
      return
    }

    // Verificar se já existe este produto
    const itemExistente = verificarDuplicata(produtoSelecionado.id)
    const totalDuplicatas = contarDuplicatas(produtoSelecionado.id)

    console.log("Verificando duplicata:", {
      produtoId: produtoSelecionado.id,
      produtoNome: produtoSelecionado.nome,
      itemExistente: !!itemExistente,
      totalDuplicatas,
      itensInventario: itensInventario.length,
    })

    if (itemExistente) {
      console.log("Item duplicado encontrado, mostrando dialog")
      setItemDuplicado({
        produto: produtoSelecionado,
        quantidadeFechada: qtdFechada,
        quantidadeEmUso: qtdEmUso,
        duplicataExistente: itemExistente,
        totalDuplicatas: totalDuplicatas,
      })
      setDialogDuplicata(true)
      return
    }

    // Se não há duplicata, inserir diretamente
    inserirItem()
  }

  const inserirItem = async (acao?: "adicionar" | "somar") => {
    const qtdFechada = Number.parseFloat(quantidadeFechada) || 0
    const qtdEmUso = Number.parseFloat(quantidadeEmUso) || 0

    try {
      if (acao === "somar" && itemDuplicado) {
        // Atualizar item existente
        const itemExistente = itemDuplicado.duplicataExistente
        const novasQuantidades = {
          quantidade_fechada: itemExistente.quantidade_fechada + qtdFechada,
          quantidade_em_uso: itemExistente.quantidade_em_uso + qtdEmUso,
        }

        await itemInventarioService.atualizar(itemExistente.id, novasQuantidades)

        // Atualizar estado local
        const itensAtualizados = itensInventario.map((item) => {
          if (item.id === itemExistente.id) {
            return { ...item, ...novasQuantidades }
          }
          return item
        })
        setItensInventario(itensAtualizados)
      } else {
        // Criar novo item
        const novoItem = {
          inventario_id: inventario.id,
          produto_id: produtoSelecionado.id,
          produto_nome: produtoSelecionado.nome,
          produto_unidade: produtoSelecionado.unidade,
          produto_categoria: produtoSelecionado.categoria,
          produto_cod_item: produtoSelecionado.cod_item,
          quantidade_fechada: qtdFechada,
          quantidade_em_uso: qtdEmUso,
          observacoes: observacoes.trim() || null,
        }

        const itemCriado = await itemInventarioService.adicionar(novoItem)
        setItensInventario([...itensInventario, itemCriado])
      }

      // Limpar formulário
      setProdutoSelecionado(null)
      setQuantidadeFechada("")
      setQuantidadeEmUso("")
      setObservacoes("")
      setBusca("")
      setDialogDuplicata(false)
      setItemDuplicado(null)
      
      // Auto-foco no campo de busca para agilizar próxima inserção
      setTimeout(() => {
        buscaInputRef.current?.focus()
      }, 100)
    } catch (error) {
      console.error("Erro ao salvar item:", error)
      alert("Erro ao salvar item. Verifique sua conexão e tente novamente.")
    }
  }

  const removerItem = async (itemId: string) => {
    const confirmar = confirm("Deseja realmente remover este item?")
    if (!confirmar) return

    try {
      await itemInventarioService.excluir(itemId)
      setItensInventario(itensInventario.filter((item) => item.id !== itemId))
    } catch (error) {
      console.error("Erro ao remover item:", error)
      alert("Erro ao remover item. Tente novamente.")
    }
  }

  const finalizarInventario = async () => {
    if (itensInventario.length === 0) {
      alert("Adicione pelo menos um item antes de finalizar o inventário")
      return
    }

    const confirmar = confirm(
      "Deseja finalizar este inventário? Após finalizar, você ainda poderá adicionar novos itens, mas não poderá excluir o inventário.",
    )

    if (confirmar) {
      try {
        await inventarioService.atualizar(inventario.id, { status: "finalizado" })

        // Limpar dados offline
        localStorage.removeItem(`inventario_${inventario.id}`)

        alert("Inventário finalizado com sucesso!")
        onVoltar()
      } catch (error) {
        console.error("Erro ao finalizar inventário:", error)
        alert("Erro ao finalizar inventário. Tente novamente.")
      }
    }
  }

  // Verificar se pode finalizar (apenas se status for "em_contagem")
  const podeFinalizar = () => {
    return inventario?.status === "em_contagem"
  }

  // Verificar se é um inventário já finalizado
  const isInventarioFinalizado = () => {
    return inventario?.status === "finalizado"
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
        {/* Header com Informações do Inventário */}
        <div className="bg-white rounded-lg border-2 border-[#fabd07] p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" onClick={onVoltar} className="text-[#000000] hover:bg-[#fabd07]/10 p-2">
              <ArrowLeft className="w-5 h-5 mr-1" />
              Voltar
            </Button>
            <h1 className="text-lg font-bold text-[#000000]">
              {isInventarioFinalizado() ? "Adicionar Novos Itens" : "Adicionar Itens"}
            </h1>
            <div className="w-16"></div>
          </div>

          {/* Informações do Inventário */}
          <div className="bg-[#F4DDAE] rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#5F6B6D] font-medium">ID:</span>
                <span className="text-[#000000] ml-1 font-mono">#{inventario?.id?.slice(-8) || "N/A"}</span>
              </div>
              <div>
                <span className="text-[#5F6B6D] font-medium">Usuário:</span>
                <span className="text-[#000000] ml-1">{usuario?.nome || "Admin"}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="text-[#5F6B6D] font-medium">Setor:</span>
                <span className="text-[#000000] ml-1 font-semibold">{inventario?.setor}</span>
              </div>
              <div>
                <span className="text-[#5F6B6D] font-medium">Status:</span>
                <span className="text-[#000000] ml-1 font-semibold">
                  {inventario?.status === "finalizado" ? "Finalizado" : "Em Contagem"}
                </span>
              </div>
              <div>
                <span className="text-[#5F6B6D] font-medium">Início:</span>
                <span className="text-[#000000] ml-1">
                  {inventario?.data_criacao || inventario?.created_at
                    ? new Date(inventario.data_criacao || inventario.created_at).toLocaleString("pt-BR", {
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
        </div>

        {/* Aviso para inventários finalizados */}
        {isInventarioFinalizado() && (
          <Card className="border border-[#4AC5BB] bg-[#4AC5BB]/10">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Info className="w-5 h-5 text-[#4AC5BB] mr-2" />
                <div>
                  <h3 className="font-semibold text-[#000000] text-sm">Inventário Finalizado</h3>
                  <p className="text-[#5F6B6D] text-xs">
                    Você pode adicionar novos itens que foram encontrados após a finalização.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Busca de Produtos */}
        <Card className="border-2 border-[#fabd07]">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#5F6B6D]" />
              <Input
                ref={buscaInputRef}
                placeholder="Buscar por nome, categoria ou código..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]"
              />
              {carregandoProdutos && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#fabd07]"></div>
                </div>
              )}
            </div>

            {/* Lista de Produtos Filtrados */}
            {busca && (
              <div className="max-h-[32rem] overflow-y-auto space-y-2">
                {produtosFiltrados.map((produto) => (
                  <div
                    key={produto.id}
                    onClick={() => {
                      setProdutoSelecionado(produto)
                      setBusca("")
                    }}
                    className="p-3 bg-white rounded-lg border border-[#C9B07A] cursor-pointer hover:bg-[#F4DDAE] transition-colors"
                  >
                    <div className="font-semibold text-[#000000]">{produto.nome}</div>
                    <div className="text-sm text-[#5F6B6D] flex items-center justify-between">
                      <span>
                        {produto.categoria} - {produto.unidade}
                      </span>
                      {produto.cod_item && (
                        <span className="bg-[#fabd07] text-white px-2 py-1 rounded text-xs font-mono">
                          {produto.cod_item}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {busca && produtosFiltrados.length === 0 && !carregandoProdutos && (
                  <div className="p-3 text-center text-[#5F6B6D]">Nenhum produto encontrado</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Produto Selecionado */}
        {produtoSelecionado && (
          <Card className="border-2 border-[#3599B8]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#000000] text-lg flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Produto Selecionado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#F4DDAE] p-3 rounded-lg">
                <div className="font-semibold text-[#000000]">{produtoSelecionado.nome}</div>
                <div className="text-sm text-[#5F6B6D] flex items-center justify-between">
                  <span>{produtoSelecionado.categoria}</span>
                  {produtoSelecionado.cod_item && (
                    <span className="bg-[#fabd07] text-white px-2 py-1 rounded text-xs font-mono">
                      {produtoSelecionado.cod_item}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-[#000000] block mb-1">Qtd. Fechada *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={quantidadeFechada}
                    onChange={(e) => setQuantidadeFechada(e.target.value)}
                    className="h-10 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                  />
                  <div className="text-xs text-[#5F6B6D] mt-1">{produtoSelecionado.unidade}</div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#000000] block mb-1">Qtd. Em Uso</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={quantidadeEmUso}
                    onChange={(e) => setQuantidadeEmUso(e.target.value)}
                    className="h-10 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                  />
                  <div className="text-xs text-[#5F6B6D] mt-1">{produtoSelecionado.unidade}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#000000] block mb-1">Observações (Opcional)</label>
                <Input
                  placeholder="Comentários sobre o item..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="h-10 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                />
              </div>

              <Button
                onClick={adicionarItem}
                className="w-full h-12 bg-[#fabd07] hover:bg-[#b58821] text-white font-semibold rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Item
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de Itens Adicionados */}
        {itensInventario.length > 0 && (
          <Card className="border-2 border-[#4AC5BB]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#000000] text-lg">Itens Contados ({itensInventario.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(agruparPorCategoria(itensInventario)).map(([categoria, itens]) => (
                <div key={categoria}>
                  <div className="font-semibold text-[#3599B8] text-base mb-2 mt-4">{categoria}</div>
                  <div className="space-y-3">
                    {itens.map((item) => (
                      <div key={item.id} className="bg-white p-3 rounded-lg border border-[#C9B07A]">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-[#000000] text-sm flex items-center justify-between">
                              <span>{item.produto_nome}</span>
                              {item.produto_cod_item && (
                                <span className="bg-[#8B8C7E] text-white px-2 py-1 rounded text-xs font-mono ml-2">
                                  {item.produto_cod_item}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#5F6B6D] mt-1">
                              Fechada: {item.quantidade_fechada} {item.produto_unidade}
                              {item.quantidade_em_uso > 0 && ` | Em uso: ${item.quantidade_em_uso} ${item.produto_unidade}`}
                            </div>
                            {item.observacoes && (
                              <div className="text-xs text-[#5F6B6D] mt-1 italic">
                                💬 {item.observacoes}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerItem(item.id)}
                            className="text-[#FB8281] hover:bg-[#FB8281]/10"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Indicador Offline */}
        {isOffline && (
          <div className="bg-[#FF9100] text-white p-3 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Modo Offline - Dados salvos localmente</span>
          </div>
        )}

        {/* Botão Finalizar Inventário - apenas para inventários em contagem */}
        {podeFinalizar() && itensInventario.length > 0 && (
          <Card className="border-2 border-[#4AC5BB]">
            <CardContent className="p-4">
              <Button
                onClick={finalizarInventario}
                className="w-full h-12 bg-[#4AC5BB] hover:bg-[#3599B8] text-white font-semibold rounded-xl"
              >
                <Check className="w-5 h-5 mr-2" />
                Finalizar Inventário ({itensInventario.length} itens)
              </Button>
              <p className="text-xs text-[#5F6B6D] text-center mt-2">
                Após finalizar, você ainda poderá adicionar novos itens
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Duplicata */}
        <Dialog open={dialogDuplicata} onOpenChange={setDialogDuplicata}>
          <DialogContent className="max-w-lg w-[95vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-[#FF9100] text-lg sm:text-xl">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Item Já Existe</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
                O produto <strong className="break-words">{itemDuplicado?.produto?.nome}</strong> já foi contado{" "}
                <strong>{itemDuplicado?.totalDuplicatas}</strong> vez(es) neste inventário.
              </p>

              <div className="bg-[#F4DDAE] p-3 rounded-lg text-sm space-y-2">
                <div className="text-[#000000]">
                  <div className="flex justify-between items-center">
                    <span><strong>Nova qtd. fechada:</strong></span>
                    <span className="font-medium ml-2">
                      {itemDuplicado?.quantidadeFechada} {itemDuplicado?.produto?.unidade}
                    </span>
                  </div>
                </div>
                <div className="text-[#000000]">
                  <div className="flex justify-between items-center">
                    <span><strong>Nova qtd. em uso:</strong></span>
                    <span className="font-medium ml-2">
                      {itemDuplicado?.quantidadeEmUso} {itemDuplicado?.produto?.unidade}
                    </span>
                  </div>
                </div>
              </div>

              {itemDuplicado?.totalDuplicatas >= 2 ? (
                <div className="bg-[#FB8281]/10 p-3 rounded-lg border border-[#FB8281]/20">
                  <p className="text-sm text-[#FB8281] leading-relaxed">
                    ⚠️ Este produto já possui múltiplas entradas. Deseja adicionar mais uma entrada?
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[#5F6B6D]">O que deseja fazer?</p>
              )}
            </div>

            <DialogFooter className="flex flex-col gap-3 pt-4">
              {itemDuplicado?.totalDuplicatas < 2 && (
                <Button
                  onClick={() => inserirItem("somar")}
                  className="w-full h-12 bg-[#4AC5BB] hover:bg-[#3599B8] text-white font-medium rounded-lg"
                >
                  Somar com Existente
                </Button>
              )}
              <Button
                onClick={() => inserirItem("adicionar")}
                className="w-full h-12 bg-[#fabd07] hover:bg-[#b58821] text-white font-medium rounded-lg"
              >
                {itemDuplicado?.totalDuplicatas >= 2 ? "Sim, Adicionar" : "Adicionar Mesmo Assim"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogDuplicata(false)}
                className="w-full h-12 border-2 border-[#FB8281] text-[#FB8281] hover:bg-[#FB8281]/10 font-medium rounded-lg"
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
