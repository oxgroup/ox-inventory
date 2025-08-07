"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Truck, Package, CheckCircle, AlertTriangle, MapPin, User, Clock } from "lucide-react"
import { requisicoesService, STATUS_COLORS, STATUS_LABELS, type Requisicao, type Usuario } from "../../shared/lib/requisicoes-service"

interface EntregasProps {
  usuario: Usuario
  onVoltar: () => void
  onAtualizar: () => void
}

export function Entregas({ usuario, onVoltar, onAtualizar }: EntregasProps) {
  const [requisicoesSeparadas, setRequisicoesSeparadas] = useState<Requisicao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [requisicaoEntrega, setRequisicaoEntrega] = useState<Requisicao | null>(null)
  const [dialogConfirmar, setDialogConfirmar] = useState(false)

  useEffect(() => {
    carregarRequisicoesSeparadas()
  }, [])

  const carregarRequisicoesSeparadas = async () => {
    try {
      setCarregando(true)
      const requisicoes = await requisicoesService.listar({
        loja_id: usuario.loja_id,
        status: "separado"
      })
      setRequisicoesSeparadas(requisicoes)
    } catch (error) {
      console.error("Erro ao carregar requisições separadas:", error)
      alert("Erro ao carregar requisições separadas")
    } finally {
      setCarregando(false)
    }
  }

  const abrirDialogEntrega = (requisicao: Requisicao) => {
    setRequisicaoEntrega(requisicao)
    setDialogConfirmar(true)
  }

  const registrarEntrega = async () => {
    if (!requisicaoEntrega) return

    try {
      setProcessando(true)
      await requisicoesService.registrarEntrega(requisicaoEntrega.id, usuario.id)
      
      // Atualizar dados
      await carregarRequisicoesSeparadas()
      onAtualizar()
      
      setDialogConfirmar(false)
      setRequisicaoEntrega(null)
    } catch (error) {
      console.error("Erro ao registrar entrega:", error)
      alert("Erro ao registrar entrega")
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
          <h1 className="text-xl font-bold text-[#000000]">Registrar Entregas</h1>
          <div className="w-20"></div>
        </div>

        {/* Estatísticas */}
        <Card className="border-2 border-[#3599B8]">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#3599B8]">{requisicoesSeparadas.length}</div>
              <div className="text-sm text-[#5F6B6D]">Requisições Prontas para Entrega</div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Requisições Separadas */}
        <div className="space-y-3">
          {requisicoesSeparadas.map((requisicao) => (
            <Card key={requisicao.id} className="border border-[#C9B07A] shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold text-[#000000] text-sm">
                        {requisicao.numero_requisicao}
                      </span>
                      <Badge className="bg-[#3599B8] text-white text-xs ml-2">
                        Separado
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-[#5F6B6D] space-y-1 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        Setor: {requisicao.setor_solicitante}
                      </div>
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {requisicao.usuario_solicitante?.nome}
                      </div>
                      <div className="flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        {requisicao.itens_separados} itens separados
                      </div>
                      {requisicao.data_separacao && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Separado: {formatarData(requisicao.data_separacao)}
                        </div>
                      )}
                    </div>

                    {/* Resumo dos itens */}
                    {requisicao.itens_requisicao && (
                      <div className="bg-[#F4DDAE] p-2 rounded text-xs">
                        <div className="font-medium text-[#000000] mb-1">Itens para entrega:</div>
                        {requisicao.itens_requisicao
                          .filter(item => item.status === "separado")
                          .slice(0, 3)
                          .map((item, index) => (
                            <div key={index} className="text-[#5F6B6D]">
                              • {item.produto_nome} ({item.quantidade_separada} {item.produto_unidade})
                            </div>
                          ))}
                        {requisicao.itens_separados && requisicao.itens_separados > 3 && (
                          <div className="text-[#8B8C7E] mt-1">
                            ... e mais {requisicao.itens_separados - 3} itens
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => abrirDialogEntrega(requisicao)}
                  className="w-full bg-[#fabd07] hover:bg-[#b58821] text-white h-12 font-semibold"
                >
                  <Truck className="w-5 h-5 mr-2" />
                  Registrar Entrega
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mensagem quando não há requisições */}
        {requisicoesSeparadas.length === 0 && (
          <Card className="border border-[#DFBFBF]">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-[#8B8C7E] mx-auto mb-4" />
              <h3 className="font-semibold text-[#000000] mb-2">Nenhuma requisição pronta para entrega</h3>
              <p className="text-[#5F6B6D] text-sm">
                As requisições aparecerão aqui após todos os itens serem separados.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Confirmação */}
        <Dialog open={dialogConfirmar} onOpenChange={setDialogConfirmar}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-[#fabd07]">
                <Truck className="w-5 h-5 mr-2" />
                Confirmar Entrega
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-[#000000]">
                Confirma a entrega da requisição <strong>{requisicaoEntrega?.numero_requisicao}</strong> 
                no setor <strong>{requisicaoEntrega?.setor_solicitante}</strong>?
              </p>

              <div className="bg-[#F4DDAE] p-3 rounded-lg text-sm space-y-1">
                <div className="text-[#000000]">
                  <strong>Solicitante:</strong> {requisicaoEntrega?.usuario_solicitante?.nome}
                </div>
                <div className="text-[#000000]">
                  <strong>Itens separados:</strong> {requisicaoEntrega?.itens_separados}
                </div>
                {requisicaoEntrega?.data_separacao && (
                  <div className="text-[#000000]">
                    <strong>Separado em:</strong> {formatarData(requisicaoEntrega.data_separacao)}
                  </div>
                )}
              </div>

              <div className="bg-[#4AC5BB]/10 p-3 rounded-lg">
                <p className="text-sm text-[#4AC5BB]">
                  ✅ Após confirmar, a requisição será marcada como "Entregue" e o setor solicitante 
                  poderá confirmar o recebimento.
                </p>
              </div>
            </div>
            
            <DialogFooter className="flex-col space-y-2">
              <Button
                onClick={registrarEntrega}
                disabled={processando}
                className="w-full bg-[#fabd07] hover:bg-[#b58821] text-white"
              >
                {processando ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sim, Confirmar Entrega
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