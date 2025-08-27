"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, X, Search, Package, Calculator } from "lucide-react"
import { pratosService, type NovoPrato, type NovaFichaTecnica } from "../../shared/lib/fichas-tecnicas-service"
import { produtoService, type Produto } from "../../shared/lib/supabase"
import type { Usuario } from "../../shared/lib/auth"

interface NovaFichaProps {
  usuario: Usuario
  onVoltar: () => void
  onSalvar: () => void
}

interface IngredienteFormulario extends NovaFichaTecnica {
  tempId: string
}

export function NovaFicha({ usuario, onVoltar, onSalvar }: NovaFichaProps) {
  const [loading, setLoading] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(false)
  
  // Dados do prato
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [categoria, setCategoria] = useState("")
  
  // Ingredientes do prato
  const [ingredientes, setIngredientes] = useState<IngredienteFormulario[]>([])
  
  // Formulário de novo ingrediente
  const [novoIngrediente, setNovoIngrediente] = useState<IngredienteFormulario>({
    tempId: '',
    insumo: '',
    produto_id: '',
    qtd: 0,
    quebra: 0,
    unidade: 'Un',
    codigo_empresa: '',
    qtd_receita: 0,
    fator_correcao: 1,
    obs_item_ft: '',
    id_grupo: '',
    seq: 1,
    qtd_lote: 0,
    id_cliente_queops: ''
  })
  
  const [mostrarFormItem, setMostrarFormItem] = useState(false)
  const [buscaProduto, setBuscaProduto] = useState("")

  const unidades = [
    'Un', 'Kg', 'g', 'L', 'ml', 'dz', 'cx', 'pct', 'm', 'cm'
  ]

  useEffect(() => {
    carregarProdutos()
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

  const produtosFiltrados = produtos.filter(p => 
    !buscaProduto || 
    p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
    p.cod_item?.toLowerCase().includes(buscaProduto.toLowerCase())
  )

  const adicionarItem = () => {
    if (!novoItem.insumo || !novoItem.unidade || novoItem.qtd <= 0) {
      alert("Preencha pelo menos: Insumo, Quantidade e Unidade")
      return
    }

    const item: ItemFormulario = {
      ...novoItem,
      tempId: Date.now().toString(),
      seq: itens.length + 1
    }

    setItens([...itens, item])
    
    // Reset form
    setNovoItem({
      tempId: '',
      insumo: '',
      produto_id: '',
      qtd: 0,
      quebra: 0,
      unidade: 'Un',
      codigo_empresa: '',
      qtd_receita: 0,
      fator_correcao: 1,
      obs_item_ft: '',
      id_grupo: '',
      seq: itens.length + 2,
      qtd_lote: 0,
      id_cliente_queops: ''
    })
    
    setBuscaProduto("")
    setMostrarFormItem(false)
  }

  const removerItem = (tempId: string) => {
    setItens(itens.filter(item => item.tempId !== tempId))
  }

  const calcularQuantidadeTotal = (qtd: number, quebra: number, fatorCorrecao: number) => {
    return (qtd * (1 + quebra / 100)) * fatorCorrecao
  }

  const salvarFicha = async () => {
    if (!item.trim()) {
      alert("Digite o nome da ficha técnica")
      return
    }

    if (itens.length === 0) {
      alert("Adicione pelo menos um item à ficha técnica")
      return
    }

    setLoading(true)
    
    try {
      const novaFicha: NovaFichaTecnica = {
        item: item.trim(),
        usuario_id: usuario.id,
        loja_id: usuario.loja_id,
        observacoes: observacoes.trim() || undefined,
        itens: itens.map(({ tempId, ...item }) => item)
      }

      await fichasTecnicasService.criar(novaFicha)
      onSalvar()
    } catch (error) {
      console.error("Erro ao salvar ficha:", error)
      alert("Erro ao salvar ficha técnica. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const formatarQuantidade = (valor: number) => {
    return valor.toLocaleString("pt-BR", { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 3 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={onVoltar}
            variant="ghost"
            size="sm"
            className="text-[#000000] hover:bg-white/20"
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold text-[#000000]">Nova Ficha Técnica</h1>
          <div className="w-16"></div>
        </div>

        {/* Informações Básicas */}
        <Card className="border-2 border-[#fabd07] shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#000000] text-lg">Informações da Ficha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="item" className="text-[#5F6B6D] font-medium">Nome da Ficha *</Label>
              <Input
                id="item"
                placeholder="Ex: Hambúrguer Artesanal, Molho Especial..."
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="border-[#DFBFBF] focus:border-[#fabd07]"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="observacoes" className="text-[#5F6B6D] font-medium">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Instruções gerais, notas importantes..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="border-[#DFBFBF] focus:border-[#fabd07] resize-none"
                rows={3}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Itens */}
        <Card className="border-2 border-[#3599B8] shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#000000] text-lg flex items-center justify-between">
              <span>Itens da Ficha ({itens.length})</span>
              {!mostrarFormItem && (
                <Button
                  onClick={() => setMostrarFormItem(true)}
                  size="sm"
                  className="bg-[#fabd07] hover:bg-[#b58821] text-white"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Lista de itens adicionados */}
            {itens.map((item, index) => {
              const produto = produtos.find(p => p.id === item.produto_id)
              const qtdTotal = calcularQuantidadeTotal(item.qtd, item.quebra || 0, item.fator_correcao || 1)
              
              return (
                <div key={item.tempId} className="border border-[#DFBFBF] rounded-lg p-3 bg-white/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-[#000000] text-sm">{item.insumo}</p>
                      {produto && (
                        <p className="text-xs text-[#3599B8] mt-1">📦 {produto.nome}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#5F6B6D]">
                        <span className="font-bold text-[#fabd07]">
                          {formatarQuantidade(item.qtd)} {item.unidade}
                        </span>
                        {(item.quebra > 0 || item.fator_correcao !== 1) && (
                          <span className="text-[#4AC5BB]">
                            <Calculator className="w-3 h-3 inline mr-1" />
                            {formatarQuantidade(qtdTotal)}
                          </span>
                        )}
                        {item.id_grupo && (
                          <span className="bg-[#C9B07A] text-white px-2 py-1 rounded">
                            {item.id_grupo}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => removerItem(item.tempId)}
                      size="sm"
                      variant="ghost"
                      className="text-[#FB8281] hover:bg-[#FB8281]/10"
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}

            {/* Formulário de novo item */}
            {mostrarFormItem && (
              <Card className="border border-[#fabd07] bg-[#F4DDAE]/30">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[#000000] text-sm">Novo Item</h4>
                    <Button
                      onClick={() => setMostrarFormItem(false)}
                      size="sm"
                      variant="ghost"
                      className="text-[#5F6B6D] hover:bg-white/20"
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-[#5F6B6D] text-xs">Nome do Insumo *</Label>
                    <Input
                      placeholder="Ex: Carne Bovina, Queijo Cheddar..."
                      value={novoItem.insumo}
                      onChange={(e) => setNovoItem({...novoItem, insumo: e.target.value})}
                      className="text-sm"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[#5F6B6D] text-xs">Quantidade *</Label>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="0"
                        value={novoItem.qtd || ''}
                        onChange={(e) => setNovoItem({...novoItem, qtd: parseFloat(e.target.value) || 0})}
                        className="text-sm"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label className="text-[#5F6B6D] text-xs">Unidade *</Label>
                      <Select 
                        value={novoItem.unidade} 
                        onValueChange={(value) => setNovoItem({...novoItem, unidade: value})}
                        disabled={loading}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unidades.map(unidade => (
                            <SelectItem key={unidade} value={unidade}>{unidade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[#5F6B6D] text-xs">Quebra (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={novoItem.quebra || ''}
                        onChange={(e) => setNovoItem({...novoItem, quebra: parseFloat(e.target.value) || 0})}
                        className="text-sm"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label className="text-[#5F6B6D] text-xs">Fator Correção</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1"
                        value={novoItem.fator_correcao || ''}
                        onChange={(e) => setNovoItem({...novoItem, fator_correcao: parseFloat(e.target.value) || 1})}
                        className="text-sm"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#5F6B6D] text-xs">Grupo</Label>
                    <Input
                      placeholder="Ex: Proteínas, Vegetais, Temperos..."
                      value={novoItem.id_grupo || ''}
                      onChange={(e) => setNovoItem({...novoItem, id_grupo: e.target.value})}
                      className="text-sm"
                      disabled={loading}
                    />
                  </div>

                  {/* Busca de produto */}
                  <div>
                    <Label className="text-[#5F6B6D] text-xs">Vincular Produto (opcional)</Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5F6B6D] w-4 h-4" />
                        <Input
                          placeholder="Buscar produto..."
                          value={buscaProduto}
                          onChange={(e) => setBuscaProduto(e.target.value)}
                          className="pl-9 text-sm"
                          disabled={loading || loadingProdutos}
                        />
                      </div>
                      
                      {buscaProduto && (
                        <div className="max-h-32 overflow-y-auto space-y-1 border border-[#DFBFBF] rounded bg-white p-2">
                          {loadingProdutos ? (
                            <p className="text-center text-xs text-[#5F6B6D]">Carregando...</p>
                          ) : produtosFiltrados.length === 0 ? (
                            <p className="text-center text-xs text-[#5F6B6D]">Nenhum produto encontrado</p>
                          ) : (
                            produtosFiltrados.slice(0, 5).map(produto => (
                              <button
                                key={produto.id}
                                onClick={() => {
                                  setNovoItem({...novoItem, produto_id: produto.id})
                                  setBuscaProduto(produto.nome)
                                }}
                                className="w-full text-left p-2 hover:bg-[#F4DDAE]/50 rounded text-xs"
                                disabled={loading}
                              >
                                <p className="font-medium text-[#000000]">{produto.nome}</p>
                                <p className="text-[#5F6B6D]">{produto.categoria} - {produto.unidade}</p>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={adicionarItem}
                    className="w-full bg-[#4AC5BB] hover:bg-[#3599B8] text-white text-sm"
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Item
                  </Button>
                </CardContent>
              </Card>
            )}

            {itens.length === 0 && !mostrarFormItem && (
              <div className="text-center py-6 text-[#5F6B6D]">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum item adicionado ainda.</p>
                <p className="text-xs">Clique no botão + para adicionar itens.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex gap-3">
          <Button
            onClick={onVoltar}
            variant="outline"
            className="flex-1 border-[#5F6B6D] text-[#5F6B6D] hover:bg-[#5F6B6D]/10"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={salvarFicha}
            className="flex-1 bg-[#fabd07] hover:bg-[#b58821] text-white"
            disabled={loading || !item.trim() || itens.length === 0}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Ficha
          </Button>
        </div>
      </div>
    </div>
  )
}