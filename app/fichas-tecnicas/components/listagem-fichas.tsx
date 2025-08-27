"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, FileText, Calendar, User, Eye, Plus } from "lucide-react"
import { pratosService, type Prato } from "../../shared/lib/fichas-tecnicas-service"
import type { Usuario } from "../../shared/lib/auth"

interface ListagemFichasProps {
  usuario: Usuario
  onVoltar: () => void
  onVerDetalhes: (prato: Prato) => void
  onAtualizar: () => void
}

export function ListagemFichas({ usuario, onVoltar, onVerDetalhes, onAtualizar }: ListagemFichasProps) {
  const [pratos, setPratos] = useState<Prato[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPratos, setFilteredPratos] = useState<Prato[]>([])

  useEffect(() => {
    carregarPratos()
  }, [usuario])

  useEffect(() => {
    // Filtrar pratos baseado no termo de busca
    if (searchTerm.trim() === "") {
      setFilteredPratos(pratos)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = pratos.filter(prato => 
        prato.nome.toLowerCase().includes(term) ||
        prato.categoria?.toLowerCase().includes(term) ||
        prato.usuario?.nome.toLowerCase().includes(term) ||
        prato.descricao?.toLowerCase().includes(term)
      )
      setFilteredPratos(filtered)
    }
  }, [pratos, searchTerm])

  const carregarPratos = async () => {
    setLoading(true)
    try {
      const dados = await pratosService.listar(usuario.loja_id)
      setPratos(dados)
    } catch (error) {
      console.error("Erro ao carregar pratos:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (dataISO: string) => {
    return new Date(dataISO).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fabd07]"></div>
            <span className="ml-2 text-[#5F6B6D]">Carregando fichas...</span>
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
          <h1 className="text-xl font-bold text-[#000000]">Fichas Técnicas</h1>
          <div className="w-16"></div>
        </div>

        {/* Busca */}
        <Card className="border-2 border-[#fabd07] shadow-lg">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5F6B6D] w-4 h-4" />
              <Input
                placeholder="Buscar por nome da ficha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-[#DFBFBF] focus:border-[#fabd07]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas rápidas */}
        <Card className="border-2 border-[#3599B8] shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-center">
              <div>
                <div className="text-lg font-bold text-[#fabd07]">{fichas.length}</div>
                <div className="text-xs text-[#5F6B6D]">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#4AC5BB]">{filteredFichas.length}</div>
                <div className="text-xs text-[#5F6B6D]">Filtradas</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#3599B8]">
                  {fichas.filter(f => f.usuario_id === usuario.id).length}
                </div>
                <div className="text-xs text-[#5F6B6D]">Minhas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Fichas */}
        <div className="space-y-3">
          {filteredPratos.length === 0 ? (
            <Card className="border-2 border-[#DFBFBF] shadow-lg">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 text-[#8B8C7E] mx-auto mb-4" />
                <p className="text-[#5F6B6D] mb-4">
                  {searchTerm ? "Nenhum prato encontrado com esses termos." : "Nenhum prato cadastrado."}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => window.location.href = '/fichas-tecnicas/nova'}
                    className="bg-[#fabd07] hover:bg-[#b58821] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Prato
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
                        <Package className="w-4 h-4 mr-2" />
                        <span>Categoria: <strong>{prato.categoria}</strong></span>
                      </div>
                    )}
                    {prato.total_ingredientes && prato.total_ingredientes > 0 && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="bg-[#4AC5BB] text-white px-2 py-1 rounded text-xs">
                          {prato.total_ingredientes} {prato.total_ingredientes === 1 ? 'ingrediente' : 'ingredientes'}
                        </span>
                        {prato.descricao && (
                          <span className="text-xs text-[#8B8C7E] max-w-32 truncate">
                            {prato.descricao}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer com ações */}
        <Card className="border-2 border-[#C9B07A] shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-[#5F6B6D] text-sm mb-2">
              Mostrando {filteredPratos.length} de {pratos.length} pratos
            </p>
            <Button
              onClick={carregarPratos}
              variant="outline"
              size="sm"
              className="border-[#3599B8] text-[#3599B8] hover:bg-[#3599B8]/10"
            >
              Atualizar Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}