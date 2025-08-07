"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, CheckCircle, Package, MapPin, User, Clock, Truck } from "lucide-react"
import { requisicoesService, STATUS_COLORS, STATUS_LABELS, type Requisicao, type Usuario } from "../../shared/lib/requisicoes-service"

interface ConfirmarRecebimentoProps {
  usuario: Usuario
  onVoltar: () => void
  onAtualizar: () => void
}

export function ConfirmarRecebimento({ usuario, onVoltar, onAtualizar }: ConfirmarRecebimentoProps) {
  const [requisicoesEntregues, setRequisicoesEntregues] = useState<Requisicao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [requisicaoConfirmar, setRequisicaoConfirmar] = useState<Requisicao | null>(null)
  const [dialogConfirmar, setDialogConfirmar] = useState(false)

  useEffect(() => {
    carregarRequisicoesEntregues()
  }, [])

  const carregarRequisicoesEntregues = async () => {
    try {
      setCarregando(true)
      // Buscar apenas minhas requisições que foram entregues
      const requisicoes = await requisicoesService.listar({
        loja_id: usuario.loja_id,
        status: "entregue",
        usuario_id: usuario.id // Filtrar por usuário solicitante
      })
      setRequisicoesEntregues(requisicoes)
    } catch (error) {
      console.error("Erro ao carregar requisições entregues:", error)
      alert("Erro ao carregar requisições entregues")
    } finally {
      setCarregando(false)
    }
  }

  const abrirDialogConfirmar = (requisicao: Requisicao) => {
    setRequisicaoConfirmar(requisicao)
    setDialogConfirmar(true)
  }

  const confirmarRecebimento = async () => {
    if (!requisicaoConfirmar) return

    try {
      setProcessando(true)
      await requisicoesService.confirmarRecebimento(requisicaoConfirmar.id)
      
      // Atualizar dados
      await carregarRequisicoesEntregues()
      onAtualizar()
      
      setDialogConfirmar(false)
      setRequisicaoConfirmar(null)
    } catch (error) {
      console.error("Erro ao confirmar recebimento:", error)
      alert("Erro ao confirmar recebimento")
    } finally {
      setProcessando(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <Button variant="ghost" onClick={onVoltar} className="text-[#000000] hover:bg-white/20">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold text-[#000000]">Confirmar Recebimentos</h1>
          <div className="w-20"></div>
        </div>

        {/* Estatísticas */}
        <Card className="border-2 border-[#4AC5BB]">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4AC5BB]">{requisicoesEntregues.length}</div>
              <div className="text-sm text-[#5F6B6D]">Aguardando Confirmação</div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Requisições Entregues */}
        <div className="space-y-3">
          {requisicoesEntregues.map((requisicao) => (
            <Card key={requisicao.id} className="border border-[#C9B07A] shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold text-[#000000] text-sm">
                        {requisicao.numero_requisicao}
                      </span>
                      <Badge className="bg-[#fabd07] text-white text-xs ml-2">
                        Entregue
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-[#5F6B6D] space-y-1 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        Setor: {requisicao.setor_solicitante}
                      </div>
                      <div className="flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        {requisicao.itens_entregues} itens entregues
                      </div>
                      {requisicao.data_entrega && (
                        <div className="flex items-center">
                          <Truck className="w-3 h-3 mr-1" />
                          Entregue: {formatarData(requisicao.data_entrega)}
                        </div>
                      )}
                      {requisicao.usuario_entrega?.nome && (
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          Entregue por: {requisicao.usuario_entrega.nome}
                        </div>
                      )}
                    </div>

                    {/* Resumo dos itens entregues */}
                    {requisicao.itens_requisicao && (
                      <div className="bg-[#F4DDAE] p-2 rounded text-xs">
                        <div className="font-medium text-[#000000] mb-1">Itens recebidos:</div>
                        {requisicao.itens_requisicao
                          .filter(item => item.status === "entregue")
                          .slice(0, 3)
                          .map((item, index) => (
                            <div key={index} className="text-[#5F6B6D]">
                              • {item.produto_nome} ({item.quantidade_entregue} {item.produto_unidade})
                            </div>
                          ))}
                        {requisicao.itens_entregues && requisicao.itens_entregues > 3 && (
                          <div className="text-[#8B8C7E] mt-1">
                            ... e mais {requisicao.itens_entregues - 3} itens
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mostrar itens em falta se houver */}
                    {requisicao.itens_requisicao?.some(item => item.status === "em_falta") && (
                      <div className="bg-[#FB8281]/10 p-2 rounded text-xs mt-2">
                        <div className="font-medium text-[#FB8281] mb-1">Itens em falta:</div>
                        {requisicao.itens_requisicao
                          .filter(item => item.status === "em_falta")
                          .map((item, index) => (
                            <div key={index} className="text-[#FB8281]">
                              • {item.produto_nome}
                              {item.observacoes_item && ` - ${item.observacoes_item}`}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => abrirDialogConfirmar(requisicao)}
                  className="w-full bg-[#4AC5BB] hover:bg-[#3599B8] text-white h-12 font-semibold"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirmar Recebimento
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mensagem quando não há requisições */}
        {requisicoesEntregues.length === 0 && (
          <Card className="border border-[#DFBFBF]">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-[#8B8C7E] mx-auto mb-4" />
              <h3 className="font-semibold text-[#000000] mb-2">Nenhuma entrega pendente</h3>
              <p className="text-[#5F6B6D] text-sm">
                Suas requisições entregues aparecerão aqui para confirmação.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Confirmação */}
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
                Confirma que recebeu todos os itens da requisição <strong>{requisicaoConfirmar?.numero_requisicao}</strong>?
              </p>

              <div className="bg-[#F4DDAE] p-3 rounded-lg text-sm space-y-1">
                <div className="text-[#000000]">
                  <strong>Setor:</strong> {requisicaoConfirmar?.setor_solicitante}
                </div>
                <div className="text-[#000000]">
                  <strong>Itens entregues:</strong> {requisicaoConfirmar?.itens_entregues}
                </div>
                {requisicaoConfirmar?.data_entrega && (
                  <div className="text-[#000000]">
                    <strong>Entregue em:</strong> {formatarData(requisicaoConfirmar.data_entrega)}
                  </div>
                )}
                {requisicaoConfirmar?.usuario_entrega?.nome && (
                  <div className="text-[#000000]">
                    <strong>Entregue por:</strong> {requisicaoConfirmar.usuario_entrega.nome}
                  </div>
                )}
              </div>

              {/* Mostrar aviso sobre itens em falta */}
              {requisicaoConfirmar?.itens_requisicao?.some(item => item.status === "em_falta") && (
                <div className="bg-[#FB8281]/10 p-3 rounded-lg">
                  <p className="text-sm text-[#FB8281]">
                    ⚠️ Alguns itens desta requisição não puderam ser entregues (em falta). 
                    Ao confirmar, você está confirmando apenas o recebimento dos itens que foram entregues.
                  </p>
                </div>
              )}

              <div className="bg-[#4AC5BB]/10 p-3 rounded-lg">
                <p className="text-sm text-[#4AC5BB]">
                  ✅ Após confirmar, esta requisição será finalizada e marcada como concluída.
                </p>
              </div>
            </div>
            
            <DialogFooter className="flex-col space-y-2">
              <Button
                onClick={confirmarRecebimento}
                disabled={processando}
                className="w-full bg-[#4AC5BB] hover:bg-[#3599B8] text-white"
              >
                {processando ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirmando...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sim, Confirmar Recebimento
                  </>
                )}
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