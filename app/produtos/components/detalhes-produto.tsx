"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit2, Save, X, Package, AlertCircle, Check, Trash2, Camera } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { produtoService, type Produto } from "../../shared/lib/supabase"
import type { Usuario } from "../../shared/lib/auth"
import { BarcodeScanner } from "../../inventory/components/barcode-scanner"

interface DetalhesProdutoProps {
  produto: Produto
  usuario: Usuario
  onVoltar: () => void
  onProdutoAtualizado: () => void
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

export function DetalhesProduto({ produto, usuario, onVoltar, onProdutoAtualizado }: DetalhesProdutoProps) {
  const [modoEdicao, setModoEdicao] = useState(false)
  const [formData, setFormData] = useState<Produto>({...produto})
  const [categoriaNova, setCategoriaNova] = useState("")
  const [unidadeNova, setUnidadeNova] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [dialogExclusao, setDialogExclusao] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [scannerAberto, setScannerAberto] = useState(false)

  const handleSalvar = async () => {
    setErro("")
    setSucesso("")

    // Validações
    if (!formData.nome.trim()) {
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
      
      const produtoAtualizado = {
        ...formData,
        nome: formData.nome.trim(),
        categoria: categoria,
        unidade: unidade,
        cod_item: formData.cod_item?.trim() || undefined,
        codigo_barras: formData.codigo_barras?.trim() || undefined
      }

      await produtoService.atualizar(produto.id, produtoAtualizado)
      
      setSucesso("Produto atualizado com sucesso!")
      setModoEdicao(false)
      setCategoriaNova("")
      setUnidadeNova("")
      onProdutoAtualizado()
      
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error)
      setErro(error.message || "Erro ao atualizar produto")
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async () => {
    try {
      setExcluindo(true)
      // Nota: Como não temos método de exclusão no service, vamos desativar o produto
      await produtoService.atualizar(produto.id, { ativo: false })
      onProdutoAtualizado()
      onVoltar()
    } catch (error: any) {
      console.error("Erro ao desativar produto:", error)
      setErro(error.message || "Erro ao desativar produto")
    } finally {
      setExcluindo(false)
      setDialogExclusao(false)
    }
  }

  const handleCancelar = () => {
    setFormData({...produto})
    setCategoriaNova("")
    setUnidadeNova("")
    setModoEdicao(false)
    setErro("")
    setSucesso("")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE]">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="space-y-4 mb-6">
          {/* Botão Voltar */}
          <div>
            <Button
              onClick={onVoltar}
              variant="outline"
              className="border-[#3599B8] text-[#3599B8] hover:bg-[#3599B8]/10"
              disabled={salvando || excluindo}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Título e Info do Produto */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#000000] flex items-center gap-2 mb-2">
              📦 {produto.nome}
            </h1>
            
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge 
                className={produto.ativo 
                  ? "bg-[#97C93D] text-white hover:bg-[#7BA82E]" 
                  : "bg-[#FB8281] text-white hover:bg-[#FA6B6A]"}
              >
                {produto.ativo ? "Ativo" : "Inativo"}
              </Badge>
              <Badge variant="outline" className="border-[#C9B07A] text-[#C9B07A]">
                {produto.categoria}
              </Badge>
            </div>

            {/* Botões de Ação - Mobile: Full width, Desktop: Inline */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {!modoEdicao ? (
                <>
                  <Button
                    onClick={() => setModoEdicao(true)}
                    className="bg-[#3599B8] hover:bg-[#2A7A96] text-white w-full sm:w-auto"
                    size="sm"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => setDialogExclusao(true)}
                    variant="outline"
                    className="border-[#FB8281] text-[#FB8281] hover:bg-[#FB8281]/10 w-full sm:w-auto"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Desativar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleCancelar}
                    variant="outline"
                    className="border-[#8B8C7E] text-[#8B8C7E] hover:bg-[#8B8C7E]/10 w-full sm:w-auto"
                    disabled={salvando}
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSalvar}
                    className="bg-[#4AC5BB] hover:bg-[#3A9B94] text-white w-full sm:w-auto"
                    disabled={salvando}
                    size="sm"
                  >
                    {salvando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mensagens */}
        {erro && (
          <Alert className="border-[#FB8281] mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-[#FB8281]">
              {erro}
            </AlertDescription>
          </Alert>
        )}

        {sucesso && (
          <Alert className="border-[#97C93D] mb-6">
            <Check className="h-4 w-4 text-[#97C93D]" />
            <AlertDescription className="text-[#97C93D]">
              {sucesso}
            </AlertDescription>
          </Alert>
        )}

        {/* Detalhes do Produto */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card className="border-2 border-[#fabd07] shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#000000] flex items-center gap-2">
                <Package className="w-5 h-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label className="text-[#5F6B6D] font-medium">Nome do Produto</Label>
                {modoEdicao ? (
                  <Input
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    className="border-[#3599B8] focus:border-[#fabd07]"
                    disabled={salvando}
                  />
                ) : (
                  <p className="text-[#000000] font-medium p-2 bg-gray-50 rounded border">
                    {produto.nome}
                  </p>
                )}
              </div>

              {/* Código do Item */}
              <div className="space-y-2">
                <Label className="text-[#5F6B6D] font-medium">Código do Item</Label>
                {modoEdicao ? (
                  <Input
                    value={formData.cod_item || ""}
                    onChange={(e) => handleInputChange("cod_item", e.target.value)}
                    className="border-[#3599B8] focus:border-[#fabd07]"
                    disabled={salvando}
                    placeholder="Ex: CARNE001"
                  />
                ) : (
                  <p className="text-[#000000] p-2 bg-gray-50 rounded border">
                    {produto.cod_item || "Não informado"}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Categoria */}
                <div className="space-y-2">
                  <Label className="text-[#5F6B6D] font-medium">Categoria</Label>
                  {modoEdicao ? (
                    <div className="space-y-2">
                      <Select 
                        value={categoriaNova.trim() || formData.categoria} 
                        onValueChange={(value) => {
                          handleInputChange("categoria", value)
                          setCategoriaNova("")
                        }}
                        disabled={salvando}
                      >
                        <SelectTrigger className="border-[#3599B8] focus:border-[#fabd07]">
                          <SelectValue placeholder={formData.categoria || "Selecione uma categoria"} />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Categoria atual se não estiver na lista */}
                          {formData.categoria && !CATEGORIAS_SUGERIDAS.includes(formData.categoria) && (
                            <SelectItem key={formData.categoria} value={formData.categoria}>
                              {formData.categoria}
                            </SelectItem>
                          )}
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
                        placeholder="Nova categoria..."
                        className="border-[#C9B07A] focus:border-[#fabd07] text-sm"
                        disabled={salvando}
                      />
                    </div>
                  ) : (
                    <p className="text-[#000000] p-2 bg-gray-50 rounded border">
                      {produto.categoria}
                    </p>
                  )}
                </div>

                {/* Unidade */}
                <div className="space-y-2">
                  <Label className="text-[#5F6B6D] font-medium">Unidade</Label>
                  {modoEdicao ? (
                    <div className="space-y-2">
                      <Select 
                        value={unidadeNova.trim() || formData.unidade} 
                        onValueChange={(value) => {
                          handleInputChange("unidade", value)
                          setUnidadeNova("")
                        }}
                        disabled={salvando}
                      >
                        <SelectTrigger className="border-[#3599B8] focus:border-[#fabd07]">
                          <SelectValue placeholder={formData.unidade || "Selecione uma unidade"} />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Unidade atual se não estiver na lista */}
                          {formData.unidade && !UNIDADES_SUGERIDAS.includes(formData.unidade) && (
                            <SelectItem key={formData.unidade} value={formData.unidade}>
                              {formData.unidade}
                            </SelectItem>
                          )}
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
                        placeholder="Nova unidade..."
                        className="border-[#C9B07A] focus:border-[#fabd07] text-sm"
                        disabled={salvando}
                      />
                    </div>
                  ) : (
                    <p className="text-[#000000] p-2 bg-gray-50 rounded border">
                      {produto.unidade}
                    </p>
                  )}
                </div>
              </div>

              {/* Código de Barras */}
              <div className="space-y-2">
                <Label className="text-[#5F6B6D] font-medium">Código de Barras</Label>
                {modoEdicao ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={formData.codigo_barras || ""}
                        onChange={(e) => handleInputChange("codigo_barras", e.target.value)}
                        className="border-[#3599B8] focus:border-[#fabd07] flex-1"
                        disabled={salvando}
                        placeholder="13 dígitos (EAN-13)"
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
                ) : (
                  <p className="text-[#000000] p-2 bg-gray-50 rounded border font-mono">
                    {produto.codigo_barras || "Não informado"}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-[#F4DDAE]/20 rounded-lg border border-[#C9B07A]">
                <div>
                  <Label className="text-[#5F6B6D] font-medium">Status</Label>
                  <p className="text-sm text-[#8B8C7E]">
                    Produto {modoEdicao ? "será" : "está"} {formData.ativo ? "ativo" : "inativo"}
                  </p>
                </div>
                {modoEdicao ? (
                  <Switch
                    checked={formData.ativo}
                    onCheckedChange={(checked) => handleInputChange("ativo", checked)}
                    disabled={salvando}
                  />
                ) : (
                  <div className={`w-3 h-3 rounded-full ${produto.ativo ? 'bg-[#97C93D]' : 'bg-[#FB8281]'}`}></div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card className="border-2 border-[#3599B8] shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#000000]">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-[#5F6B6D] font-medium">ID do Produto:</span>
                  <span className="text-[#000000] font-mono text-sm">{produto.id}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-[#5F6B6D] font-medium">Loja:</span>
                  <span className="text-[#000000]">Loja {produto.loja_id}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-[#5F6B6D] font-medium">Status:</span>
                  <Badge 
                    className={produto.ativo 
                      ? "bg-[#97C93D] text-white" 
                      : "bg-[#FB8281] text-white"}
                  >
                    {produto.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-[#5F6B6D] font-medium">Código de barras:</span>
                  <span className="text-[#000000]">
                    {produto.codigo_barras ? "Configurado" : "Não configurado"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={dialogExclusao} onOpenChange={setDialogExclusao}>
        <DialogContent className="border-2 border-[#FB8281]">
          <DialogHeader>
            <DialogTitle className="text-[#FB8281] flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Confirmar Desativação
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[#5F6B6D] mb-4">
              Tem certeza de que deseja desativar o produto <strong>{produto.nome}</strong>?
            </p>
            <Alert className="border-[#FB8281]">
              <AlertCircle className="h-4 w-4 text-[#FB8281]" />
              <AlertDescription className="text-[#5F6B6D]">
                O produto será desativado e não aparecerá mais nos inventários e requisições. 
                Esta ação pode ser revertida posteriormente.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setDialogExclusao(false)}
              variant="outline"
              className="border-[#8B8C7E] text-[#8B8C7E] hover:bg-[#8B8C7E]/10"
              disabled={excluindo}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExcluir}
              className="bg-[#FB8281] hover:bg-[#FA6B6A] text-white"
              disabled={excluindo}
            >
              {excluindo ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Desativando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Desativar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scanner de Código de Barras */}
      <BarcodeScanner
        isOpen={scannerAberto}
        onClose={() => setScannerAberto(false)}
        onScanned={handleCodigoEscaneado}
      />
    </div>
  )
}