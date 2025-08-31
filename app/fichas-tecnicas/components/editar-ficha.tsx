"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, X, Search, Package, Calculator, BookOpen, Settings } from "lucide-react"
import { pratosService, fichasTecnicasService, type Prato, type NovaFichaTecnica, type FotoPreparoEtapa } from "../../shared/lib/fichas-tecnicas-service"
import { UploadFotos } from "./upload-fotos"
import { produtoService, type Produto } from "../../shared/lib/supabase"
import { IngredienteCompostoComponent } from "./ingrediente-composto"
import { SeletorSetores } from "./seletor-setores"
import { Checkbox } from "@/components/ui/checkbox"
import type { Usuario } from "../../shared/lib/auth"

interface EditarFichaProps {
  prato: Prato
  usuario: Usuario
  onVoltar: () => void
  onSalvar: () => void
}

interface IngredienteFormulario extends NovaFichaTecnica {
  tempId: string
}

export function EditarFicha({ prato, usuario, onVoltar, onSalvar }: EditarFichaProps) {
  const [loading, setLoading] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(false)
  
  // Dados do prato
  const [nome, setNome] = useState(prato.nome || "")
  const [descricao, setDescricao] = useState(prato.descricao || "")
  const [categoria, setCategoria] = useState(prato.categoria || "")
  const [modoPreparoPrato, setModoPreparoPrato] = useState(prato.modo_preparo || "")
  const [fotoPratoFinal, setFotoPratoFinal] = useState(prato.foto_prato_final || "")
  const [fotosPreparoEtapas, setFotosPreparoEtapas] = useState<FotoPreparoEtapa[]>(prato.fotos_preparo || [])
  const [podeSerInsumo, setPodeSerInsumo] = useState(prato.pode_ser_insumo || false)
  const [setores, setSetores] = useState<string[]>(prato.setores || [])
  
  // Ingredientes do prato (inicializar com ingredientes existentes)
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
    carregarIngredientesExistentes()
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

  const carregarIngredientesExistentes = async () => {
    if (!prato.fichas_tecnicas) return
    
    // Converter fichas técnicas existentes para o formato do formulário
    const ingredientesExistentes: IngredienteFormulario[] = prato.fichas_tecnicas.map((ficha, index) => ({
      ...ficha,
      tempId: `existing-${index}`,
      insumo: ficha.insumo,
      produto_id: ficha.produto_id || '',
      qtd: ficha.qtd,
      quebra: ficha.quebra || 0,
      unidade: ficha.unidade,
      codigo_empresa: ficha.codigo_empresa || '',
      qtd_receita: ficha.qtd_receita || 0,
      fator_correcao: ficha.fator_correcao || 1,
      obs_item_ft: ficha.obs_item_ft || '',
      id_grupo: ficha.id_grupo || '',
      seq: ficha.seq || index + 1,
      qtd_lote: ficha.qtd_lote || 0,
      id_cliente_queops: ficha.id_cliente_queops || ''
    }))
    
    setIngredientes(ingredientesExistentes)
  }

  const produtosFiltrados = produtos.filter(p => 
    !buscaProduto || 
    p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
    p.cod_item?.toLowerCase().includes(buscaProduto.toLowerCase())
  )

  const adicionarItem = () => {
    if (!novoIngrediente.produto_id || !novoIngrediente.insumo || !novoIngrediente.unidade || novoIngrediente.qtd <= 0) {
      alert("Selecione um produto, informe a quantidade e unidade")
      return
    }

    const item: IngredienteFormulario = {
      ...novoIngrediente,
      tempId: Date.now().toString(),
      seq: ingredientes.length + 1
    }

    setIngredientes([...ingredientes, item])
    
    // Reset form
    setNovoIngrediente({
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
    
    setMostrarFormItem(false)
  }

  const removerItem = (tempId: string) => {
    setIngredientes(ingredientes.filter(item => item.tempId !== tempId))
  }

  const adicionarIngredienteComposto = (ingrediente: NovaFichaTecnica) => {
    const novoItem: IngredienteFormulario = {
      ...ingrediente,
      tempId: Date.now().toString(),
      seq: ingredientes.length + 1
    }
    
    setIngredientes([...ingredientes, novoItem])
  }

  const salvarFicha = async () => {
    if (!nome.trim()) {
      alert("O nome do prato é obrigatório")
      return
    }

    if (ingredientes.length === 0) {
      alert("Adicione pelo menos um ingrediente")
      return
    }

    setLoading(true)
    
    try {
      // Atualizar dados do prato
      await pratosService.atualizar(prato.id, {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        categoria: categoria.trim(),
        modo_preparo: modoPreparoPrato.trim() || undefined,
        foto_prato_final: fotoPratoFinal || undefined,
        fotos_preparo: fotosPreparoEtapas.length > 0 ? fotosPreparoEtapas : [],
        pode_ser_insumo: podeSerInsumo,
        setores: setores
      })

      // Remover ingredientes existentes e adicionar os novos
      await fichasTecnicasService.atualizarIngredientes(prato.id, 
        ingredientes.map(({ tempId, ...ingrediente }) => ingrediente)
      )

      onSalvar()
    } catch (error) {
      console.error("Erro ao salvar ficha:", error)
      alert("Erro ao salvar ficha técnica. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const calcularQuantidadeTotal = (qtd: number, quebra: number, fatorCorrecao: number) => {
    return qtd * (1 + quebra/100) * fatorCorrecao
  }

  const formatarQuantidade = (valor: number) => {
    return valor.toLocaleString("pt-BR", { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 3 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={onVoltar}
            variant="outline"
            size="sm"
            className="border-[#3599B8] text-[#3599B8] hover:bg-[#3599B8]/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-lg font-bold text-[#000000]">Editar Ficha Técnica</h1>
          <div className="w-20"></div>
        </div>

        {/* Informações do Prato */}
        <Card className="border-2 border-[#fabd07] shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#000000] text-lg">Informações do Prato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome" className="text-[#5F6B6D] font-medium">Nome do Prato *</Label>
              <Input
                id="nome"
                placeholder="Ex: Hambúrguer Artesanal"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="categoria" className="text-[#5F6B6D] font-medium">Categoria</Label>
              <Input
                id="categoria"
                placeholder="Ex: Sanduíches, Pratos Principais..."
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="descricao" className="text-[#5F6B6D] font-medium">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição opcional do prato..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="modo-preparo" className="text-[#5F6B6D] font-medium">Modo de Preparo</Label>
              <Textarea
                id="modo-preparo"
                placeholder="Descreva o passo-a-passo para preparar o prato..."
                value={modoPreparoPrato}
                onChange={(e) => setModoPreparoPrato(e.target.value)}
                rows={4}
                disabled={loading}
              />
            </div>
            
            {/* Setorização */}
            <div>
              <Label className="text-[#5F6B6D] font-medium">Setores de Utilização</Label>
              <div className="mt-1">
                <SeletorSetores
                  setoresSelecionados={setores}
                  onSetoresChange={setSetores}
                  disabled={loading}
                  placeholder="Selecione os setores onde esta ficha será utilizada..."
                />
              </div>
              <p className="text-xs text-[#5F6B6D] mt-1">
                Selecione em quais setores esta ficha técnica será utilizada. Isso ajudará na organização e filtragem por área.
              </p>
            </div>

            {/* Configurações avançadas */}
            <div className="flex items-center space-x-2 p-3 bg-[#4AC5BB]/5 border border-[#4AC5BB]/20 rounded-lg">
              <Checkbox
                id="pode-ser-insumo"
                checked={podeSerInsumo}
                onCheckedChange={(checked) => setPodeSerInsumo(checked === true)}
                disabled={loading}
              />
              <div className="flex items-center">
                <Settings className="w-4 h-4 text-[#4AC5BB] mr-2" />
                <Label htmlFor="pode-ser-insumo" className="text-sm text-[#000000] cursor-pointer">
                  Este prato pode ser usado como ingrediente em outras fichas técnicas
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload de Fotos */}
        <UploadFotos
          fotoPratoFinal={fotoPratoFinal}
          fotosPreparoEtapas={fotosPreparoEtapas}
          onFotoPratoFinalChange={setFotoPratoFinal}
          onFotosPreparoChange={setFotosPreparoEtapas}
          pratoId={prato.id}
          usuarioId={usuario.id}
          disabled={loading}
        />

        {/* Lista de Ingredientes */}
        <Card className="border-2 border-[#4AC5BB] shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#000000] text-lg flex items-center justify-between">
              <span>Ingredientes ({ingredientes.length})</span>
              {/* Botão para ingredientes compostos */}
              <IngredienteCompostoComponent 
                usuario={usuario}
                pratoId={prato.id}
                onSelect={adicionarIngredienteComposto}
                disabled={loading}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Lista de ingredientes adicionados */}
            {ingredientes.map((item, index) => {
              const produto = produtos.find(p => p.id === item.produto_id)
              const qtdTotal = calcularQuantidadeTotal(item.qtd, item.quebra || 0, item.fator_correcao || 1)
              
              return (
                <div key={item.tempId} className="border border-[#DFBFBF] rounded-lg p-3 bg-white/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#000000] text-sm">{item.insumo}</p>
                        {item.ficha_tecnica_ref_id ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-[#4AC5BB]/10 text-[#4AC5BB] border border-[#4AC5BB]/20">
                            <BookOpen className="w-3 h-3 mr-1" />
                            Ficha Técnica
                          </span>
                        ) : produto ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-[#fabd07]/10 text-[#fabd07] border border-[#fabd07]/20">
                            <Package className="w-3 h-3 mr-1" />
                            Produto
                          </span>
                        ) : null}
                      </div>
                      {produto && (
                        <p className="text-xs text-[#3599B8] mt-1">📦 {produto.nome}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#5F6B6D]">
                        <span className="font-bold text-[#fabd07]">
                          {formatarQuantidade(item.qtd)} {item.unidade}
                        </span>
                        {((item.quebra || 0) > 0 || (item.fator_correcao || 1) !== 1) && (
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
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}

            {/* Formulário para adicionar novo ingrediente */}
            {mostrarFormItem && (
              <Card className="border-2 border-[#C9B07A] shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#000000] text-base flex items-center justify-between">
                    Novo Ingrediente
                    <Button
                      onClick={() => setMostrarFormItem(false)}
                      variant="outline"
                      size="sm"
                      className="border-[#5F6B6D] text-[#5F6B6D]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div>
                    <Label className="text-[#5F6B6D] text-xs">Selecionar Produto/Insumo *</Label>
                    <div className="relative">
                      <Input
                        placeholder="Digite para buscar produtos..."
                        value={buscaProduto}
                        onChange={(e) => setBuscaProduto(e.target.value)}
                        className="text-sm"
                        disabled={loading}
                      />
                      {buscaProduto && produtosFiltrados.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-[#DFBFBF] rounded-lg shadow-lg max-h-40 overflow-auto">
                          {produtosFiltrados.slice(0, 10).map((produto) => (
                            <div
                              key={produto.id}
                              onClick={() => {
                                setNovoIngrediente({
                                  ...novoIngrediente,
                                  insumo: produto.nome,
                                  produto_id: produto.id,
                                  unidade: produto.unidade || 'Un'
                                })
                                setBuscaProduto("")
                              }}
                              className="p-2 hover:bg-[#F4DDAE] cursor-pointer border-b border-[#DFBFBF] last:border-0"
                            >
                              <div className="font-medium text-sm text-[#000000]">{produto.nome}</div>
                              <div className="text-xs text-[#5F6B6D]">
                                {produto.categoria} | {produto.unidade}
                                {produto.cod_item && ` | ${produto.cod_item}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {novoIngrediente.insumo && (
                      <div className="mt-1 text-xs text-[#3599B8] flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        Produto selecionado: {novoIngrediente.insumo}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[#5F6B6D] text-xs">Quantidade *</Label>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="0"
                        value={novoIngrediente.qtd || ''}
                        onChange={(e) => setNovoIngrediente({...novoIngrediente, qtd: parseFloat(e.target.value) || 0})}
                        className="text-sm"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label className="text-[#5F6B6D] text-xs">Unidade *</Label>
                      <Select 
                        value={novoIngrediente.unidade} 
                        onValueChange={(value) => setNovoIngrediente({...novoIngrediente, unidade: value})}
                        disabled={loading}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecione" />
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
                        step="0.01"
                        placeholder="0"
                        value={novoIngrediente.quebra || ''}
                        onChange={(e) => setNovoIngrediente({...novoIngrediente, quebra: parseFloat(e.target.value) || 0})}
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
                        value={novoIngrediente.fator_correcao || ''}
                        onChange={(e) => setNovoIngrediente({...novoIngrediente, fator_correcao: parseFloat(e.target.value) || 1})}
                        className="text-sm"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#5F6B6D] text-xs">Grupo</Label>
                    <Input
                      placeholder="Ex: Base, Molhos, Acompanhamentos..."
                      value={novoIngrediente.id_grupo || ''}
                      onChange={(e) => setNovoIngrediente({...novoIngrediente, id_grupo: e.target.value})}
                      className="text-sm"
                      disabled={loading}
                    />
                  </div>

                  <Button
                    onClick={adicionarItem}
                    className="w-full bg-[#4AC5BB] hover:bg-[#3599B8] text-white text-sm"
                    disabled={loading}
                  >
                    Adicionar Ingrediente
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
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
            disabled={loading || !nome.trim() || ingredientes.length === 0}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </div>
  )
}