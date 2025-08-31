"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, FileText, Calendar, User, Eye, MapPin, ChefHat } from "lucide-react"
import { pratosService, setoresFichasService, type Prato } from "../../shared/lib/fichas-tecnicas-service"
import { getSetorEmoji } from "../../shared/lib/setores"
import type { Usuario } from "../../shared/lib/auth"

interface FichasPorSetorProps {
  usuario: Usuario
  setor: string
  onVoltar: () => void
  onVerDetalhes: (prato: Prato) => void
}

export function FichasPorSetor({ usuario, setor, onVoltar, onVerDetalhes }: FichasPorSetorProps) {
  const [pratos, setPratos] = useState<Prato[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPratos, setFilteredPratos] = useState<Prato[]>([])

  useEffect(() => {
    carregarPratos()
  }, [usuario, setor])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPratos(pratos)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = pratos.filter(prato =>
        prato.nome.toLowerCase().includes(term) ||
        prato.categoria?.toLowerCase().includes(term) ||
        prato.descricao?.toLowerCase().includes(term) ||
        prato.usuario?.nome.toLowerCase().includes(term)
      )
      setFilteredPratos(filtered)
    }
  }, [pratos, searchTerm])

  const carregarPratos = async () => {
    setLoading(true)
    try {
      // Usar função específica para buscar por setor
      const dados = await setoresFichasService.listarPorSetor(usuario.loja_id, setor)
      setPratos(dados)
    } catch (error) {
      console.error('Erro ao carregar fichas do setor:', error)
      // Fallback: usar listagem geral e filtrar
      try {
        const todosPratos = await pratosService.listar(usuario.loja_id)
        const pratosFiltrados = todosPratos.filter(prato => 
          prato.setores && prato.setores.includes(setor)
        )
        setPratos(pratosFiltrados)
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError)
        setPratos([])
      }
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (dataISO: string | undefined) => {
    if (!dataISO) return 'Data não informada'
    try {
      return new Date(dataISO).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      return 'Data inválida'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fabd07]"></div>
            <span className="ml-2 text-[#5F6B6D]">Carregando fichas do setor...</span>
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
            className="text-[#5F6B6D] hover:text-[#000000] hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div className="flex items-center">
            <span className="text-2xl mr-2">{getSetorEmoji(setor)}</span>
            <h1 className="text-xl font-bold text-[#000000]">{setor}</h1>
          </div>
          <div className="w-16"></div>
        </div>

        {/* Busca */}
        <Card className="border-2 border-[#fabd07] shadow-lg">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5F6B6D] w-4 h-4" />
              <Input
                placeholder={`Buscar fichas do setor ${setor}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-[#DFBFBF] focus:border-[#fabd07]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card className="border-2 border-[#4AC5BB] shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-center">
              <div>
                <div className="flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-[#4AC5BB] mr-2" />
                  <span className="text-2xl font-bold text-[#000000]">{pratos.length}</span>
                </div>
                <p className="text-xs text-[#5F6B6D] mt-1">
                  {pratos.length === 1 ? 'Ficha técnica' : 'Fichas técnicas'}
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-center">
                  <FileText className="w-8 h-8 text-[#fabd07] mr-2" />
                  <span className="text-2xl font-bold text-[#000000]">{filteredPratos.length}</span>
                </div>
                <p className="text-xs text-[#5F6B6D] mt-1">
                  {searchTerm ? 'Resultados da busca' : 'Total disponível'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Fichas */}
        {filteredPratos.length === 0 ? (
          <Card className="border-2 border-[#DFBFBF] shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-6xl mb-4">{getSetorEmoji(setor)}</div>
              <p className="text-[#5F6B6D] mb-4">
                {searchTerm 
                  ? `Nenhuma ficha encontrada para "${searchTerm}" no setor ${setor}`
                  : `Nenhuma ficha técnica encontrada para o setor ${setor}`
                }
              </p>
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm("")}
                  variant="outline"
                  className="border-[#4AC5BB] text-[#4AC5BB] hover:bg-[#4AC5BB]/10"
                >
                  Limpar busca
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPratos.map((prato) => (
            <Card key={prato.id} className="border-2 border-[#fabd07] hover:border-[#b58821] shadow-lg transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#000000] text-lg flex items-center justify-between">
                  <span className="flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-[#fabd07]" />
                    {prato.nome}
                  </span>
                  <Button
                    onClick={() => onVerDetalhes(prato)}
                    size="sm"
                    className="bg-[#3599B8] hover:bg-[#4AC5BB] text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-[#5F6B6D]">
                    <User className="w-4 h-4 mr-2" />
                    <span>Criado por: <strong>{prato.usuario?.nome || 'N/A'}</strong></span>
                  </div>
                  
                  <div className="flex items-center text-[#5F6B6D]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Data: <strong>{formatarData(prato.created_at)}</strong></span>
                  </div>
                  
                  {prato.categoria && (
                    <div className="flex items-center text-[#5F6B6D]">
                      <ChefHat className="w-4 h-4 mr-2" />
                      <span>Categoria: <strong>{prato.categoria}</strong></span>
                    </div>
                  )}
                  
                  {prato.descricao && (
                    <div className="text-[#5F6B6D]">
                      <p className="text-xs mt-2 p-2 bg-gray-50 rounded border-l-2 border-[#4AC5BB]">
                        {prato.descricao.length > 100 
                          ? `${prato.descricao.substring(0, 100)}...`
                          : prato.descricao
                        }
                      </p>
                    </div>
                  )}

                  {/* Outros setores da ficha */}
                  {prato.setores && prato.setores.length > 1 && (
                    <div className="flex items-start text-[#5F6B6D]">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                      <div>
                        <span className="text-xs">Também usado em: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prato.setores
                            .filter(s => s !== setor)
                            .map((outroSetor) => (
                              <Badge
                                key={outroSetor}
                                variant="secondary"
                                className="text-xs bg-gray-100 text-gray-600"
                              >
                                <span className="mr-1">{getSetorEmoji(outroSetor)}</span>
                                {outroSetor}
                              </Badge>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {prato.total_ingredientes && prato.total_ingredientes > 0 && (
                    <div className="flex items-center justify-between pt-2">
                      <Badge className="bg-[#4AC5BB] hover:bg-[#4AC5BB] text-white">
                        {prato.total_ingredientes} {prato.total_ingredientes === 1 ? 'ingrediente' : 'ingredientes'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}