"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Calendar, User, Package, Calculator, Edit, Trash2 } from "lucide-react"
import { pratosService, type Prato, type FichaTecnica } from "../../shared/lib/fichas-tecnicas-service"
import type { Usuario } from "../../shared/lib/auth"

interface DetalhesFichaProps {
  prato: Prato
  usuario: Usuario
  onVoltar: () => void
  onAtualizar: () => void
}

export function DetalhesFicha({ prato: pratoInicial, usuario, onVoltar, onAtualizar }: DetalhesFichaProps) {
  const [prato, setPrato] = useState<Prato & { fichas_tecnicas: FichaTecnica[] }>(pratoInicial as any)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    carregarDetalhesCompletos()
  }, [pratoInicial.id])

  const carregarDetalhesCompletos = async () => {
    setLoading(true)
    try {
      const pratoCompleto = await pratosService.obter(pratoInicial.id)
      setPrato(pratoCompleto)
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (dataISO: string) => {
    return new Date(dataISO).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatarQuantidade = (valor: number) => {
    return valor.toLocaleString("pt-BR", { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 3 
    })
  }

  const podeEditar = usuario.permissoes?.includes("editar") || usuario.permissoes?.includes("excluir") || prato.usuario_id === usuario.id
  const podeExcluir = usuario.permissoes?.includes("excluir") || prato.usuario_id === usuario.id

  const calcularTotais = () => {
    if (!prato.fichas_tecnicas) return { ingredientes: 0, grupos: 0 }
    
    const grupos = new Set(prato.fichas_tecnicas.map(ingrediente => ingrediente.id_grupo).filter(Boolean))
    
    return {
      ingredientes: prato.fichas_tecnicas.length,
      grupos: grupos.size
    }
  }

  const agruparIngredientesPorGrupo = () => {
    if (!prato.fichas_tecnicas) return {}
    
    return prato.fichas_tecnicas.reduce((acc, ingrediente) => {
      const grupo = ingrediente.id_grupo || 'Sem Grupo'
      if (!acc[grupo]) acc[grupo] = []
      acc[grupo].push(ingrediente)
      return acc
    }, {} as Record<string, FichaTecnica[]>)
  }

  const totais = calcularTotais()
  const ingredientesAgrupados = agruparIngredientesPorGrupo()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fabd07]"></div>
            <span className="ml-2 text-[#5F6B6D]">Carregando detalhes...</span>
          </div>
        </div>
      </div>
    )
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
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-lg font-bold text-[#000000] max-w-48 truncate">{ficha.item}</h1>
          <div className="flex gap-2">
            {podeEditar && (
              <Button
                size="sm"
                className="bg-[#3599B8] hover:bg-[#4AC5BB] text-white"
                onClick={() => window.location.href = `/fichas-tecnicas/${ficha.id}/editar`}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Informações da Ficha */}
        <Card className="border-2 border-[#fabd07] shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#000000] text-lg flex items-center">
              <FileText className="w-5 h-5 mr-3 text-[#fabd07]" />
              {ficha.item}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-[#5F6B6D] text-sm">
              <User className="w-4 h-4 mr-2" />
              <span>Criado por: <strong>{ficha.usuario?.nome || 'N/A'}</strong></span>
            </div>
            <div className="flex items-center text-[#5F6B6D] text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Data: <strong>{formatarData(ficha.created_at)}</strong></span>
            </div>
            {ficha.observacoes && (
              <div className="border-t border-[#DFBFBF] pt-3">
                <p className="text-[#5F6B6D] text-sm"><strong>Observações:</strong></p>
                <p className="text-[#000000] text-sm mt-1">{ficha.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card className="border-2 border-[#3599B8] shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-center">
              <div>
                <div className="text-lg font-bold text-[#fabd07]">{totais.itens}</div>
                <div className="text-xs text-[#5F6B6D]">Itens</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#4AC5BB]">{totais.grupos}</div>
                <div className="text-xs text-[#5F6B6D]">Grupos</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#3599B8]">
                  {ficha.itens_ficha_tecnica?.filter(i => i.produto_id).length || 0}
                </div>
                <div className="text-xs text-[#5F6B6D]">Vinculados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Itens por Grupo */}
        <div className="space-y-3">
          {Object.entries(itensAgrupados).map(([grupo, itens]) => (
            <Card key={grupo} className="border-2 border-[#C9B07A] shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#000000] text-base flex items-center justify-between">
                  <span className="flex items-center">
                    <Package className="w-4 h-4 mr-2 text-[#C9B07A]" />
                    {grupo}
                  </span>
                  <Badge variant="secondary" className="bg-[#F4DDAE] text-[#5F6B6D]">
                    {itens.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {itens.sort((a, b) => a.seq - b.seq).map((item, index) => (
                    <div key={item.id} className="border-b border-[#DFBFBF] pb-3 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-[#000000] text-sm">{item.insumo}</p>
                          {item.produto_nome && (
                            <p className="text-xs text-[#3599B8] mt-1">
                              📦 {item.produto_nome}
                            </p>
                          )}
                          {item.obs_item_ft && (
                            <p className="text-xs text-[#8B8C7E] mt-1 italic">
                              {item.obs_item_ft}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-[#fabd07] text-sm">
                            {formatarQuantidade(item.qtd)} {item.unidade}
                          </p>
                          {(item.quebra > 0 || item.fator_correcao !== 1) && (
                            <div className="text-xs text-[#5F6B6D] mt-1 space-y-1">
                              {item.quebra > 0 && (
                                <p>Quebra: {formatarQuantidade(item.quebra)}%</p>
                              )}
                              {item.fator_correcao !== 1 && (
                                <p>Fator: {formatarQuantidade(item.fator_correcao)}</p>
                              )}
                              {item.qtd_total_calculada && (
                                <p className="font-semibold text-[#4AC5BB]">
                                  <Calculator className="w-3 h-3 inline mr-1" />
                                  {formatarQuantidade(item.qtd_total_calculada)}
                                </p>
                              )}
                            </div>
                          )}
                          {item.qtd_receita > 0 && (
                            <p className="text-xs text-[#8B8C7E] mt-1">
                              Receita: {formatarQuantidade(item.qtd_receita)}
                            </p>
                          )}
                          {item.codigo_empresa && (
                            <p className="text-xs text-[#8B8C7E]">
                              Cód: {item.codigo_empresa}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ações */}
        {(podeEditar || podeExcluir) && (
          <Card className="border-2 border-[#DFBFBF] shadow-lg">
            <CardContent className="p-4">
              <div className="flex gap-3 justify-center">
                {podeEditar && (
                  <Button
                    onClick={() => window.location.href = `/fichas-tecnicas/${ficha.id}/editar`}
                    className="bg-[#3599B8] hover:bg-[#4AC5BB] text-white flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Ficha
                  </Button>
                )}
                {podeExcluir && (
                  <Button
                    onClick={async () => {
                      if (confirm('Tem certeza que deseja excluir esta ficha técnica?')) {
                        try {
                          await fichasTecnicasService.excluir(ficha.id)
                          onAtualizar()
                          onVoltar()
                        } catch (error) {
                          console.error('Erro ao excluir:', error)
                          alert('Erro ao excluir ficha técnica.')
                        }
                      }
                    }}
                    variant="destructive"
                    className="bg-[#FB8281] hover:bg-red-600 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-[#5F6B6D] text-xs">
            Última atualização: {formatarData(ficha.updated_at)}
          </p>
        </div>
      </div>
    </div>
  )
}