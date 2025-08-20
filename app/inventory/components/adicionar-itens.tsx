"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Search, Package, AlertTriangle, Check, Info, Camera, X } from "lucide-react"
import { itemInventarioService, inventarioService, produtoService } from "../../shared/lib/supabase"
import { barcodeService } from "../lib/barcode"
import { BarcodeScanner } from "./barcode-scanner"

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
  const [observacoes, setObservacoes] = useState("")
  const [itensInventario, setItensInventario] = useState<any[]>([])
  const [dialogDuplicata, setDialogDuplicata] = useState(false)
  const [itemDuplicado, setItemDuplicado] = useState<any>(null)
  const [dialogEdicao, setDialogEdicao] = useState(false)
  const [itemEditando, setItemEditando] = useState<any>(null)
  const [quantidadeEditada, setQuantidadeEditada] = useState("")
  const [observacoesEditadas, setObservacoesEditadas] = useState("")
  const [dadosOffline, setDadosOffline] = useState<any>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [carregandoProdutos, setCarregandoProdutos] = useState(false)
  
  // Estados do scanner de código de barras
  const [scannerAberto, setScannerAberto] = useState(false)
  const [buscandoPorCodigo, setBuscandoPorCodigo] = useState(false)
  
  // Estados para vinculação de código de barras
  const [dialogVinculacao, setDialogVinculacao] = useState(false)
  const [codigoParaVincular, setCodigoParaVincular] = useState("")
  const [produtosParaVinculacao, setProdutosParaVinculacao] = useState<any[]>([])
  const [buscaVinculacao, setBuscaVinculacao] = useState("")
  const [vinculandoCodigo, setVinculandoCodigo] = useState(false)
  
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
      
      // Carregar produtos para cache de código de barras
      await barcodeService.carregarProdutosParaCache()
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

  // Funções utilitárias para detecção de código de barras
  const isCodigoBarras = (texto: string): boolean => {
    return /^\d{13}$/.test(texto.trim())
  }

  const isCodigoBarrasParcial = (texto: string): boolean => {
    return /^\d{8,12}$/.test(texto.trim())
  }

  // Função para buscar produto por código de barras
  const buscarPorCodigoBarras = async (codigoBarras: string) => {
    setBuscandoPorCodigo(true)
    try {
      console.log("Buscando produto por código:", codigoBarras)
      
      const produto = await barcodeService.buscarPorCodigoBarras(codigoBarras)
      
      if (produto) {
        console.log("Produto encontrado:", produto.nome)
        setProdutoSelecionado(produto)
        setBusca("")
        
        // Auto-foco no campo de quantidade fechada
        setTimeout(() => {
          const quantidadeInput = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement
          if (quantidadeInput) {
            quantidadeInput.focus()
          }
        }, 100)
      } else {
        // Abrir modal para vincular código de barras a um produto existente
        setCodigoParaVincular(codigoBarras)
        setProdutosParaVinculacao(produtos)
        setBuscaVinculacao("")
        setDialogVinculacao(true)
      }
    } catch (error: any) {
      console.error("Erro ao buscar por código de barras:", error)
      alert(error.message || "Erro ao buscar produto por código de barras")
    } finally {
      setBuscandoPorCodigo(false)
      setScannerAberto(false)
    }
  }

  // Função para vincular código de barras a um produto
  const vincularCodigoBarras = async (produto: any) => {
    try {
      setVinculandoCodigo(true)
      
      // Atualizar o produto no banco de dados com o código de barras
      await produtoService.atualizar(produto.id, {
        codigo_barras: codigoParaVincular
      })
      
      // Atualizar o produto localmente
      const produtoAtualizado = {
        ...produto,
        codigo_barras: codigoParaVincular
      }
      
      // Atualizar lista de produtos local
      const produtosAtualizados = produtos.map(p => 
        p.id === produto.id ? produtoAtualizado : p
      )
      setProdutos(produtosAtualizados)
      setProdutosFiltrados(produtosAtualizados)
      
      // Selecionar o produto vinculado
      setProdutoSelecionado(produtoAtualizado)
      setBusca("")
      
      // Fechar modal
      setDialogVinculacao(false)
      setCodigoParaVincular("")
      setBuscaVinculacao("")
      
      // Auto-foco no campo de quantidade fechada
      setTimeout(() => {
        const quantidadeInput = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement
        if (quantidadeInput) {
          quantidadeInput.focus()
        }
      }, 100)
      
    } catch (error: any) {
      console.error("Erro ao vincular código de barras:", error)
      alert(error.message || "Erro ao vincular código de barras")
    } finally {
      setVinculandoCodigo(false)
    }
  }

  // Função para filtrar produtos no modal de vinculação
  const filtrarProdutosVinculacao = () => {
    if (!buscaVinculacao.trim()) {
      return produtos.filter(p => !p.codigo_barras) // Mostrar apenas produtos sem código de barras
    }
    
    const buscaLower = buscaVinculacao.toLowerCase()
    return produtos.filter(produto => 
      produto.nome.toLowerCase().includes(buscaLower) ||
      produto.categoria.toLowerCase().includes(buscaLower) ||
      produto.cod_item?.toLowerCase().includes(buscaLower)
    )
  }

  useEffect(() => {
    // Filtrar produtos baseado na busca
    if (busca.trim()) {
      setCarregandoProdutos(true)
      const timer = setTimeout(async () => {
        try {
          const buscaTrim = busca.trim()
          const buscaLower = buscaTrim.toLowerCase()
          
          const filtrados = produtos.filter((produto) => {
            // Se é código de barras completo (13 dígitos), busca exata
            if (isCodigoBarras(buscaTrim)) {
              return produto.codigo_barras === buscaTrim
            }
            
            // Se é código de barras parcial (8-12 dígitos), busca por início
            if (isCodigoBarrasParcial(buscaTrim)) {
              return produto.codigo_barras?.startsWith(buscaTrim)
            }
            
            // Busca tradicional por nome, categoria e cod_item
            return (
              produto.nome.toLowerCase().includes(buscaLower) ||
              produto.categoria.toLowerCase().includes(buscaLower) ||
              produto.cod_item?.toLowerCase().includes(buscaLower)
            )
          })
          
          setProdutosFiltrados(filtrados)
          
          // Auto-seleção para código de barras completo
          if (isCodigoBarras(buscaTrim) && filtrados.length === 1) {
            console.log("Auto-selecionando produto por código de barras:", filtrados[0].nome)
            setProdutoSelecionado(filtrados[0])
            setBusca("")
            
            // Auto-foco no campo de quantidade fechada
            setTimeout(() => {
              const quantidadeInput = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement
              if (quantidadeInput) {
                quantidadeInput.focus()
              }
            }, 100)
          }
        } catch (error) {
          // Fallback para busca local
          const buscaTrim = busca.trim()
          const buscaLower = buscaTrim.toLowerCase()
          
          const filtrados = produtos.filter((produto) => {
            if (isCodigoBarras(buscaTrim)) {
              return produto.codigo_barras === buscaTrim
            }
            if (isCodigoBarrasParcial(buscaTrim)) {
              return produto.codigo_barras?.startsWith(buscaTrim)
            }
            return (
              produto.nome.toLowerCase().includes(buscaLower) ||
              produto.categoria.toLowerCase().includes(buscaLower) ||
              produto.cod_item?.toLowerCase().includes(buscaLower)
            )
          })
          setProdutosFiltrados(filtrados)
          
          // Auto-seleção para código de barras completo no fallback
          if (isCodigoBarras(buscaTrim) && filtrados.length === 1) {
            console.log("Auto-selecionando produto por código de barras (fallback):", filtrados[0].nome)
            setProdutoSelecionado(filtrados[0])
            setBusca("")
            
            setTimeout(() => {
              const quantidadeInput = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement
              if (quantidadeInput) {
                quantidadeInput.focus()
              }
            }, 100)
          }
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
    const qtdEmUso = 0 // Valor padrão, campo removido do frontend

    if (qtdFechada === 0) {
      alert("Por favor, informe a quantidade")
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
      // Buscar todos os itens duplicados do mesmo produto
      const itensDuplicados = itensInventario.filter(item => item.produto_id === produtoSelecionado.id)
      
      setItemDuplicado({
        produto: produtoSelecionado,
        quantidadeFechada: qtdFechada,
        duplicataExistente: itemExistente,
        totalDuplicatas: totalDuplicatas,
        todosItensDuplicados: itensDuplicados,
      })
      setDialogDuplicata(true)
      return
    }

    // Se não há duplicata, inserir diretamente
    inserirItem()
  }

  const inserirItem = async (acao?: "adicionar" | "somar") => {
    const qtdFechada = Number.parseFloat(quantidadeFechada) || 0
    const qtdEmUso = 0 // Valor padrão, campo removido do frontend

    try {
      if (acao === "somar" && itemDuplicado) {
        // Atualizar item existente
        const itemExistente = itemDuplicado.duplicataExistente
        const novasQuantidades = {
          quantidade_fechada: itemExistente.quantidade_fechada + qtdFechada,
          quantidade_em_uso: itemExistente.quantidade_em_uso, // Mantém valor atual
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
          quantidade_em_uso: 0, // Valor padrão
          observacoes: observacoes.trim() || undefined,
          produto_codigo_barras: produtoSelecionado.codigo_barras,
          data_contagem: new Date().toISOString(),
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

  const abrirEdicaoItem = (item: any) => {
    setItemEditando(item)
    setQuantidadeEditada(item.quantidade_fechada.toString())
    setObservacoesEditadas(item.observacoes || "")
    setDialogEdicao(true)
  }

  const salvarEdicaoItem = async () => {
    if (!itemEditando) return

    const qtd = Number.parseFloat(quantidadeEditada) || 0
    if (qtd === 0) {
      alert("Por favor, informe a quantidade")
      return
    }

    try {
      const updates = {
        quantidade_fechada: qtd,
        quantidade_em_uso: itemEditando.quantidade_em_uso, // Mantém valor atual
        observacoes: observacoesEditadas.trim() || undefined,
      }

      await itemInventarioService.atualizar(itemEditando.id, updates)

      // Atualizar estado local
      const itensAtualizados = itensInventario.map((item) => {
        if (item.id === itemEditando.id) {
          return { 
            ...item, 
            quantidade_fechada: qtd,
            observacoes: observacoesEditadas.trim() || undefined,
          }
        }
        return item
      })

      setItensInventario(itensAtualizados)
      setDialogEdicao(false)
      setItemEditando(null)
      setQuantidadeEditada("")
      setObservacoesEditadas("")
    } catch (error) {
      console.error("Erro ao atualizar item:", error)
      alert("Erro ao atualizar item. Tente novamente.")
    }
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-[#5F6B6D]" />
                <Input
                  ref={buscaInputRef}
                  placeholder="Buscar por nome, categoria, código ou código de barras..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                />
                {(carregandoProdutos || buscandoPorCodigo) && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#fabd07]"></div>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => setScannerAberto(true)}
                disabled={buscandoPorCodigo}
                className="h-12 px-4 bg-[#4AC5BB] hover:bg-[#3599B8] text-white flex items-center gap-2"
                title="Escanear código de barras"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Escanear</span>
              </Button>
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

              <div>
                <label className="text-sm font-semibold text-[#000000] block mb-1">Quantidade *</label>
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
                <label className="text-sm font-semibold text-[#000000] block mb-1">Observações (Opcional)</label>
                <Input
                  placeholder="Comentários sobre o item..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="h-10 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setProdutoSelecionado(null)
                    setQuantidadeFechada("")
                    setObservacoes("")
                    // Auto-foco no campo de busca
                    setTimeout(() => {
                      buscaInputRef.current?.focus()
                    }, 100)
                  }}
                  variant="outline"
                  className="flex-1 h-12 border-2 border-[#FB8281] text-[#FB8281] hover:bg-[#FB8281]/10 font-semibold rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={adicionarItem}
                  className="flex-1 h-12 bg-[#fabd07] hover:bg-[#b58821] text-white font-semibold rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Item
                </Button>
              </div>
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
                    {(itens as any[]).map((item) => (
                      <div key={item.id} className="bg-white p-3 rounded-lg border border-[#C9B07A]">
                        <div className="flex justify-between items-start">
                          <div 
                            className="flex-1 cursor-pointer" 
                            onClick={() => abrirEdicaoItem(item)}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removerItem(item.id)
                            }}
                            className="text-[#FB8281] hover:bg-[#FB8281]/10 h-8 w-8 p-0"
                            title="Remover item"
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
          <DialogContent className="max-w-lg w-[95vw] sm:max-w-lg mx-auto max-h-[95vh] overflow-y-auto">
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

              {/* Itens Existentes */}
              <div className="bg-[#E3F2FD] p-3 rounded-lg border border-[#90CAF9]">
                <h4 className="text-sm font-semibold text-[#1976D2] mb-2">📦 Itens já contados:</h4>
                <div className="space-y-2">
                  {itemDuplicado?.todosItensDuplicados?.map((item: any, index: number) => (
                    <div key={item.id} className="bg-white p-2 rounded border">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#5F6B6D]">Entrada #{index + 1}</span>
                        <span className="text-sm font-medium text-[#000000]">
                          {item.quantidade_fechada} {item.produto_unidade}
                        </span>
                      </div>
                      {item.observacoes && (
                        <div className="text-xs text-[#5F6B6D] mt-1 italic">
                          💬 {item.observacoes}
                        </div>
                      )}
                      <div className="text-xs text-[#5F6B6D]">
                        {new Date(item.data_contagem).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-[#90CAF9] flex justify-between items-center">
                  <span className="text-sm font-medium text-[#1976D2]">Total Atual:</span>
                  <span className="text-sm font-bold text-[#1976D2]">
                    {itemDuplicado?.todosItensDuplicados?.reduce((total: number, item: any) => 
                      total + item.quantidade_fechada, 0
                    )} {itemDuplicado?.produto?.unidade}
                  </span>
                </div>
              </div>

              {/* Nova Quantidade */}
              <div className="bg-[#F4DDAE] p-3 rounded-lg text-sm space-y-2">
                <div className="text-[#000000]">
                  <div className="flex justify-between items-center">
                    <span><strong>➕ Nova quantidade:</strong></span>
                    <span className="font-medium ml-2">
                      {itemDuplicado?.quantidadeFechada} {itemDuplicado?.produto?.unidade}
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

        {/* Dialog de Edição de Item */}
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
                  value={quantidadeEditada}
                  onChange={(e) => setQuantidadeEditada(e.target.value)}
                  className="h-10 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                  placeholder="0.00"
                />
                <div className="text-xs text-[#5F6B6D] mt-1">{itemEditando?.produto_unidade}</div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#000000] block mb-1">Observações (Opcional)</label>
                <Input
                  placeholder="Comentários sobre o item..."
                  value={observacoesEditadas}
                  onChange={(e) => setObservacoesEditadas(e.target.value)}
                  className="h-10 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                />
              </div>
            </div>
            <DialogFooter className="flex-col space-y-2">
              <Button onClick={salvarEdicaoItem} className="w-full bg-[#4AC5BB] hover:bg-[#3599B8] text-white">
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

        {/* Dialog de Vinculação de Código de Barras */}
        <Dialog open={dialogVinculacao} onOpenChange={setDialogVinculacao}>
          <DialogContent className="max-w-2xl mx-auto max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-[#000000] flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Vincular Código de Barras
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto space-y-4">
              {/* Informações do código */}
              <div className="bg-[#F4DDAE] p-4 rounded-lg">
                <p className="text-[#5F6B6D] text-sm mb-2">
                  <strong>Código de barras escaneado:</strong>
                </p>
                <p className="text-[#000000] font-mono text-lg bg-white p-2 rounded border">
                  {codigoParaVincular}
                </p>
                <p className="text-[#8B8C7E] text-xs mt-2">
                  Este código não está vinculado a nenhum produto. Selecione um produto abaixo para vincular.
                </p>
              </div>

              {/* Busca de produtos */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#000000]">Buscar Produto</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5F6B6D]" />
                  <Input
                    placeholder="Digite o nome do produto..."
                    value={buscaVinculacao}
                    onChange={(e) => setBuscaVinculacao(e.target.value)}
                    className="pl-10 border-[#3599B8] focus:border-[#fabd07]"
                  />
                </div>
              </div>

              {/* Lista de produtos */}
              <div className="space-y-2 max-h-64 overflow-auto">
                {filtrarProdutosVinculacao().map((produto) => (
                  <div
                    key={produto.id}
                    className="border border-[#C9B07A] rounded-lg p-3 hover:bg-[#F4DDAE]/20 cursor-pointer transition-colors"
                    onClick={() => !vinculandoCodigo && vincularCodigoBarras(produto)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#000000] text-sm">{produto.nome}</h4>
                        <div className="flex items-center gap-3 text-xs text-[#5F6B6D] mt-1">
                          <span>📁 {produto.categoria}</span>
                          <span>📏 {produto.unidade}</span>
                          {produto.cod_item && (
                            <span className="bg-[#8B8C7E] text-white px-2 py-1 rounded font-mono">
                              {produto.cod_item}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#4AC5BB] hover:bg-[#3599B8] text-white"
                        disabled={vinculandoCodigo}
                      >
                        {vinculandoCodigo ? "Vinculando..." : "Vincular"}
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filtrarProdutosVinculacao().length === 0 && (
                  <div className="text-center py-8 text-[#5F6B6D]">
                    <Package className="w-12 h-12 mx-auto mb-2 text-[#C9B07A]" />
                    <p className="text-sm">
                      {buscaVinculacao.trim() ? "Nenhum produto encontrado" : "Nenhum produto sem código de barras"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogVinculacao(false)
                  setCodigoParaVincular("")
                  setBuscaVinculacao("")
                }}
                className="border-[#8B8C7E] text-[#8B8C7E] hover:bg-[#8B8C7E]/10"
                disabled={vinculandoCodigo}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Scanner de Código de Barras */}
        <BarcodeScanner
          isOpen={scannerAberto}
          onClose={() => setScannerAberto(false)}
          onScanned={buscarPorCodigoBarras}
        />
      </div>
    </div>
  )
}