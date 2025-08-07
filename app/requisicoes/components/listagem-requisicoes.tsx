"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Eye, Calendar, MapPin, Package } from "lucide-react"
import { requisicoesService, STATUS_COLORS, STATUS_LABELS, type Requisicao, type Usuario } from "../../shared/lib/requisicoes-service"

interface ListagemRequisicoesProps {
  usuario: Usuario
  onVoltar: () => void
  onVerDetalhes: (requisicao: Requisicao) => void
  onAtualizar: () => void
}

export function ListagemRequisicoes({
  usuario,
  onVoltar,
  onVerDetalhes,
  onAtualizar,
}: ListagemRequisicoesProps) {
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [requisicoesAgrupadas, setRequisicoesAgrupadas] = useState<Record<string, Requisicao[]>>({})

  useEffect(() => {
    carregarRequisicoes()
  }, [])

  useEffect(() => {
    // Agrupar requisições por data
    const agrupadas = requisicoes.reduce((acc, requisicao) => {
      const data = new Date(requisicao.data_criacao).toLocaleDateString("pt-BR")
      if (!acc[data]) {
        acc[data] = []
      }
      acc[data].push(requisicao)
      return acc
    }, {} as Record<string, Requisicao[]>)

    // Ordenar por data (mais recente primeiro)
    const datasOrdenadas = Object.keys(agrupadas).sort((a, b) => {
      const dataA = new Date(a.split("/").reverse().join("-"))
      const dataB = new Date(b.split("/").reverse().join("-"))
      return dataB.getTime() - dataA.getTime()
    })

    const agrupadasOrdenadas: Record<string, Requisicao[]> = {}
    datasOrdenadas.forEach((data) => {
      agrupadasOrdenadas[data] = agrupadas[data].sort(
        (a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime(),
      )
    })

    setRequisicoesAgrupadas(agrupadasOrdenadas)
  }, [requisicoes])

  const carregarRequisicoes = async () => {
    try {
      setCarregando(true)
      const dados = await requisicoesService.listar({
        loja_id: usuario.loja_id
      })
      setRequisicoes(dados)
    } catch (error) {
      console.error("Erro ao carregar requisições:", error)
      alert("Erro ao carregar requisições. Verifique sua conexão.")
    } finally {
      setCarregando(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fabd07]"></div>
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
          <h1 className="text-xl font-bold text-[#000000]">Requisições</h1>
          <div className="w-20"></div>
        </div>

        {/* Estatísticas */}
        <Card className="border-2 border-[#fabd07]">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[#fabd07]">{requisicoes.length}</div>
                <div className="text-xs text-[#5F6B6D]">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#F4D25A]">
                  {requisicoes.filter((req) => req.status === "pendente").length}
                </div>
                <div className="text-xs text-[#5F6B6D]">Pendentes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#3599B8]">
                  {requisicoes.filter((req) => req.status === "separado").length}
                </div>
                <div className="text-xs text-[#5F6B6D]">Separadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#4AC5BB]">
                  {requisicoes.filter((req) => req.status === "entregue").length}
                </div>
                <div className="text-xs text-[#5F6B6D]">Entregues</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Requisições Agrupadas */}
        <div className="space-y-4">
          {Object.entries(requisicoesAgrupadas).map(([data, requisicoesData]) => (
            <div key={data}>
              {/* Cabeçalho da Data */}
              <div className="flex items-center mb-3">
                <Calendar className="w-4 h-4 text-[#5F6B6D] mr-2" />
                <h2 className="font-semibold text-[#000000]">{data}</h2>
                <div className="flex-1 h-px bg-[#C9B07A] ml-3"></div>
              </div>

              {/* Requisições da Data */}
              <div className="space-y-3">
                {requisicoesData.map((requisicao) => (
                  <Card key={requisicao.id} className="border border-[#C9B07A] shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="font-semibold text-[#000000] text-sm">
                              {requisicao.numero_requisicao}
                            </span>
                            <Badge className={`${STATUS_COLORS.requisicao[requisicao.status]} text-xs ml-2`}>
                              {STATUS_LABELS.requisicao[requisicao.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-[#5F6B6D] mb-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {requisicao.setor_solicitante}
                          </div>
                          <div className="flex items-center text-xs text-[#5F6B6D] mb-2">
                            <Package className="w-3 h-3 mr-1" />
                            {requisicao.total_itens} itens
                            {requisicao.itens_pendentes && requisicao.itens_pendentes > 0 && (
                              <span className="ml-2 text-[#F4D25A]">• {requisicao.itens_pendentes} pendentes</span>
                            )}
                          </div>
                          <div className="text-xs text-[#8B8C7E]">
                            {new Date(requisicao.data_criacao).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            - {requisicao.usuario_solicitante?.nome}
                          </div>
                        </div>
                      </div>

                      {/* Ação */}
                      <div className="pt-3 border-t border-[#DFBFBF]">
                        <Button
                          size="sm"
                          onClick={() => onVerDetalhes(requisicao)}
                          className="w-full bg-[#3599B8] hover:bg-[#4AC5BB] text-white h-8 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mensagem quando não há requisições */}
        {requisicoes.length === 0 && (
          <Card className="border border-[#DFBFBF]">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-[#8B8C7E] mx-auto mb-4" />
              <h3 className="font-semibold text-[#000000] mb-2">Nenhuma requisição encontrada</h3>
              <p className="text-[#5F6B6D] text-sm">Crie sua primeira requisição para começar.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}