"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calculator, TrendingUp, Package, BookOpen, AlertTriangle, Loader2 } from "lucide-react"
import { ingredientesCompostosService, fichasTecnicasService, type FichaTecnica } from "../../shared/lib/fichas-tecnicas-service"

interface CalculadoraCustosProps {
  pratoId: string
  ingredientes: FichaTecnica[]
  disabled?: boolean
}

interface CustoIngrediente {
  ingrediente: FichaTecnica
  custoUnitario: number
  custoTotal: number
  isComposto: boolean
  erro?: string
}

interface ResumoCalculos {
  totalIngredientesSimples: number
  totalIngredientesCompostos: number
  custoTotalEstimado: number
  margemContribuicao?: number
  precoVendaSugerido?: number
}

export function CalculadoraCustos({ pratoId, ingredientes, disabled = false }: CalculadoraCustosProps) {
  const [calculando, setCalculando] = useState(false)
  const [custosIngredientes, setCustosIngredientes] = useState<CustoIngrediente[]>([])
  const [resumo, setResumo] = useState<ResumoCalculos | null>(null)
  const [expandido, setExpandido] = useState(false)
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  useEffect(() => {
    if (ingredientes.length > 0) {
      calcularCustos()
    }
  }, [ingredientes, pratoId])

  const calcularCustos = async () => {
    if (ingredientes.length === 0) return

    setCalculando(true)
    setErroGeral(null)
    
    try {
      const custosCalculados: CustoIngrediente[] = []
      let totalSimples = 0
      let totalCompostos = 0
      
      for (const ingrediente of ingredientes) {
        try {
          if (ingrediente.ficha_tecnica_ref_id) {
            // Ingrediente composto - calcular recursivamente
            const custoComposto = await ingredientesCompostosService.calcularCustoIngredienteComposto(
              ingrediente.ficha_tecnica_ref_id,
              ingrediente.qtd_total_calculada || ingrediente.qtd
            )
            
            const custoItem: CustoIngrediente = {
              ingrediente,
              custoUnitario: custoComposto / (ingrediente.qtd_total_calculada || ingrediente.qtd),
              custoTotal: custoComposto,
              isComposto: true
            }
            
            custosCalculados.push(custoItem)
            totalCompostos += custoComposto
            
          } else {
            // Ingrediente simples - por enquanto, custo zero (integraria com tabela de preços)
            const custoItem: CustoIngrediente = {
              ingrediente,
              custoUnitario: 0,
              custoTotal: 0,
              isComposto: false
            }
            
            custosCalculados.push(custoItem)
            totalSimples += 0 // Seria o custo real do produto
          }
        } catch (error) {
          console.error(`Erro ao calcular custo do ingrediente ${ingrediente.insumo}:`, error)
          
          const custoItem: CustoIngrediente = {
            ingrediente,
            custoUnitario: 0,
            custoTotal: 0,
            isComposto: !!ingrediente.ficha_tecnica_ref_id,
            erro: error instanceof Error ? error.message : 'Erro no cálculo'
          }
          
          custosCalculados.push(custoItem)
        }
      }

      setCustosIngredientes(custosCalculados)
      
      const custoTotalEstimado = totalSimples + totalCompostos
      const resumoCalculado: ResumoCalculos = {
        totalIngredientesSimples: totalSimples,
        totalIngredientesCompostos: totalCompostos,
        custoTotalEstimado,
        // Calcular margem de contribuição sugerida (exemplo: 300% sobre o custo)
        margemContribuicao: custoTotalEstimado > 0 ? 3.0 : undefined,
        precoVendaSugerido: custoTotalEstimado > 0 ? custoTotalEstimado * 4.0 : undefined
      }
      
      setResumo(resumoCalculado)
      
    } catch (error) {
      console.error('Erro geral no cálculo de custos:', error)
      setErroGeral(error instanceof Error ? error.message : 'Erro no cálculo de custos')
    } finally {
      setCalculando(false)
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const temIngredientesCompostos = ingredientes.some(i => i.ficha_tecnica_ref_id)
  
  if (!temIngredientesCompostos && ingredientes.length > 0) {
    return (
      <Card className="border-[#DFBFBF]">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4 text-[#5F6B6D]">
            <Calculator className="w-6 h-6 mr-2 opacity-50" />
            <p className="text-sm text-center">
              Adicione ingredientes compostos (fichas técnicas) para ver cálculos de custo automáticos
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-[#C9B07A] shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#000000] text-lg flex items-center justify-between">
          <span className="flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-[#C9B07A]" />
            Cálculo de Custos
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandido(!expandido)}
            disabled={disabled || calculando}
            className="border-[#C9B07A] text-[#C9B07A] hover:bg-[#C9B07A]/10"
          >
            {expandido ? 'Recolher' : 'Expandir'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Resumo Geral */}
        {resumo && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[#4AC5BB]/10 border border-[#4AC5BB]/20 rounded-lg">
              <p className="text-xs text-[#5F6B6D] mb-1">Custo Total Estimado</p>
              <p className="text-lg font-bold text-[#4AC5BB]">
                {formatarMoeda(resumo.custoTotalEstimado)}
              </p>
            </div>
            
            {resumo.precoVendaSugerido && (
              <div className="p-3 bg-[#fabd07]/10 border border-[#fabd07]/20 rounded-lg">
                <p className="text-xs text-[#5F6B6D] mb-1">Preço Sugerido</p>
                <p className="text-lg font-bold text-[#fabd07]">
                  {formatarMoeda(resumo.precoVendaSugerido)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Indicador de carregamento */}
        {calculando && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#4AC5BB] mr-2" />
            <span className="text-sm text-[#5F6B6D]">Calculando custos...</span>
          </div>
        )}

        {/* Erro geral */}
        {erroGeral && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{erroGeral}</p>
            </div>
          </div>
        )}

        {/* Detalhes expandidos */}
        {expandido && custosIngredientes.length > 0 && (
          <div className="space-y-3">
            <Separator />
            
            <h4 className="text-sm font-medium text-[#000000]">Detalhamento por Ingrediente</h4>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {custosIngredientes.map((custo, index) => (
                <div key={index} className="p-3 border border-[#DFBFBF] rounded-lg bg-white/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium text-sm text-[#000000]">
                        {custo.ingrediente.insumo}
                      </span>
                      
                      {custo.isComposto ? (
                        <Badge variant="outline" className="border-[#4AC5BB] text-[#4AC5BB] text-xs">
                          <BookOpen className="w-3 h-3 mr-1" />
                          Composto
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-[#fabd07] text-[#fabd07] text-xs">
                          <Package className="w-3 h-3 mr-1" />
                          Simples
                        </Badge>
                      )}
                      
                      <span className="text-xs text-[#5F6B6D]">
                        {custo.ingrediente.qtd} {custo.ingrediente.unidade}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      {custo.erro ? (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          <span className="text-xs">Erro</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="text-xs text-[#5F6B6D]">
                            {formatarMoeda(custo.custoUnitario)}/un
                          </p>
                          <p className="font-bold text-sm text-[#000000]">
                            {formatarMoeda(custo.custoTotal)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {custo.erro && (
                    <p className="text-xs text-red-600 mt-1">{custo.erro}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Resumo expandido */}
            {resumo && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#5F6B6D]">Ingredientes Simples:</span>
                    <span className="font-medium">{formatarMoeda(resumo.totalIngredientesSimples)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5F6B6D]">Ingredientes Compostos:</span>
                    <span className="font-medium">{formatarMoeda(resumo.totalIngredientesCompostos)}</span>
                  </div>
                </div>
                
                <div className="p-3 bg-[#C9B07A]/10 border border-[#C9B07A]/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-[#000000] font-medium">
                      <TrendingUp className="w-4 h-4 mr-2 text-[#C9B07A]" />
                      Total Geral
                    </span>
                    <span className="text-lg font-bold text-[#C9B07A]">
                      {formatarMoeda(resumo.custoTotalEstimado)}
                    </span>
                  </div>
                  
                  {resumo.precoVendaSugerido && (
                    <p className="text-xs text-[#5F6B6D] mt-2">
                      Preço sugerido com margem de {((resumo.margemContribuicao || 1) * 100).toFixed(0)}%: 
                      <span className="font-medium text-[#fabd07] ml-1">
                        {formatarMoeda(resumo.precoVendaSugerido)}
                      </span>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Botão para recalcular */}
        <div className="pt-2">
          <Button
            onClick={calcularCustos}
            variant="outline"
            size="sm"
            disabled={disabled || calculando}
            className="border-[#4AC5BB] text-[#4AC5BB] hover:bg-[#4AC5BB]/10"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {calculando ? 'Calculando...' : 'Recalcular Custos'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}