"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, MapPin, Plus, X, Building2 } from "lucide-react"
import { SETORES, SETORES_POR_CATEGORIA, type Setor, type SetorCategoria, getSetorEmoji } from "../../shared/lib/setores"

interface SeletorSetoresProps {
  setoresSelecionados: string[]
  onSetoresChange: (setores: string[]) => void
  disabled?: boolean
  placeholder?: string
  maxSetores?: number
}

export function SeletorSetores({ 
  setoresSelecionados, 
  onSetoresChange, 
  disabled = false, 
  placeholder = "Selecionar setores...",
  maxSetores 
}: SeletorSetoresProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const [busca, setBusca] = useState("")
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<SetorCategoria | null>(null)

  const setoresFiltrados = SETORES.filter(setor => {
    const matchBusca = !busca || 
      setor.nome.toLowerCase().includes(busca.toLowerCase()) ||
      setor.descricao?.toLowerCase().includes(busca.toLowerCase())
    
    const matchCategoria = !categoriaSelecionada || setor.categoria === categoriaSelecionada
    
    return matchBusca && matchCategoria
  })

  const toggleSetor = (nomeSetor: string) => {
    const novosSetores = setoresSelecionados.includes(nomeSetor)
      ? setoresSelecionados.filter(s => s !== nomeSetor)
      : [...setoresSelecionados, nomeSetor]
    
    onSetoresChange(novosSetores)
  }

  const removerSetor = (nomeSetor: string) => {
    onSetoresChange(setoresSelecionados.filter(s => s !== nomeSetor))
  }

  const categorias: { key: SetorCategoria, nome: string, emoji: string }[] = [
    { key: 'cozinha', nome: 'Cozinha', emoji: '👨‍🍳' },
    { key: 'bar', nome: 'Bar', emoji: '🍺' },
    { key: 'estoque', nome: 'Estoque', emoji: '📦' },
    { key: 'servicos', nome: 'Serviços', emoji: '🧹' },
    { key: 'outros', nome: 'Outros', emoji: '📍' }
  ]

  const podeAdicionarMais = !maxSetores || setoresSelecionados.length < maxSetores

  return (
    <div className="space-y-2">
      {/* Setores Selecionados */}
      {setoresSelecionados.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {setoresSelecionados.map((nomeSetor) => (
            <Badge
              key={nomeSetor}
              variant="secondary"
              className="bg-[#4AC5BB]/10 text-[#4AC5BB] border border-[#4AC5BB]/30 pr-1"
            >
              <span className="mr-1">{getSetorEmoji(nomeSetor)}</span>
              {nomeSetor}
              {!disabled && (
                <button
                  onClick={() => removerSetor(nomeSetor)}
                  className="ml-1 hover:bg-[#4AC5BB]/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Botão para abrir modal de seleção */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-[#DFBFBF] text-[#5F6B6D] hover:border-[#4AC5BB] hover:text-[#4AC5BB] justify-start"
            disabled={disabled || (!podeAdicionarMais && setoresSelecionados.length === 0)}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {setoresSelecionados.length === 0 
              ? placeholder
              : `${setoresSelecionados.length} setor${setoresSelecionados.length !== 1 ? 'es' : ''} selecionado${setoresSelecionados.length !== 1 ? 's' : ''}`
            }
            {podeAdicionarMais && <Plus className="w-4 h-4 ml-auto" />}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#000000] flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-[#4AC5BB]" />
              Selecionar Setores para Ficha Técnica
              {maxSetores && (
                <span className="text-sm text-[#5F6B6D] font-normal ml-2">
                  (máx. {maxSetores})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Barra de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5F6B6D] w-4 h-4" />
              <Input
                placeholder="Buscar setores..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            {/* Filtros por categoria */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoriaSelecionada === null ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoriaSelecionada(null)}
                className={categoriaSelecionada === null ? "bg-[#4AC5BB] hover:bg-[#3599B8]" : ""}
              >
                Todas
              </Button>
              {categorias.map((categoria) => (
                <Button
                  key={categoria.key}
                  variant={categoriaSelecionada === categoria.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoriaSelecionada(categoria.key)}
                  className={categoriaSelecionada === categoria.key ? "bg-[#4AC5BB] hover:bg-[#3599B8]" : ""}
                >
                  <span className="mr-1">{categoria.emoji}</span>
                  {categoria.nome}
                </Button>
              ))}
            </div>

            {/* Grid de setores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(SETORES_POR_CATEGORIA).map(([categoria, setores]) => {
                const setoresVistos = setores.filter(setor => 
                  setoresFiltrados.some(sf => sf.id === setor.id)
                )
                
                if (setoresVistos.length === 0) return null
                
                const categoriaInfo = categorias.find(c => c.key === categoria)
                
                return (
                  <Card key={categoria} className="border-[#DFBFBF]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-[#5F6B6D] flex items-center">
                        <span className="mr-2">{categoriaInfo?.emoji}</span>
                        {categoriaInfo?.nome}
                        <span className="ml-2 text-xs text-[#5F6B6D]">
                          ({setoresVistos.length})
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {setoresVistos.map((setor) => {
                        const jaSelecionado = setoresSelecionados.includes(setor.nome)
                        const podeSelecionar = jaSelecionado || podeAdicionarMais
                        
                        return (
                          <div
                            key={setor.id}
                            className={`flex items-start space-x-3 p-2 rounded-lg border transition-colors ${
                              jaSelecionado 
                                ? 'border-[#4AC5BB] bg-[#4AC5BB]/10' 
                                : podeSelecionar
                                  ? 'border-[#DFBFBF] hover:border-[#4AC5BB]/50 cursor-pointer'
                                  : 'border-[#DFBFBF] opacity-50 cursor-not-allowed'
                            }`}
                            onClick={() => podeSelecionar && toggleSetor(setor.nome)}
                          >
                            <Checkbox
                              checked={jaSelecionado}
                              disabled={!podeSelecionar}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                <span className="mr-2">{setor.emoji}</span>
                                <Label className="font-medium text-sm text-[#000000] cursor-pointer">
                                  {setor.nome}
                                </Label>
                              </div>
                              {setor.descricao && (
                                <p className="text-xs text-[#5F6B6D] mt-1">{setor.descricao}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {setoresFiltrados.length === 0 && (
              <div className="text-center py-8 text-[#5F6B6D]">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum setor encontrado</p>
                {busca && (
                  <p className="text-xs mt-1">Tente ajustar os filtros de busca</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#DFBFBF]">
            <div className="text-sm text-[#5F6B6D]">
              {setoresSelecionados.length} setor{setoresSelecionados.length !== 1 ? 'es' : ''} selecionado{setoresSelecionados.length !== 1 ? 's' : ''}
              {maxSetores && ` de ${maxSetores} máximo`}
            </div>
            <Button
              onClick={() => setModalAberto(false)}
              className="bg-[#4AC5BB] hover:bg-[#3599B8] text-white"
            >
              Confirmar Seleção
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}