"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Package, Check, X, AlertTriangle, Clock, Barcode, Search } from "lucide-react"
import { BarcodeScanner } from "../../inventory/components/barcode-scanner"
import { requisicoesService, STATUS_COLORS, STATUS_LABELS, type Requisicao, type ItemRequisicao, type Usuario } from "../../shared/lib/requisicoes-service"

interface SepararItensProps {
  usuario: Usuario
  onVoltar: () => void
  onAtualizar: () => void
}

export function SepararItens({ usuario, onVoltar, onAtualizar }: SepararItensProps) {
  const [requisicoesPendentes, setRequisicoesPendentes] = useState<Requisicao[]>([])
  const [requisicaoSelecionada, setRequisicaoSelecionada] = useState<Requisicao | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  
  // Estados para separação
  const [itemSeparando, setItemSeparando] = useState<ItemRequisicao | null>(null)
  const [quantidadeSeparada, setQuantidadeSeparada] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [dialogSeparar, setDialogSeparar] = useState(false)
  const [dialogEmFalta, setDialogEmFalta] = useState(false)
  
  // Scanner
  const [scannerAberto, setScannerAberto] = useState(false)
  const [filtroScanner, setFiltroScanner] = useState("")

  useEffect(() => {
    carregarRequisicoesPendentes()
  }, [])

  const carregarRequisicoesPendentes = async () => {
    try {
      setCarregando(true)
      const requisicoes = await requisicoesService.listar({
        loja_id: usuario.loja_id,
        status: "pendente"
      })
      setRequisicoesPendentes(requisicoes)
    } catch (error) {
      console.error("Erro ao carregar requisições pendentes:", error)
      alert("Erro ao carregar requisições pendentes")
    } finally {
      setCarregando(false)
    }
  }

  const selecionarRequisicao = async (requisicao: Requisicao) => {
    try {
      setCarregando(true)
      // Buscar dados completos da requisição
      const requisicaoCompleta = await requisicoesService.buscarPorId(requisicao.id)
      setRequisicaoSelecionada(requisicaoCompleta)
    } catch (error) {
      console.error("Erro ao carregar requisição:", error)
      alert("Erro ao carregar detalhes da requisição")
    } finally {
      setCarregando(false)
    }
  }

  const abrirDialogSeparar = (item: ItemRequisicao) => {
    setItemSeparando(item)
    setQuantidadeSeparada(item.quantidade_solicitada.toString())
    setObservacoes("")
    setDialogSeparar(true)
  }

  const abrirDialogEmFalta = (item: ItemRequisicao) => {
    setItemSeparando(item)
    setObservacoes("")
    setDialogEmFalta(true)
  }

  const separarItem = async () => {
    if (!itemSeparando) return

    const qtd = Number.parseFloat(quantidadeSeparada)
    if (!qtd || qtd <= 0) {
      alert("Quantidade deve ser maior que zero")
      return
    }

    if (qtd > itemSeparando.quantidade_solicitada) {
      alert("Quantidade separada não pode ser maior que a solicitada")
      return
    }

    try {
      setProcessando(true)
      await requisicoesService.separarItem(itemSeparando.id, qtd, observacoes || undefined)
      
      // Atualizar dados
      await selecionarRequisicao(requisicaoSelecionada!)
      await carregarRequisicoesPendentes()
      onAtualizar()
      
      setDialogSeparar(false)
      setItemSeparando(null)
    } catch (error) {
      console.error("Erro ao separar item:", error)
      alert("Erro ao separar item")
    } finally {
      setProcessando(false)
    }
  }

  const marcarEmFalta = async () => {
    if (!itemSeparando) return

    try {
      setProcessando(true)
      await requisicoesService.marcarEmFalta(itemSeparando.id, observacoes || undefined)
      
      // Atualizar dados
      await selecionarRequisicao(requisicaoSelecionada!)
      await carregarRequisicoesPendentes()
      onAtualizar()
      
      setDialogEmFalta(false)
      setItemSeparando(null)
    } catch (error) {
      console.error("Erro ao marcar item em falta:", error)
      alert("Erro ao marcar item em falta")
    } finally {
      setProcessando(false)
    }
  }

  const handleBarcodeScanned = async (codigo: string) => {
    setScannerAberto(false)
    
    if (!requisicaoSelecionada) return

    // Buscar item na requisição pelo código de barras
    const item = requisicaoSelecionada.itens_requisicao?.find(
      item => item.produto_cod_item === codigo && item.status === "pendente"
    )

    if (item) {
      abrirDialogSeparar(item)
    } else {
      alert("Produto não encontrado nesta requisição ou já foi processado")
    }
  }

  const obterCorItem = (status: string) => {
    return STATUS_COLORS.item[status as keyof typeof STATUS_COLORS.item] || "bg-gray-500 text-white"
  }

  const obterLabelItem = (status: string) => {
    return STATUS_LABELS.item[status as keyof typeof STATUS_LABELS.item] || status
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fabd07] mx-auto"></div>
          <p className="text-[#5F6B6D] font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  // Lista de requisições pendentes
  if (!requisicaoSelecionada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between py-4">
            <Button variant="ghost" onClick={onVoltar} className="text-[#000000] hover:bg-white/20">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-[#000000]">Separar Itens</h1>
            <div className="w-20"></div>
          </div>

          {/* Estatísticas */}
          <Card className="border-2 border-[#F4D25A]">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#F4D25A]">{requisicoesPendentes.length}</div>
                <div className="text-sm text-[#5F6B6D]">Requisições Pendentes</div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Requisições */}
          <div className="space-y-3">
            {requisicoesPendentes.map((requisicao) => (
              <Card key={requisicao.id} className="border border-[#C9B07A] shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="font-semibold text-[#000000] text-sm">
                          {requisicao.numero_requisicao}
                        </span>
                        <Badge className="bg-[#F4D25A] text-[#000000] text-xs ml-2">
                          Pendente
                        </Badge>
                      </div>
                      <div className="text-xs text-[#5F6B6D] space-y-1">
                        <div>🏢 Setor: {requisicao.setor_solicitante}</div>
                        <div>👤 {requisicao.usuario_solicitante?.nome}</div>
                        <div>📦 {requisicao.total_itens} itens ({requisicao.itens_pendentes} pendentes)</div>
                        <div>📅 {new Date(requisicao.data_criacao).toLocaleDateString("pt-BR")}</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => selecionarRequisicao(requisicao)}
                    className="w-full bg-[#F4D25A] hover:bg-[#b58821] text-[#000000] h-10 text-sm font-semibold"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Separar Itens
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {requisicoesPendentes.length === 0 && (
            <Card className="border border-[#DFBFBF]">
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-[#8B8C7E] mx-auto mb-4" />
                <h3 className="font-semibold text-[#000000] mb-2">Nenhuma requisição pendente</h3>
                <p className="text-[#5F6B6D] text-sm">Todas as requisições foram processadas.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Separação de itens da requisição selecionada
  const itensPendentes = requisicaoSelecionada.itens_requisicao?.filter(item => item.status === "pendente") || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg border-2 border-[#F4D25A] p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              onClick={() => setRequisicaoSelecionada(null)}
              className="text-[#000000] hover:bg-[#F4D25A]/10 p-2"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Voltar
            </Button>
            <h1 className="text-lg font-bold text-[#000000]">Separar Itens</h1>
            <div className="w-16"></div>
          </div>

          <div className="bg-[#F4DDAE] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#5F6B6D] font-medium text-sm">Requisição:</span>
              <span className="text-[#000000] font-mono text-sm">{requisicaoSelecionada.numero_requisicao}</span>
            </div>
            <div className="text-sm">
              <div>🏢 <strong>Setor:</strong> {requisicaoSelecionada.setor_solicitante}</div>
              <div>👤 <strong>Solicitante:</strong> {requisicaoSelecionada.usuario_solicitante?.nome}</div>
              <div>📦 <strong>Pendentes:</strong> {itensPendentes.length} de {requisicaoSelecionada.total_itens}</div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <Card className="border-2 border-[#3599B8]">
          <CardContent className="p-4">
            <Button
              onClick={() => setScannerAberto(true)}
              className="w-full bg-[#3599B8] hover:bg-[#4AC5BB] text-white h-12"
            >
              <Barcode className="w-5 h-5 mr-2" />
              Scanner para Separação
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Itens Pendentes */}
        <div className="space-y-3">
          {itensPendentes.map((item) => (
            <Card key={item.id} className="border border-[#C9B07A] shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="font-semibold text-[#000000] text-sm flex items-center justify-between">
                      <span>{item.produto_nome}</span>
                      <Badge className={`${obterCorItem(item.status)} text-xs`}>
                        {obterLabelItem(item.status)}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#5F6B6D] mt-1">
                      {item.produto_categoria} • {item.produto_unidade}
                      {item.produto_cod_item && (
                        <span className="font-mono ml-2 bg-[#8B8C7E] text-white px-1 rounded">
                          {item.produto_cod_item}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#000000] font-medium mt-2">
                      Quantidade: {item.quantidade_solicitada} {item.produto_unidade}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#DFBFBF]">
                  <Button
                    onClick={() => abrirDialogSeparar(item)}
                    size="sm"
                    className="bg-[#4AC5BB] hover:bg-[#3599B8] text-white h-10 text-xs"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Separar
                  </Button>
                  <Button
                    onClick={() => abrirDialogEmFalta(item)}
                    size="sm"
                    variant="outline"
                    className="border-[#FB8281] text-[#FB8281] hover:bg-[#FB8281]/10 h-10 text-xs"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Em Falta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {itensPendentes.length === 0 && (
          <Card className="border border-[#DFBFBF]">
            <CardContent className="p-8 text-center">
              <Check className="w-12 h-12 text-[#4AC5BB] mx-auto mb-4" />
              <h3 className="font-semibold text-[#000000] mb-2">Todos os itens foram processados</h3>
              <p className="text-[#5F6B6D] text-sm">Esta requisição está pronta para entrega.</p>
            </CardContent>
          </Card>
        )}

        {/* Dialog Separar */}
        <Dialog open={dialogSeparar} onOpenChange={setDialogSeparar}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-[#4AC5BB]">
                <Check className="w-5 h-5 mr-2" />
                Separar Item
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-[#F4DDAE] p-3 rounded-lg">
                <div className="font-semibold text-[#000000] text-sm">{itemSeparando?.produto_nome}</div>
                <div className="text-xs text-[#5F6B6D]">
                  {itemSeparando?.produto_categoria} • {itemSeparando?.produto_unidade}
                </div>
                <div className="text-xs text-[#000000] mt-1">
                  Solicitado: {itemSeparando?.quantidade_solicitada} {itemSeparando?.produto_unidade}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#000000]">Quantidade Separada *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={itemSeparando?.quantidade_solicitada}
                  value={quantidadeSeparada}
                  onChange={(e) => setQuantidadeSeparada(e.target.value)}
                  className="h-10 border-2 border-[#C9B07A] focus:border-[#4AC5BB]"
                />
                <div className="text-xs text-[#5F6B6D]">
                  Máximo: {itemSeparando?.quantidade_solicitada} {itemSeparando?.produto_unidade}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#000000]">Observações</label>
                <Textarea
                  placeholder="Informações adicionais sobre a separação..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="border-2 border-[#C9B07A] focus:border-[#4AC5BB] min-h-[60px]"
                />
              </div>
            </div>
            <DialogFooter className="flex-col space-y-2">
              <Button
                onClick={separarItem}
                disabled={processando}
                className="w-full bg-[#4AC5BB] hover:bg-[#3599B8] text-white"
              >
                {processando ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Separando...
                  </div>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Separação
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogSeparar(false)}
                className="w-full border-[#C9B07A] text-[#000000] hover:bg-[#F4DDAE]"
              >
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Em Falta */}
        <Dialog open={dialogEmFalta} onOpenChange={setDialogEmFalta}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-[#FB8281]">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Marcar como Em Falta
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-[#F4DDAE] p-3 rounded-lg">
                <div className="font-semibold text-[#000000] text-sm">{itemSeparando?.produto_nome}</div>
                <div className="text-xs text-[#5F6B6D]">
                  {itemSeparando?.produto_categoria} • {itemSeparando?.produto_unidade}
                </div>
                <div className="text-xs text-[#000000] mt-1">
                  Solicitado: {itemSeparando?.quantidade_solicitada} {itemSeparando?.produto_unidade}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#000000]">Motivo da Falta *</label>
                <Textarea
                  placeholder="Ex: Produto em falta no estoque, produto descontinuado..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="border-2 border-[#C9B07A] focus:border-[#FB8281] min-h-[80px]"
                />
              </div>

              <div className="bg-[#FB8281]/10 p-3 rounded-lg">
                <p className="text-sm text-[#FB8281]">
                  ⚠️ Este item será marcado como "Em Falta" e não será entregue.
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col space-y-2">
              <Button
                onClick={marcarEmFalta}
                disabled={processando || !observacoes}
                className="w-full bg-[#FB8281] hover:bg-[#FB8281]/80 text-white"
              >
                {processando ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </div>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Confirmar Em Falta
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogEmFalta(false)}
                className="w-full border-[#C9B07A] text-[#000000] hover:bg-[#F4DDAE]"
              >
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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