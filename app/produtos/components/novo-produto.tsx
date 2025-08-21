"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, AlertCircle, Check, Camera } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { produtoService, type Produto } from "../../shared/lib/supabase"
import type { Usuario } from "../../shared/lib/auth"
import { BarcodeScanner } from "../../inventory/components/barcode-scanner"

interface NovoProdutoProps {
  usuario: Usuario
  onVoltar: () => void
  onProdutoCriado: (produto: Produto) => void
}

const CATEGORIAS_SUGERIDAS = [
  "Carnes",
  "Peixes",
  "Legumes",
  "Verduras", 
  "Frutas",
  "Laticínios",
  "Bebidas",
  "Óleos",
  "Temperos",
  "Grãos",
  "Massas",
  "Enlatados",
  "Congelados",
  "Limpeza",
  "Higiene",
  "Padaria",
  "Confeitaria",
  "Outros"
]

const UNIDADES_SUGERIDAS = [
  "kg",
  "g", 
  "litro",
  "ml",
  "unidade",
  "caixa",
  "pacote",
  "garrafa",
  "lata",
  "saco",
  "metro",
  "cm"
]

const SETORES_SUGERIDOS = [
  "Cozinha",
  "Bar", 
  "Vinhos",
  "Enxoval"
]

export function NovoProduto({ usuario, onVoltar, onProdutoCriado }: NovoProdutoProps) {
  const [formData, setFormData] = useState<Partial<Produto>>({
    nome: "",
    categoria: "",
    unidade: "",
    cod_item: "",
    codigo_barras: "",
    setor_1: "Cozinha",
    loja_id: usuario.loja_id,
    ativo: true
  })
  
  const [categoriaNova, setCategoriaNova] = useState("")
  const [unidadeNova, setUnidadeNova] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [scannerAberto, setScannerAberto] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")
    setSucesso(false)

    // Validações básicas
    if (!formData.nome?.trim()) {
      setErro("Nome do produto é obrigatório")
      return
    }

    const categoria = categoriaNova.trim() || formData.categoria
    const unidade = unidadeNova.trim() || formData.unidade

    if (!categoria) {
      setErro("Categoria é obrigatória")
      return
    }

    if (!unidade) {
      setErro("Unidade é obrigatória")
      return
    }

    try {
      setSalvando(true)
      
      const produtoParaCriar = {
        ...formData,
        nome: formData.nome!.trim(),
        categoria: categoria,
        unidade: unidade,
        cod_item: formData.cod_item?.trim() || undefined,
        codigo_barras: formData.codigo_barras?.trim() || undefined
      }

      const produtoCriado = await produtoService.criar(produtoParaCriar)
      
      setSucesso(true)
      setTimeout(() => {
        onProdutoCriado(produtoCriado)
      }, 1000)
      
    } catch (error: any) {
      console.error("Erro ao criar produto:", error)
      setErro(error.message || "Erro ao criar produto")
    } finally {
      setSalvando(false)
    }
  }

  const handleInputChange = (field: keyof Produto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (erro) setErro("")
  }

  const handleCodigoEscaneado = (codigo: string) => {
    // Validar se é EAN-13 (13 dígitos)
    if (!/^\d{13}$/.test(codigo)) {
      setErro("Código de barras deve ter exatamente 13 dígitos (EAN-13)")
      return
    }

    // Atualizar campo com código escaneado
    handleInputChange("codigo_barras", codigo)
    setScannerAberto(false)
    
    // Vibrar se disponível
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <Card className="w-full max-w-md border-2 border-[#97C93D] shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-[#97C93D] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[#000000] mb-2">
              Produto criado com sucesso!
            </h3>
            <p className="text-[#5F6B6D] text-sm">
              Redirecionando para os detalhes...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE]">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={onVoltar}
            variant="outline"
            className="border-[#3599B8] text-[#3599B8] hover:bg-[#3599B8]/10"
            disabled={salvando}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#000000]">📦 Novo Produto</h1>
            <p className="text-[#5F6B6D]">Cadastrar novo produto no sistema</p>
          </div>
        </div>

        {/* Formulário */}
        <Card className="max-w-2xl mx-auto border-2 border-[#fabd07] shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#000000] flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Dados do Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#000000] border-b border-[#C9B07A] pb-2">
                  Informações Básicas
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-[#5F6B6D] font-medium">
                      Nome do Produto *
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome || ""}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      placeholder="Ex: Carne Bovina - Alcatra"
                      className="border-[#3599B8] focus:border-[#fabd07]"
                      disabled={salvando}
                    />
                  </div>

                  {/* Código do Item */}
                  <div className="space-y-2">
                    <Label htmlFor="cod_item" className="text-[#5F6B6D] font-medium">
                      Código do Item
                    </Label>
                    <Input
                      id="cod_item"
                      value={formData.cod_item || ""}
                      onChange={(e) => handleInputChange("cod_item", e.target.value)}
                      placeholder="Ex: CARNE001"
                      className="border-[#3599B8] focus:border-[#fabd07]"
                      disabled={salvando}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Categoria */}
                  <div className="space-y-2">
                    <Label className="text-[#5F6B6D] font-medium">
                      Categoria *
                    </Label>
                    <Select 
                      value={formData.categoria || ""} 
                      onValueChange={(value) => {
                        handleInputChange("categoria", value)
                        setCategoriaNova("")
                      }}
                      disabled={salvando}
                    >
                      <SelectTrigger className="border-[#3599B8] focus:border-[#fabd07]">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_SUGERIDAS.map(categoria => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={categoriaNova}
                      onChange={(e) => setCategoriaNova(e.target.value)}
                      placeholder="Ou digite uma nova categoria..."
                      className="border-[#C9B07A] focus:border-[#fabd07] text-sm"
                      disabled={salvando}
                    />
                  </div>

                  {/* Unidade */}
                  <div className="space-y-2">
                    <Label className="text-[#5F6B6D] font-medium">
                      Unidade *
                    </Label>
                    <Select 
                      value={formData.unidade || ""} 
                      onValueChange={(value) => {
                        handleInputChange("unidade", value)
                        setUnidadeNova("")
                      }}
                      disabled={salvando}
                    >
                      <SelectTrigger className="border-[#3599B8] focus:border-[#fabd07]">
                        <SelectValue placeholder="Selecione uma unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES_SUGERIDAS.map(unidade => (
                          <SelectItem key={unidade} value={unidade}>
                            {unidade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={unidadeNova}
                      onChange={(e) => setUnidadeNova(e.target.value)}
                      placeholder="Ou digite uma nova unidade..."
                      className="border-[#C9B07A] focus:border-[#fabd07] text-sm"
                      disabled={salvando}
                    />
                  </div>
                </div>

                {/* Setor Principal */}
                <div className="space-y-2">
                  <Label className="text-[#5F6B6D] font-medium">
                    Setor Principal *
                  </Label>
                  <Select 
                    value={formData.setor_1 || "Cozinha"} 
                    onValueChange={(value) => handleInputChange("setor_1", value)}
                    disabled={salvando}
                  >
                    <SelectTrigger className="border-[#3599B8] focus:border-[#fabd07]">
                      <SelectValue placeholder="Selecione o setor principal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cozinha">🍳 Cozinha</SelectItem>
                      <SelectItem value="Bar">🍺 Bar</SelectItem>
                      <SelectItem value="Vinhos">🍷 Vinhos</SelectItem>
                      <SelectItem value="Enxoval">🛏️ Enxoval</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#8B8C7E]">
                    💡 Define em qual setor este produto será usado principalmente
                  </p>
                </div>

                {/* Código de Barras */}
                <div className="space-y-2">
                  <Label htmlFor="codigo_barras" className="text-[#5F6B6D] font-medium">
                    Código de Barras
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="codigo_barras"
                      value={formData.codigo_barras || ""}
                      onChange={(e) => handleInputChange("codigo_barras", e.target.value)}
                      placeholder="13 dígitos (EAN-13)"
                      className="border-[#3599B8] focus:border-[#fabd07] flex-1"
                      disabled={salvando}
                    />
                    <Button
                      type="button"
                      onClick={() => setScannerAberto(true)}
                      className="bg-[#4AC5BB] hover:bg-[#3599B8] text-white px-3"
                      disabled={salvando}
                      title="Escanear código de barras"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-[#8B8C7E]">
                    💡 Use o scanner para capturar o código automaticamente
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-[#F4DDAE]/20 rounded-lg border border-[#C9B07A]">
                  <div>
                    <Label className="text-[#5F6B6D] font-medium">Status do Produto</Label>
                    <p className="text-sm text-[#8B8C7E]">
                      Produtos ativos aparecem nos inventários e requisições
                    </p>
                  </div>
                  <Switch
                    checked={formData.ativo}
                    onCheckedChange={(checked) => handleInputChange("ativo", checked)}
                    disabled={salvando}
                  />
                </div>
              </div>

              {/* Mensagem de erro */}
              {erro && (
                <Alert className="border-[#FB8281]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-[#FB8281]">
                    {erro}
                  </AlertDescription>
                </Alert>
              )}

              {/* Botões */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  onClick={onVoltar}
                  variant="outline"
                  className="border-[#8B8C7E] text-[#8B8C7E] hover:bg-[#8B8C7E]/10"
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#4AC5BB] hover:bg-[#3A9B94] text-white"
                  disabled={salvando}
                >
                  {salvando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Produto
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Dica */}
        <div className="mt-6 max-w-2xl mx-auto">
          <Alert className="border-[#3599B8]">
            <AlertCircle className="h-4 w-4 text-[#3599B8]" />
            <AlertDescription className="text-[#5F6B6D]">
              <strong>Dica:</strong> Preencha o código de barras para facilitar a busca durante os inventários. 
              Produtos compartilhados entre lojas facilitam a gestão centralizada.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Scanner de Código de Barras */}
      <BarcodeScanner
        isOpen={scannerAberto}
        onClose={() => setScannerAberto(false)}
        onScanned={handleCodigoEscaneado}
      />
    </div>
  )
}