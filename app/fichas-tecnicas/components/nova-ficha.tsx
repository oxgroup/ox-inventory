"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Plus, X, Search, Package, Calculator, BookOpen, Settings } from "lucide-react"
import { pratosService, type NovoPrato, type NovaFichaTecnica, type FotoPreparoEtapa } from "../../shared/lib/fichas-tecnicas-service"
import { UploadFotos } from "./upload-fotos"
import { IngredienteCompostoComponent } from "./ingrediente-composto"
import { SeletorSetores } from "./seletor-setores"
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
  
  // Dados do prato
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [categoria, setCategoria] = useState("")
  
  // Ingredientes do prato
  const [ingredientes, setIngredientes] = useState<IngredienteFormulario[]>([])
  
  
  // Dados do prato (nome e descrição)
  const [item, setItem] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [modoPreparoPrato, setModoPreparoPrato] = useState("")
  const [fotoPratoFinal, setFotoPratoFinal] = useState("")
  const [fotosPreparoEtapas, setFotosPreparoEtapas] = useState<FotoPreparoEtapa[]>([])
  const [podeSerInsumo, setPodeSerInsumo] = useState(false)
  const [setores, setSetores] = useState<string[]>([])

  const unidades = [
    'Un', 'Kg', 'g', 'L', 'ml', 'dz', 'cx', 'pct', 'm', 'cm'
  ]


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

  const calcularQuantidadeTotal = (qtd: number, quebra: number, fatorCorrecao: number) => {
    return (qtd * (1 + quebra / 100)) * fatorCorrecao
  }

  const salvarFicha = async () => {
    if (!item.trim()) {
      alert("Digite o nome da ficha técnica")
      return
    }

    if (ingredientes.length === 0) {
      alert("Adicione pelo menos um item à ficha técnica")
      return
    }

    setLoading(true)
    
    try {
      const novoPrato: NovoPrato = {
        nome: item.trim(),
        descricao: observacoes.trim() || undefined,
        categoria: categoria.trim(),
        modo_preparo: modoPreparoPrato.trim() || undefined,
        foto_prato_final: fotoPratoFinal || undefined,
        fotos_preparo: fotosPreparoEtapas.length > 0 ? fotosPreparoEtapas : undefined,
        pode_ser_insumo: podeSerInsumo,
        setores: setores,
        usuario_id: usuario.id,
        loja_id: usuario.loja_id,
        ingredientes: ingredientes.map(({ tempId, ...ingrediente }) => ingrediente)
      }

      await pratosService.criar(novoPrato)
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
            <div>
              <Label htmlFor="modo-preparo" className="text-[#5F6B6D] font-medium">Modo de Preparo</Label>
              <Textarea
                id="modo-preparo"
                placeholder="Descreva o passo-a-passo para preparar o prato..."
                value={modoPreparoPrato}
                onChange={(e) => setModoPreparoPrato(e.target.value)}
                className="border-[#DFBFBF] focus:border-[#fabd07] resize-none"
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
          usuarioId={usuario.id}
          disabled={loading}
        />

        {/* Lista de Ingredientes */}
        <Card className="border-2 border-[#3599B8] shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#000000] text-lg flex items-center justify-between">
              <span>Itens da Ficha ({ingredientes.length})</span>
              {/* Botão para ingredientes compostos */}
              <IngredienteCompostoComponent 
                usuario={usuario}
                onSelect={adicionarIngredienteComposto}
                disabled={loading}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Lista de ingredientes adicionados */}
            {ingredientes.map((item, index) => {
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
                        ) : item.produto_id ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-[#fabd07]/10 text-[#fabd07] border border-[#fabd07]/20">
                            <Package className="w-3 h-3 mr-1" />
                            Produto
                          </span>
                        ) : null}
                      </div>
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

            {ingredientes.length === 0 && (
              <div className="text-center py-6 text-[#5F6B6D]">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum item adicionado ainda.</p>
                <p className="text-xs">Clique no botão "Adicionar Ingrediente" para começar.</p>
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
            disabled={loading || !item.trim() || ingredientes.length === 0}
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