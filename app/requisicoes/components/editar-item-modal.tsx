"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertCircle, Edit, Save } from "lucide-react"
import type { ItemRequisicao } from "../../shared/lib/requisicoes-service"

interface EditarItemModalProps {
  item: ItemRequisicao | null
  isOpen: boolean
  onClose: () => void
  onSave: (itemId: string, novaQuantidade: number, observacoes: string) => Promise<void>
  contexto: "entrega" | "recebimento" // Para definir regras de validação
}

export function EditarItemModal({ item, isOpen, onClose, onSave, contexto }: EditarItemModalProps) {
  const [novaQuantidade, setNovaQuantidade] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    if (item) {
      setNovaQuantidade(item.quantidade_solicitada.toString())
      setObservacoes(item.observacoes_item || "")
      setErro("")
    }
  }, [item])

  const validarQuantidade = (quantidade: number): string | null => {
    if (quantidade <= 0) {
      return "Quantidade deve ser maior que zero"
    }

    if (contexto === "entrega") {
      // Na entrega: nova quantidade deve ser >= quantidade já separada
      if (item && quantidade < item.quantidade_separada) {
        return `Quantidade não pode ser menor que a já separada (${item.quantidade_separada} ${item.produto_unidade})`
      }
    } else if (contexto === "recebimento") {
      // No recebimento: nova quantidade deve ser <= quantidade entregue
      if (item && quantidade > item.quantidade_entregue) {
        return `Quantidade não pode ser maior que a entregue (${item.quantidade_entregue} ${item.produto_unidade})`
      }
    }

    return null
  }

  const handleSave = async () => {
    if (!item) return

    const quantidade = Number.parseFloat(novaQuantidade)
    
    // Validações
    if (isNaN(quantidade)) {
      setErro("Digite uma quantidade válida")
      return
    }

    const erroValidacao = validarQuantidade(quantidade)
    if (erroValidacao) {
      setErro(erroValidacao)
      return
    }

    if (!observacoes.trim()) {
      setErro("Observações são obrigatórias para justificar a alteração")
      return
    }

    try {
      setCarregando(true)
      setErro("")
      await onSave(item.id, quantidade, observacoes.trim())
      onClose()
    } catch (error: any) {
      setErro(error.message || "Erro ao salvar alteração")
    } finally {
      setCarregando(false)
    }
  }

  const handleClose = () => {
    if (!carregando) {
      onClose()
    }
  }

  const obterLimiteTexto = () => {
    if (!item) return ""
    
    if (contexto === "entrega") {
      return `Mín: ${item.quantidade_separada} ${item.produto_unidade} (já separado)`
    } else {
      return `Máx: ${item.quantidade_entregue} ${item.produto_unidade} (entregue)`
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-[#fabd07]">
            <Edit className="w-5 h-5 mr-2" />
            Editar Quantidade
          </DialogTitle>
        </DialogHeader>

        {item && (
          <div className="space-y-4">
            {/* Informações do Item */}
            <div className="bg-[#F4DDAE] p-3 rounded-lg">
              <div className="font-semibold text-[#000000] text-sm mb-1">
                {item.produto_nome}
              </div>
              <div className="text-xs text-[#5F6B6D] space-y-1">
                <div>Categoria: {item.produto_categoria}</div>
                <div>Código: {item.produto_cod_item}</div>
                <div>Quantidade Original: {item.quantidade_solicitada} {item.produto_unidade}</div>
                {contexto === "entrega" && (
                  <div>Quantidade Separada: {item.quantidade_separada} {item.produto_unidade}</div>
                )}
                {contexto === "recebimento" && (
                  <div>Quantidade Entregue: {item.quantidade_entregue} {item.produto_unidade}</div>
                )}
              </div>
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <div className="p-3 bg-[#FB8281]/10 border border-[#FB8281] rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-[#FB8281] mr-2" />
                  <span className="text-sm text-[#FB8281]">{erro}</span>
                </div>
              </div>
            )}

            {/* Campo Nova Quantidade */}
            <div className="space-y-2">
              <label className="text-[#000000] font-semibold text-sm">
                Nova Quantidade *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={novaQuantidade}
                onChange={(e) => setNovaQuantidade(e.target.value)}
                className="h-10 border-2 border-[#C9B07A] focus:border-[#fabd07]"
              />
              <div className="text-xs text-[#5F6B6D]">
                {item.produto_unidade} • {obterLimiteTexto()}
              </div>
            </div>

            {/* Campo Observações */}
            <div className="space-y-2">
              <label className="text-[#000000] font-semibold text-sm">
                Motivo da Alteração *
              </label>
              <Textarea
                placeholder="Explique o motivo da alteração da quantidade..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="border-2 border-[#C9B07A] focus:border-[#fabd07] min-h-[80px]"
              />
              <div className="text-xs text-[#5F6B6D]">
                Campo obrigatório para auditoria
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col space-y-2">
          <Button
            onClick={handleSave}
            disabled={carregando}
            className="w-full bg-[#fabd07] hover:bg-[#b58821] text-white"
          >
            {carregando ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alteração
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={carregando}
            className="w-full border-[#C9B07A] text-[#000000] hover:bg-[#F4DDAE]"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}