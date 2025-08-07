"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Plus, Minus, Package, Barcode, Search, AlertCircle, Camera } from "lucide-react"
import { BarcodeScanner } from "../../inventory/components/barcode-scanner"
import { requisicoesService, SETORES, TURNOS, type NovaRequisicao, type TurnoEntrega } from "../../shared/lib/requisicoes-service"
import { type Usuario } from "../../shared/lib/auth"
import { produtoService } from "../../shared/lib/supabase"

interface NovaRequisicaoProps {
  usuario: Usuario
  onVoltar: () => void
  onRequisicaoCriada: () => void
}

interface ItemTemp {
  id: string // ID temporário
  produto_id: string
  produto_nome: string
  produto_unidade: string
  produto_categoria: string
  produto_cod_item?: string
  quantidade_solicitada: number
}

export function NovaRequisicao({ usuario, onVoltar, onRequisicaoCriada }: NovaRequisicaoProps) {
  const [setorSelecionado, setSetorSelecionado] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [dataEntregaPrevista, setDataEntregaPrevista] = useState("")
  const [turnoSelecionado, setTurnoSelecionado] = useState<TurnoEntrega | "">("")
  const [itens, setItens] = useState<ItemTemp[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  // Estados para adição de produtos
  const [buscaProduto, setBuscaProduto] = useState("")
  const [produtos, setProdutos] = useState<any[]>([])
  const [produtosFiltrados, setProdutosFiltrados] = useState<any[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null)
  const [quantidadeSolicitada, setQuantidadeSolicitada] = useState("1")
  const [carregandoProdutos, setCarregandoProdutos] = useState(false)
  const [scannerAberto, setScannerAberto] = useState(false)
  
  // Ref para auto-foco no campo de busca
  const buscaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Carregar produtos na inicialização
    carregarProdutos()
  }, [])

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
      ]
      setProdutos(PRODUTOS_MOCK)
      setProdutosFiltrados(PRODUTOS_MOCK)
    }
  }

  // Funções utilitárias para detecção de código de barras
  const isCodigoBarras = (texto: string): boolean => {
    return /^\d{13}$/.test(texto.trim())
  }

  const isCodigoBarrasParcial = (texto: string): boolean => {
    return /^\d{8,12}$/.test(texto.trim())
  }

  useEffect(() => {
    // Filtrar produtos baseado na busca
    if (buscaProduto.trim()) {
      setCarregandoProdutos(true)
      const timer = setTimeout(() => {
        try {
          const buscaTrim = buscaProduto.trim()
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
            setBuscaProduto("")
          }
        } catch (error) {
          // Fallback para busca local
          const buscaTrim = buscaProduto.trim()
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
            setBuscaProduto("")
          }
        } finally {
          setCarregandoProdutos(false)
        }
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setProdutosFiltrados(produtos)
    }
  }, [buscaProduto, produtos])

  const adicionarItem = () => {
    if (!produtoSelecionado) {
      setErro("Por favor, selecione um produto")
      return
    }

    const quantidade = Number.parseFloat(quantidadeSolicitada) || 1
    if (quantidade <= 0) {
      setErro("Quantidade deve ser maior que zero")
      return
    }

    // Verificar se produto já foi adicionado
    if (itens.some(item => item.produto_id === produtoSelecionado.id)) {
      setErro("Este produto já foi adicionado à requisição")
      return
    }

    const novoItem: ItemTemp = {
      id: `temp_${Date.now()}_${Math.random()}`,
      produto_id: produtoSelecionado.id,
      produto_nome: produtoSelecionado.nome,
      produto_unidade: produtoSelecionado.unidade,
      produto_categoria: produtoSelecionado.categoria,
      produto_cod_item: produtoSelecionado.cod_item,
      quantidade_solicitada: quantidade
    }

    setItens(prev => [...prev, novoItem])
    setProdutoSelecionado(null)
    setQuantidadeSolicitada("1")
    setBuscaProduto("")
    setErro("")
    
    // Auto-foco no campo de busca para agilizar próxima inserção
    setTimeout(() => {
      buscaInputRef.current?.focus()
    }, 100)
  }

  const removerItem = (itemId: string) => {
    setItens(prev => prev.filter(item => item.id !== itemId))
  }

  const atualizarQuantidade = (itemId: string, quantidade: number) => {
    if (quantidade <= 0) return

    setItens(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantidade_solicitada: quantidade }
          : item
      )
    )
  }

  const handleBarcodeScanned = async (codigo: string) => {
    setScannerAberto(false)
    
    try {
      // Buscar produto no cache local primeiro
      const produto = produtos.find(p => p.codigo_barras === codigo)
      
      if (produto) {
        console.log("Produto encontrado:", produto.nome)
        setProdutoSelecionado(produto)
        setBuscaProduto("")
      } else {
        setErro("Produto não encontrado para este código de barras")
      }
    } catch (error: any) {
      console.error("Erro ao buscar produto por código:", error)
      setErro("Erro ao buscar produto: " + error.message)
    }
  }

  const criarRequisicao = async () => {
    if (!setorSelecionado) {
      setErro("Por favor, selecione um setor")
      return
    }

    if (itens.length === 0) {
      setErro("Adicione pelo menos um produto à requisição")
      return
    }

    setCarregando(true)
    setErro("")

    try {
      const novaRequisicao: NovaRequisicao = {
        setor_solicitante: setorSelecionado,
        usuario_solicitante_id: usuario.id,
        loja_id: usuario.loja_id,
        observacoes: observacoes || undefined,
        data_entrega_prevista: dataEntregaPrevista || undefined,
        turno: turnoSelecionado || undefined,
        itens: itens.map(item => ({
          produto_id: item.produto_id,
          quantidade_solicitada: item.quantidade_solicitada
        }))
      }

      await requisicoesService.criar(novaRequisicao)
      
      setSucesso("Requisição criada com sucesso!")
      
      setTimeout(() => {
        onRequisicaoCriada()
      }, 1500)

    } catch (error: any) {
      console.error("Erro ao criar requisição:", error)
      setErro(error.message || "Erro ao criar requisição. Tente novamente.")
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
          <h1 className="text-xl font-bold text-[#000000]">Nova Requisição</h1>
          <div className="w-20"></div>
        </div>

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
              <Package className="w-4 h-4 text-[#4AC5BB] mr-2" />
              <span className="text-sm text-[#4AC5BB]">{sucesso}</span>
            </div>
          </div>
        )}

        {/* Formulário Principal */}
        <Card className="border-2 border-[#fabd07] shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#000000] text-center">Dados da Requisição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Setor */}
            <div className="space-y-2">
              <label className="text-[#000000] font-semibold text-sm">Setor Solicitante *</label>
              <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                <SelectTrigger className="h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]">
                  <SelectValue placeholder="Selecione o setor..." />
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

            {/* Data de Entrega Prevista */}
            <div className="space-y-2">
              <label className="text-[#000000] font-semibold text-sm">Data de Entrega Prevista</label>
              <Input
                type="date"
                value={dataEntregaPrevista}
                onChange={(e) => setDataEntregaPrevista(e.target.value)}
                className="h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                min={new Date().toISOString().split('T')[0]} // Não permite datas passadas
              />
            </div>

            {/* Turno */}
            <div className="space-y-2">
              <label className="text-[#000000] font-semibold text-sm">Turno</label>
              <Select value={turnoSelecionado} onValueChange={(value: TurnoEntrega) => setTurnoSelecionado(value)}>
                <SelectTrigger className="h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]">
                  <SelectValue placeholder="Selecione o turno..." />
                </SelectTrigger>
                <SelectContent>
                  {TURNOS.map((turno) => (
                    <SelectItem key={turno} value={turno}>
                      {turno}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <label className="text-[#000000] font-semibold text-sm">Observações</label>
              <Textarea
                placeholder="Informações adicionais sobre a requisição..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="border-2 border-[#C9B07A] focus:border-[#fabd07] min-h-[80px]"
              />
            </div>

            {/* Info da requisição */}
            <div className="bg-[#F4DDAE] p-3 rounded-lg border border-[#C9B07A]">
              <div className="space-y-1 text-sm">
                <p><strong>Loja:</strong> {usuario.loja_nome}</p>
                <p><strong>Solicitante:</strong> {usuario.nome}</p>
                <p><strong>Data:</strong> {new Date().toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Busca de Produtos */}
        <Card className="border-2 border-[#fabd07]">
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-[#5F6B6D]" />
                <Input
                  ref={buscaInputRef}
                  placeholder="Buscar por nome, categoria, código ou código de barras..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  className="pl-10 h-12 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                />
                {carregandoProdutos && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#fabd07]"></div>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => setScannerAberto(true)}
                disabled={carregandoProdutos}
                className="h-12 px-4 bg-[#4AC5BB] hover:bg-[#3599B8] text-white flex items-center gap-2"
                title="Escanear código de barras"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Escanear</span>
              </Button>
            </div>

            {/* Lista de Produtos Filtrados */}
            {buscaProduto && (
              <div className="max-h-[32rem] overflow-y-auto space-y-2">
                {produtosFiltrados.map((produto) => (
                  <div
                    key={produto.id}
                    onClick={() => {
                      setProdutoSelecionado(produto)
                      setBuscaProduto("")
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
                {buscaProduto && produtosFiltrados.length === 0 && !carregandoProdutos && (
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
                <label className="text-sm font-semibold text-[#000000] block mb-1">Quantidade Solicitada *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1.00"
                  value={quantidadeSolicitada}
                  onChange={(e) => setQuantidadeSolicitada(e.target.value)}
                  className="h-10 border-2 border-[#C9B07A] focus:border-[#fabd07]"
                />
                <div className="text-xs text-[#5F6B6D] mt-1">{produtoSelecionado.unidade}</div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setProdutoSelecionado(null)
                    setQuantidadeSolicitada("1")
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

        {/* Lista de Itens */}
        {itens.length > 0 && (
          <Card className="border-2 border-[#C9B07A] shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#000000] flex items-center justify-between">
                <span>Itens da Requisição</span>
                <Badge className="bg-[#fabd07] text-white">{itens.length} itens</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-lg border border-[#DFBFBF]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{item.produto_nome}</div>
                        <div className="text-xs text-[#5F6B6D]">
                          {item.produto_categoria} • {item.produto_unidade}
                        </div>
                        {item.produto_cod_item && (
                          <div className="text-xs text-[#8B8C7E] font-mono">
                            {item.produto_cod_item}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerItem(item.id)}
                        className="text-[#FB8281] hover:bg-[#FB8281]/10 p-1 h-auto"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Controle de quantidade */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => atualizarQuantidade(item.id, item.quantidade_solicitada - 1)}
                        disabled={item.quantidade_solicitada <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        step="0.1"
                        value={item.quantidade_solicitada}
                        onChange={(e) => atualizarQuantidade(item.id, Number.parseFloat(e.target.value) || 1)}
                        className="h-8 w-20 text-center text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => atualizarQuantidade(item.id, item.quantidade_solicitada + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm text-[#5F6B6D] ml-2">{item.produto_unidade}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Criar */}
        <Button
          onClick={criarRequisicao}
          disabled={!setorSelecionado || itens.length === 0 || carregando}
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
              Criar Requisição
            </>
          )}
        </Button>

        {/* Scanner */}
        <BarcodeScanner
          isOpen={scannerAberto}
          onClose={() => setScannerAberto(false)}
          onScanned={handleBarcodeScanned}
        />
      </div>
    </div>
  )
}