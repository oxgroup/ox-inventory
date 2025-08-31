"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { X, Upload, Image, Camera, Move, Loader2 } from "lucide-react"
import { storageService } from "../../shared/lib/storage-service"
import type { FotoPreparoEtapa } from "../../shared/lib/fichas-tecnicas-service"

interface UploadFotosProps {
  fotoPratoFinal?: string
  fotosPreparoEtapas?: FotoPreparoEtapa[]
  onFotoPratoFinalChange: (url: string) => void
  onFotosPreparoChange: (fotos: FotoPreparoEtapa[]) => void
  pratoId?: string // ID do prato para organizar uploads
  usuarioId: string // ID do usuário para controle de acesso
  disabled?: boolean
}

export function UploadFotos({ 
  fotoPratoFinal, 
  fotosPreparoEtapas = [], 
  onFotoPratoFinalChange, 
  onFotosPreparoChange,
  pratoId,
  usuarioId,
  disabled = false 
}: UploadFotosProps) {
  const [novaFotoEtapa, setNovaFotoEtapa] = useState<Partial<FotoPreparoEtapa>>({
    ordem: fotosPreparoEtapas.length + 1,
    etapa: '',
    foto_url: '',
    descricao: ''
  })
  
  const [mostrarFormEtapa, setMostrarFormEtapa] = useState(false)
  
  // Estados para controle de upload
  const [uploadingPrato, setUploadingPrato] = useState(false)
  const [uploadingEtapa, setUploadingEtapa] = useState(false)
  const [progressoPrato, setProgressoPrato] = useState(0)
  const [progressoEtapa, setProgressoEtapa] = useState(0)

  // Upload real da foto principal do prato
  const handleUploadFotoPrincipal = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar arquivo
    const validacao = storageService.validarArquivoImagem(file)
    if (!validacao.valido) {
      alert(validacao.erro)
      return
    }

    setUploadingPrato(true)
    setProgressoPrato(0)

    try {
      // Simular progresso
      const interval = setInterval(() => {
        setProgressoPrato(prev => Math.min(prev + 10, 90))
      }, 200)

      // Upload real para Supabase Storage
      const pratoIdTemp = pratoId || `temp_${Date.now()}`
      const result = await storageService.uploadFotoPrato(file, pratoIdTemp, usuarioId)

      clearInterval(interval)
      setProgressoPrato(100)

      if (result.success) {
        onFotoPratoFinalChange(result.url)
      } else {
        alert(`Erro no upload: ${result.error}`)
      }
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error)
      alert("Erro ao fazer upload da foto")
    } finally {
      setTimeout(() => {
        setUploadingPrato(false)
        setProgressoPrato(0)
      }, 1000)
    }
  }

  // Upload real da foto de etapa
  const handleUploadFotoEtapa = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar arquivo
    const validacao = storageService.validarArquivoImagem(file)
    if (!validacao.valido) {
      alert(validacao.erro)
      return
    }

    setUploadingEtapa(true)
    setProgressoEtapa(0)

    try {
      // Simular progresso
      const interval = setInterval(() => {
        setProgressoEtapa(prev => Math.min(prev + 10, 90))
      }, 200)

      // Upload real para Supabase Storage
      const pratoIdTemp = pratoId || `temp_${Date.now()}`
      const etapaNumero = novaFotoEtapa.ordem || fotosPreparoEtapas.length + 1
      const result = await storageService.uploadFotoEtapa(file, pratoIdTemp, usuarioId, etapaNumero)

      clearInterval(interval)
      setProgressoEtapa(100)

      if (result.success) {
        setNovaFotoEtapa(prev => ({ ...prev, foto_url: result.url }))
      } else {
        alert(`Erro no upload: ${result.error}`)
      }
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error)
      alert("Erro ao fazer upload da foto")
    } finally {
      setTimeout(() => {
        setUploadingEtapa(false)
        setProgressoEtapa(0)
      }, 1000)
    }
  }

  const adicionarFotoEtapa = () => {
    if (!novaFotoEtapa.etapa || !novaFotoEtapa.foto_url) {
      alert("Preencha a etapa e faça upload da foto")
      return
    }

    const novaEtapa: FotoPreparoEtapa = {
      ordem: novaFotoEtapa.ordem || fotosPreparoEtapas.length + 1,
      etapa: novaFotoEtapa.etapa!,
      foto_url: novaFotoEtapa.foto_url!,
      descricao: novaFotoEtapa.descricao || undefined
    }

    const fotosAtualizadas = [...fotosPreparoEtapas, novaEtapa]
      .sort((a, b) => a.ordem - b.ordem)

    onFotosPreparoChange(fotosAtualizadas)
    
    // Reset form
    setNovaFotoEtapa({
      ordem: fotosAtualizadas.length + 1,
      etapa: '',
      foto_url: '',
      descricao: ''
    })
    setMostrarFormEtapa(false)
  }

  const removerFotoEtapa = (ordem: number) => {
    const fotasAtualizadas = fotosPreparoEtapas
      .filter(foto => foto.ordem !== ordem)
      .map((foto, index) => ({ ...foto, ordem: index + 1 }))
    
    onFotosPreparoChange(fotasAtualizadas)
  }

  const moverEtapa = (ordemAtual: number, direcao: 'up' | 'down') => {
    const fotosOrdenadas = [...fotosPreparoEtapas].sort((a, b) => a.ordem - b.ordem)
    const index = fotosOrdenadas.findIndex(f => f.ordem === ordemAtual)
    
    if ((direcao === 'up' && index === 0) || (direcao === 'down' && index === fotosOrdenadas.length - 1)) {
      return
    }

    const newIndex = direcao === 'up' ? index - 1 : index + 1
    
    // Trocar as ordens
    const temp = fotosOrdenadas[index].ordem
    fotosOrdenadas[index].ordem = fotosOrdenadas[newIndex].ordem
    fotosOrdenadas[newIndex].ordem = temp
    
    onFotosPreparoChange(fotosOrdenadas)
  }

  return (
    <div className="space-y-4">
      {/* Foto Principal do Prato */}
      <Card className="border-2 border-[#fabd07] shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#000000] text-lg flex items-center">
            <Image className="w-5 h-5 mr-2 text-[#fabd07]" />
            Foto Principal do Prato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fotoPratoFinal ? (
            <div className="relative">
              <img 
                src={fotoPratoFinal} 
                alt="Prato finalizado" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                onClick={() => onFotoPratoFinalChange('')}
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#DFBFBF] rounded-lg p-6 text-center">
              <Camera className="w-8 h-8 mx-auto text-[#5F6B6D] mb-2" />
              <p className="text-sm text-[#5F6B6D] mb-3">Clique para adicionar foto do prato finalizado</p>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadFotoPrincipal}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={disabled || uploadingPrato}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-[#fabd07] text-[#fabd07]"
                  disabled={disabled || uploadingPrato}
                >
                  {uploadingPrato ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Foto
                    </>
                  )}
                </Button>
              </div>
              {uploadingPrato && (
                <div className="mt-3">
                  <Progress value={progressoPrato} className="h-2" />
                  <p className="text-xs text-[#5F6B6D] text-center mt-1">
                    {progressoPrato}% - Fazendo upload...
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fotos do Processo de Preparo */}
      <Card className="border-2 border-[#4AC5BB] shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#000000] text-lg flex items-center justify-between">
            <span className="flex items-center">
              <Camera className="w-5 h-5 mr-2 text-[#4AC5BB]" />
              Fotos do Processo ({fotosPreparoEtapas.length})
            </span>
            <Button
              onClick={() => setMostrarFormEtapa(true)}
              size="sm"
              className="bg-[#4AC5BB] hover:bg-[#3599B8] text-white"
              disabled={disabled}
            >
              <Upload className="w-4 h-4 mr-2" />
              Adicionar Etapa
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Lista de Fotos Existentes */}
          {fotosPreparoEtapas
            .sort((a, b) => a.ordem - b.ordem)
            .map((foto) => (
              <div key={foto.ordem} className="border border-[#DFBFBF] rounded-lg p-3 bg-white/50">
                <div className="flex gap-3">
                  <img 
                    src={foto.foto_url} 
                    alt={`Etapa ${foto.ordem}`}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#fabd07]">Etapa {foto.ordem}</span>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => moverEtapa(foto.ordem, 'up')}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          disabled={disabled || foto.ordem === 1}
                        >
                          ↑
                        </Button>
                        <Button
                          onClick={() => moverEtapa(foto.ordem, 'down')}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          disabled={disabled || foto.ordem === fotosPreparoEtapas.length}
                        >
                          ↓
                        </Button>
                        <Button
                          onClick={() => removerFotoEtapa(foto.ordem)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600"
                          disabled={disabled}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-[#000000]">{foto.etapa}</p>
                    {foto.descricao && (
                      <p className="text-xs text-[#5F6B6D]">{foto.descricao}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* Formulário para Nova Etapa */}
          {mostrarFormEtapa && (
            <Card className="border-2 border-[#C9B07A] shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#000000] text-base flex items-center justify-between">
                  Nova Etapa do Preparo
                  <Button
                    onClick={() => setMostrarFormEtapa(false)}
                    variant="outline"
                    size="sm"
                    className="border-[#5F6B6D] text-[#5F6B6D]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[#5F6B6D] text-xs">Ordem</Label>
                    <Input
                      type="number"
                      min="1"
                      value={novaFotoEtapa.ordem || ''}
                      onChange={(e) => setNovaFotoEtapa(prev => ({ 
                        ...prev, 
                        ordem: parseInt(e.target.value) || 1 
                      }))}
                      className="text-sm"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label className="text-[#5F6B6D] text-xs">Etapa *</Label>
                    <Input
                      placeholder="Ex: Cortar a carne"
                      value={novaFotoEtapa.etapa || ''}
                      onChange={(e) => setNovaFotoEtapa(prev => ({ 
                        ...prev, 
                        etapa: e.target.value 
                      }))}
                      className="text-sm"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[#5F6B6D] text-xs">Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Detalhes adicionais sobre esta etapa..."
                    value={novaFotoEtapa.descricao || ''}
                    onChange={(e) => setNovaFotoEtapa(prev => ({ 
                      ...prev, 
                      descricao: e.target.value 
                    }))}
                    className="text-sm h-20"
                    disabled={disabled}
                  />
                </div>

                <div>
                  <Label className="text-[#5F6B6D] text-xs">Foto *</Label>
                  {novaFotoEtapa.foto_url ? (
                    <div className="relative mt-2">
                      <img 
                        src={novaFotoEtapa.foto_url} 
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        onClick={() => setNovaFotoEtapa(prev => ({ ...prev, foto_url: '' }))}
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        disabled={disabled}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-[#DFBFBF] rounded-lg p-4 text-center mt-2">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadFotoEtapa}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={disabled || uploadingEtapa}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-[#4AC5BB] text-[#4AC5BB]"
                          disabled={disabled || uploadingEtapa}
                        >
                          {uploadingEtapa ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Selecionar Foto
                            </>
                          )}
                        </Button>
                      </div>
                      {uploadingEtapa && (
                        <div className="mt-3">
                          <Progress value={progressoEtapa} className="h-2" />
                          <p className="text-xs text-[#5F6B6D] text-center mt-1">
                            {progressoEtapa}% - Fazendo upload...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={adicionarFotoEtapa}
                  className="w-full bg-[#4AC5BB] hover:bg-[#3599B8] text-white text-sm"
                  disabled={disabled || !novaFotoEtapa.etapa || !novaFotoEtapa.foto_url}
                >
                  Adicionar Etapa
                </Button>
              </CardContent>
            </Card>
          )}

          {fotosPreparoEtapas.length === 0 && (
            <div className="text-center py-8 text-[#5F6B6D]">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma foto de preparo adicionada</p>
              <p className="text-xs">Clique em "Adicionar Etapa" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}