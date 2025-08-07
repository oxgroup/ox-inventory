"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Package, CheckCircle, XCircle, Clock, MapPin, User, Calendar, FileText, AlertTriangle } from "lucide-react"
import { requisicoesService, STATUS_COLORS, STATUS_LABELS, type Requisicao, type Usuario } from "../../shared/lib/requisicoes-service"

interface DetalhesRequisicaoProps {
  requisicao: Requisicao
  usuario: Usuario
  onVoltar: () => void
  onAtualizar: () => void
}

export function DetalhesRequisicao({ requisicao: requisicaoInicial, usuario, onVoltar, onAtualizar }: DetalhesRequisicaoProps) {
  const [requisicao, setRequisicao] = useState<Requisicao>(requisicaoInicial)
  const [carregando, setCarregando] = useState(false)
  const [dialogCancelar, setDialogCancelar] = useState(false)
  const [dialogConfirmar, setDialogConfirmar] = useState(false)

  useEffect(() => {
    // Buscar dados atualizados da requisição
    recarregarRequisicao()
  }, [])

  const recarregarRequisicao = async () => {
    try {
      setCarregando(true)
      const requisicaoAtualizada = await requisicoesService.buscarPorId(requisicao.id)
      setRequisicao(requisicaoAtualizada)
    } catch (error) {
      console.error("Erro ao recarregar requisição:", error)
    } finally {
      setCarregando(false)
    }
  }

  const podeGerenciarEstoque = usuario.permissoes?.includes("editar") || usuario.permissoes?.includes("excluir")
  const podeExcluir = usuario.permissoes?.includes("excluir")
  const ehSolicitante = requisicao.usuario_solicitante_id === usuario.id
  
  const podeCancelar = podeExcluir || (ehSolicitante && requisicao.status === "pendente")
  const podeConfirmarRecebimento = ehSolicitante && requisicao.status === "entregue"

  const cancelarRequisicao = async () => {
    try {
      setCarregando(true)
      await requisicoesService.cancelar(requisicao.id)
      await recarregarRequisicao()
      onAtualizar()
      setDialogCancelar(false)
    } catch (error) {
      console.error("Erro ao cancelar requisição:", error)
      alert("Erro ao cancelar requisição")
    } finally {
      setCarregando(false)
    }
  }

  const confirmarRecebimento = async () => {
    try {
      setCarregando(true)
      await requisicoesService.confirmarRecebimento(requisicao.id)
      await recarregarRequisicao()
      onAtualizar()
      setDialogConfirmar(false)
    } catch (error) {
      console.error("Erro ao confirmar recebimento:", error)
      alert("Erro ao confirmar recebimento")
    } finally {
      setCarregando(false)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
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
          <p className="text-[#5F6B6D] font-medium">Carregando detalhes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg border-2 border-[#fabd07] p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" onClick={onVoltar} className="text-[#000000] hover:bg-[#fabd07]/10 p-2">
              <ArrowLeft className="w-5 h-5 mr-1" />
              Voltar
            </Button>
            <h1 className="text-lg font-bold text-[#000000]">Detalhes da Requisição</h1>
            <div className="w-16"></div>
          </div>

          {/* Informações principais */}
          <div className="bg-[#F4DDAE] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[#5F6B6D] font-medium text-sm">Número:</span>
                <span className="text-[#000000] ml-1 font-mono text-sm">{requisicao.numero_requisicao}</span>
              </div>
              <Badge className={`${STATUS_COLORS.requisicao[requisicao.status]} text-xs`}>
                {STATUS_LABELS.requisicao[requisicao.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-[#5F6B6D] mr-2" />
                <span className="text-[#5F6B6D] font-medium">Setor:</span>
                <span className="text-[#000000] ml-1 font-semibold">{requisicao.setor_solicitante}</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 text-[#5F6B6D] mr-2" />
                <span className="text-[#5F6B6D] font-medium">Solicitante:</span>
                <span className="text-[#000000] ml-1">{requisicao.usuario_solicitante?.nome}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-[#5F6B6D] mr-2" />
                <span className="text-[#5F6B6D] font-medium">Criado:</span>
                <span className="text-[#000000] ml-1">{formatarData(requisicao.data_criacao)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline de Status */}
        <Card className="border-2 border-[#3599B8]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#000000] text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Criada */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#fabd07] rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#000000]">Requisição Criada</div>
                <div className="text-xs text-[#5F6B6D]">{formatarData(requisicao.data_criacao)}</div>
              </div>
            </div>

            {/* Separada */}
            {requisicao.data_separacao && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#3599B8] rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#000000]">Itens Separados</div>
                  <div className="text-xs text-[#5F6B6D]">{formatarData(requisicao.data_separacao)}</div>
                  {requisicao.usuario_separacao?.nome && (
                    <div className="text-xs text-[#8B8C7E]">por {requisicao.usuario_separacao.nome}</div>
                  )}
                </div>
              </div>
            )}

            {/* Entregue */}
            {requisicao.data_entrega && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#fabd07] rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#000000]">Entregue no Setor</div>
                  <div className="text-xs text-[#5F6B6D]">{formatarData(requisicao.data_entrega)}</div>
                  {requisicao.usuario_entrega?.nome && (
                    <div className="text-xs text-[#8B8C7E]">por {requisicao.usuario_entrega.nome}</div>
                  )}
                </div>
              </div>
            )}

            {/* Confirmado */}
            {requisicao.data_confirmacao && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#4AC5BB] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#000000]">Recebimento Confirmado</div>
                  <div className="text-xs text-[#5F6B6D]">{formatarData(requisicao.data_confirmacao)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo dos Itens */}
        <Card className="border-2 border-[#C9B07A]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#000000] text-lg flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Resumo dos Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div>
                <div className="text-2xl font-bold text-[#fabd07]">{requisicao.total_itens}</div>
                <div className="text-xs text-[#5F6B6D]">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#F4D25A]">{requisicao.itens_pendentes}</div>
                <div className="text-xs text-[#5F6B6D]">Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Itens */}
        <Card className="border border-[#DFBFBF]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#000000] text-lg">Itens da Requisição</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requisicao.itens_requisicao?.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-lg border border-[#DFBFBF] hover:border-[#C9B07A] transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-[#000000] text-sm flex items-center justify-between">
                        <span>{item.produto_nome}</span>
                        <Badge className={`${obterCorItem(item.status)} text-xs`}>
                          {obterLabelItem(item.status)}
                        </Badge>
                      </div>
                      <div className="text-xs text-[#5F6B6D] mt-1">
                        {item.produto_categoria} • {item.produto_unidade}
                        {item.produto_cod_item && ` • ${item.produto_cod_item}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-[#5F6B6D] space-y-1">
                    <div>Solicitado: {item.quantidade_solicitada} {item.produto_unidade}</div>
                    {item.quantidade_separada > 0 && (
                      <div>Separado: {item.quantidade_separada} {item.produto_unidade}</div>
                    )}
                    {item.quantidade_entregue > 0 && (
                      <div>Entregue: {item.quantidade_entregue} {item.produto_unidade}</div>
                    )}
                    {item.observacoes_item && (
                      <div className="text-[#8B8C7E] italic">Obs: {item.observacoes_item}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {requisicao.observacoes && (
          <Card className="border border-[#DFBFBF]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#000000] text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#5F6B6D] text-sm whitespace-pre-wrap">{requisicao.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="space-y-3">
          {podeConfirmarRecebimento && (
            <Button
              onClick={() => setDialogConfirmar(true)}
              className="w-full h-12 bg-[#4AC5BB] hover:bg-[#3599B8] text-white font-semibold rounded-xl"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Recebimento
            </Button>
          )}

          {podeCancelar && requisicao.status !== "cancelado" && (
            <Button
              onClick={() => setDialogCancelar(true)}
              variant="outline"
              className="w-full h-12 border-[#FB8281] text-[#FB8281] hover:bg-[#FB8281]/10 font-semibold rounded-xl"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Cancelar Requisição
            </Button>
          )}
        </div>

        {/* Dialog Cancelar */}
        <Dialog open={dialogCancelar} onOpenChange={setDialogCancelar}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-[#FB8281]">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Cancelar Requisição
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-[#000000]">
                Tem certeza que deseja cancelar a requisição <strong>{requisicao.numero_requisicao}</strong>?
              </p>
              <div className="bg-[#FB8281]/10 p-3 rounded-lg">
                <p className="text-sm text-[#FB8281]">
                  ⚠️ Esta ação não pode ser desfeita. A requisição será marcada como cancelada.
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col space-y-2">
              <Button onClick={cancelarRequisicao} className="w-full bg-[#FB8281] hover:bg-[#FB8281]/80 text-white">
                <XCircle className="w-4 h-4 mr-2" />
                Sim, Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogCancelar(false)}
                className="w-full border-[#C9B07A] text-[#000000] hover:bg-[#F4DDAE]"
              >
                Não, Manter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Confirmar */}
        <Dialog open={dialogConfirmar} onOpenChange={setDialogConfirmar}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-[#4AC5BB]">
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirmar Recebimento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-[#000000]">
                Confirma que recebeu todos os itens da requisição <strong>{requisicao.numero_requisicao}</strong>?
              </p>
              <div className="bg-[#F4DDAE] p-3 rounded-lg text-sm">
                <div className="text-[#000000] space-y-1">
                  <div><strong>Setor:</strong> {requisicao.setor_solicitante}</div>
                  <div><strong>Total de itens:</strong> {requisicao.itens_entregues}</div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col space-y-2">
              <Button onClick={confirmarRecebimento} className="w-full bg-[#4AC5BB] hover:bg-[#3599B8] text-white">
                <CheckCircle className="w-4 h-4 mr-2" />
                Sim, Confirmar
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogConfirmar(false)}
                className="w-full border-[#C9B07A] text-[#000000] hover:bg-[#F4DDAE]"
              >
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}