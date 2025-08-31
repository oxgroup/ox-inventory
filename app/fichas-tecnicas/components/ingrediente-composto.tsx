"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Package, BookOpen, Plus, AlertCircle, Info } from "lucide-react"
import { ingredientesCompostosService, TipoIngrediente, type IngredienteComposto, type NovaFichaTecnica } from "../../shared/lib/fichas-tecnicas-service"
import { produtoService, type Produto } from "../../shared/lib/supabase"
import type { Usuario } from "../../shared/lib/auth"

interface IngredienteCompostoProps {
  usuario: Usuario
  pratoId?: string // ID do prato atual (para evitar auto-referência)
  onSelect: (ingrediente: NovaFichaTecnica) => void
  disabled?: boolean
}

interface PratoDisponivel {
  id: string
  nome: string
  categoria?: string
  descricao?: string
  usuario_id: string
  created_at: string
  usuario?: { nome: string } | null
}

export function IngredienteCompostoComponent({ usuario, pratoId, onSelect, disabled = false }: IngredienteCompostoProps) {
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoIngrediente>(TipoIngrediente.PRODUTO)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [pratosDisponiveis, setPratosDisponiveis] = useState<PratoDisponivel[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(false)
  const [loadingPratos, setLoadingPratos] = useState(false)
  
  // Busca e filtros
  const [buscaProduto, setBuscaProduto] = useState("")
  const [buscaPrato, setBuscaPrato] = useState("")
  
  // Seleção atual
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [pratoSelecionado, setPratoSelecionado] = useState<PratoDisponivel | null>(null)
  
  // Dados do ingrediente
  const [quantidade, setQuantidade] = useState<number>(1)
  const [unidade, setUnidade] = useState<string>("Un")
  const [observacoes, setObservacoes] = useState<string>("")
  
  const [modalAberto, setModalAberto] = useState(false)

  const unidades = [
    'Un', 'Kg', 'g', 'L', 'ml', 'dz', 'cx', 'pct', 'm', 'cm', 'xíc', 'colher sopa', 'colher chá'
  ]

  useEffect(() => {
    carregarProdutos()
    carregarPratosDisponiveis()
  }, [])

  const carregarProdutos = async () => {
    setLoadingProdutos(true)
    try {
      const dados = await produtoService.listar()
      setProdutos(dados)
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    } finally {
      setLoadingProdutos(false)
    }
  }

  const carregarPratosDisponiveis = async () => {
    setLoadingPratos(true)
    try {
      const dados = await ingredientesCompostosService.listarPratosDisponiveis(usuario.loja_id, pratoId)
      // Mapear dados para o formato esperado
      const pratosFormatados = dados.map(prato => ({
        ...prato,
        usuario: Array.isArray(prato.usuario) && prato.usuario.length > 0 
          ? prato.usuario[0] 
          : null
      }))
      setPratosDisponiveis(pratosFormatados as PratoDisponivel[])
    } catch (error) {
      console.error("Erro ao carregar pratos disponíveis:", error)
    } finally {
      setLoadingPratos(false)
    }
  }

  const produtosFiltrados = produtos.filter(p => 
    !buscaProduto || 
    p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
    p.cod_item?.toLowerCase().includes(buscaProduto.toLowerCase())
  ).slice(0, 20) // Limitar para performance

  const pratosFiltrados = pratosDisponiveis.filter(p => 
    !buscaPrato || 
    p.nome.toLowerCase().includes(buscaPrato.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(buscaPrato.toLowerCase())
  ).slice(0, 20) // Limitar para performance

  const handleSelecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto)
    setPratoSelecionado(null)
    setUnidade('Un') // Usar unidade padrão para produtos
  }

  const handleSelecionarPrato = (prato: PratoDisponivel) => {
    setPratoSelecionado(prato)
    setProdutoSelecionado(null)
    setUnidade('porção') // Unidade padrão para pratos
  }

  const handleAdicionar = () => {
    if (!quantidade || quantidade <= 0) {
      alert("Informe uma quantidade válida")
      return
    }

    let novoIngrediente: NovaFichaTecnica

    if (tipoSelecionado === TipoIngrediente.PRODUTO && produtoSelecionado) {
      novoIngrediente = {
        insumo: produtoSelecionado.nome,
        qtd: quantidade,
        quebra: 0,
        unidade: unidade,
        produto_id: produtoSelecionado.id,
        ficha_tecnica_ref_id: null,
        obs_item_ft: observacoes || undefined,
        qtd_receita: quantidade,
        fator_correcao: 1,
        seq: 1
      }
    } else if (tipoSelecionado === TipoIngrediente.FICHA_TECNICA && pratoSelecionado) {
      novoIngrediente = {
        insumo: pratoSelecionado.nome,
        qtd: quantidade,
        quebra: 0,
        unidade: unidade,
        produto_id: undefined,
        ficha_tecnica_ref_id: pratoSelecionado.id,
        obs_item_ft: observacoes || undefined,
        qtd_receita: quantidade,
        fator_correcao: 1,
        seq: 1
      }
    } else {
      alert("Selecione um ingrediente")
      return
    }

    onSelect(novoIngrediente)
    
    // Limpar formulário
    setProdutoSelecionado(null)
    setPratoSelecionado(null)
    setQuantidade(1)
    setObservacoes("")
    setModalAberto(false)
  }

  const ingredienteSelecionado = produtoSelecionado || pratoSelecionado
  const nomeIngrediente = produtoSelecionado?.nome || pratoSelecionado?.nome || ""

  return (
    <Dialog open={modalAberto} onOpenChange={setModalAberto}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-[#4AC5BB] text-[#4AC5BB] hover:bg-[#4AC5BB]/10"
          disabled={disabled}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Ingrediente
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#000000] flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-[#4AC5BB]" />
            Adicionar Ingrediente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção do tipo de ingrediente */}
          <Card className="border-[#DFBFBF]">
            <CardHeader>
              <CardTitle className="text-sm text-[#5F6B6D]">Tipo de Ingrediente</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={tipoSelecionado}
                onValueChange={(value) => {
                  setTipoSelecionado(value as TipoIngrediente)
                  setProdutoSelecionado(null)
                  setPratoSelecionado(null)
                }}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={TipoIngrediente.PRODUTO} id="produto" />
                  <Label htmlFor="produto" className="flex items-center cursor-pointer">
                    <Package className="w-4 h-4 mr-2 text-[#fabd07]" />
                    Produto/Matéria-prima
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={TipoIngrediente.FICHA_TECNICA} id="ficha" />
                  <Label htmlFor="ficha" className="flex items-center cursor-pointer">
                    <BookOpen className="w-4 h-4 mr-2 text-[#4AC5BB]" />
                    Ficha Técnica (Preparação)
                  </Label>
                </div>
              </RadioGroup>

              {tipoSelecionado === TipoIngrediente.FICHA_TECNICA && pratosDisponiveis.length === 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <Info className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Nenhuma ficha técnica disponível</p>
                      <p>Para usar outras fichas como ingredientes, primeiro marque-as como "pode ser insumo" na listagem de fichas técnicas.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de opções */}
            <Card className="border-[#DFBFBF]">
              <CardHeader>
                <CardTitle className="text-sm text-[#5F6B6D] flex items-center">
                  {tipoSelecionado === TipoIngrediente.PRODUTO ? (
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Produtos Disponíveis
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Fichas Técnicas Disponíveis
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Campo de busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5F6B6D] w-4 h-4" />
                  <Input
                    placeholder={tipoSelecionado === TipoIngrediente.PRODUTO ? "Buscar produto..." : "Buscar ficha técnica..."}
                    value={tipoSelecionado === TipoIngrediente.PRODUTO ? buscaProduto : buscaPrato}
                    onChange={(e) => {
                      if (tipoSelecionado === TipoIngrediente.PRODUTO) {
                        setBuscaProduto(e.target.value)
                      } else {
                        setBuscaPrato(e.target.value)
                      }
                    }}
                    className="pl-10 text-sm"
                  />
                </div>

                {/* Lista de produtos */}
                {tipoSelecionado === TipoIngrediente.PRODUTO && (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {loadingProdutos ? (
                      <div className="text-center py-4 text-[#5F6B6D]">Carregando produtos...</div>
                    ) : produtosFiltrados.length === 0 ? (
                      <div className="text-center py-4 text-[#5F6B6D]">
                        {buscaProduto ? "Nenhum produto encontrado" : "Nenhum produto disponível"}
                      </div>
                    ) : (
                      produtosFiltrados.map((produto) => (
                        <div
                          key={produto.id}
                          onClick={() => handleSelecionarProduto(produto)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            produtoSelecionado?.id === produto.id
                              ? 'border-[#4AC5BB] bg-[#4AC5BB]/10'
                              : 'border-[#DFBFBF] hover:border-[#4AC5BB]/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-[#000000] text-sm">{produto.nome}</p>
                              <p className="text-xs text-[#5F6B6D]">{produto.categoria}</p>
                              {produto.cod_item && (
                                <p className="text-xs text-[#5F6B6D] mt-1">Cód: {produto.cod_item}</p>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              Un
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Lista de pratos */}
                {tipoSelecionado === TipoIngrediente.FICHA_TECNICA && (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {loadingPratos ? (
                      <div className="text-center py-4 text-[#5F6B6D]">Carregando fichas técnicas...</div>
                    ) : pratosFiltrados.length === 0 ? (
                      <div className="text-center py-4 text-[#5F6B6D]">
                        {buscaPrato ? "Nenhuma ficha técnica encontrada" : "Nenhuma ficha técnica disponível"}
                      </div>
                    ) : (
                      pratosFiltrados.map((prato) => (
                        <div
                          key={prato.id}
                          onClick={() => handleSelecionarPrato(prato)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            pratoSelecionado?.id === prato.id
                              ? 'border-[#4AC5BB] bg-[#4AC5BB]/10'
                              : 'border-[#DFBFBF] hover:border-[#4AC5BB]/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-[#000000] text-sm">{prato.nome}</p>
                              {prato.categoria && (
                                <p className="text-xs text-[#5F6B6D]">{prato.categoria}</p>
                              )}
                              {prato.usuario?.nome && (
                                <p className="text-xs text-[#5F6B6D] mt-1">Por: {prato.usuario.nome}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs border-[#4AC5BB] text-[#4AC5BB]">
                              Ficha Técnica
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formulário de quantidade */}
            <Card className="border-[#DFBFBF]">
              <CardHeader>
                <CardTitle className="text-sm text-[#5F6B6D]">Detalhes do Ingrediente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ingredienteSelecionado ? (
                  <>
                    {/* Ingrediente selecionado */}
                    <div className="p-3 bg-[#4AC5BB]/10 border border-[#4AC5BB] rounded-lg">
                      <p className="font-medium text-[#000000] text-sm">{nomeIngrediente}</p>
                      <p className="text-xs text-[#5F6B6D]">
                        {tipoSelecionado === TipoIngrediente.PRODUTO 
                          ? produtoSelecionado?.categoria 
                          : pratoSelecionado?.categoria || 'Ficha Técnica'
                        }
                      </p>
                    </div>

                    {/* Quantidade e unidade */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[#5F6B6D] text-xs">Quantidade *</Label>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={quantidade}
                          onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-[#5F6B6D] text-xs">Unidade *</Label>
                        <Select value={unidade} onValueChange={setUnidade}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {unidades.map((u) => (
                              <SelectItem key={u} value={u} className="text-sm">
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <Label className="text-[#5F6B6D] text-xs">Observações (opcional)</Label>
                      <Input
                        placeholder="Ex: Pode substituir por..."
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* Botão adicionar */}
                    <Button
                      onClick={handleAdicionar}
                      className="w-full bg-[#4AC5BB] hover:bg-[#3599B8] text-white"
                      disabled={!quantidade || quantidade <= 0}
                    >
                      Adicionar Ingrediente
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-[#5F6B6D]">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#DFBFBF] rounded-full flex items-center justify-center">
                      {tipoSelecionado === TipoIngrediente.PRODUTO ? (
                        <Package className="w-8 h-8 text-[#5F6B6D]" />
                      ) : (
                        <BookOpen className="w-8 h-8 text-[#5F6B6D]" />
                      )}
                    </div>
                    <p className="text-sm">
                      Selecione {tipoSelecionado === TipoIngrediente.PRODUTO ? 'um produto' : 'uma ficha técnica'} para continuar
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}