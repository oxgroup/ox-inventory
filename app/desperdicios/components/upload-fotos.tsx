"use client"

import { useState, useRef } from "react"
import { Camera, Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react"
import type { FotoDesperdicio } from "../../shared/lib/desperdicios-service"

interface UploadFotosProps {
  fotos: FotoDesperdicio[]
  onFotosChange: (fotos: FotoDesperdicio[]) => void
  maxFotos?: number
  maxTamanho?: number // em MB
}

export function UploadFotos({ 
  fotos, 
  onFotosChange, 
  maxFotos = 5, 
  maxTamanho = 5 
}: UploadFotosProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  const validarArquivo = (file: File): string | null => {
    if (!tiposPermitidos.includes(file.type)) {
      return 'Apenas imagens JPG, PNG e WebP são permitidas'
    }
    
    if (file.size > maxTamanho * 1024 * 1024) {
      return `Arquivo deve ter no máximo ${maxTamanho}MB`
    }
    
    return null
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (fotos.length + files.length > maxFotos) {
      setError(`Máximo de ${maxFotos} fotos permitidas`)
      return
    }
    
    setError('')
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const erroValidacao = validarArquivo(file)
      
      if (erroValidacao) {
        setError(erroValidacao)
        continue
      }
      
      try {
        setUploadingIndex(fotos.length + i)
        
        // Converter arquivo para base64 para preview (simulando upload)
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        
        const base64 = await base64Promise
        
        // Simular delay de upload
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const novaFoto: FotoDesperdicio = {
          url: base64, // Em produção, seria a URL do storage
          nome: file.name,
          tamanho: file.size,
          tipo: file.type,
          data_upload: new Date().toISOString()
        }
        
        onFotosChange([...fotos, novaFoto])
        
      } catch (error) {
        console.error('Erro no upload:', error)
        setError('Erro ao fazer upload da imagem')
      } finally {
        setUploadingIndex(null)
      }
    }
    
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removerFoto = (index: number) => {
    const novasFotos = fotos.filter((_, i) => i !== index)
    onFotosChange(novasFotos)
  }

  const formatarTamanho = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    
    // Simular evento de input
    const input = fileInputRef.current
    if (input) {
      const dt = new DataTransfer()
      files.forEach(file => dt.items.add(file))
      input.files = dt.files
      
      const event = {
        target: input,
        currentTarget: input
      } as React.ChangeEvent<HTMLInputElement>
      
      handleFileSelect(event)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${fotos.length >= maxFotos 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-[#3599B8] bg-[#3599B8]/5 hover:bg-[#3599B8]/10'
          }
        `}
        onClick={() => {
          if (fotos.length < maxFotos && fileInputRef.current) {
            fileInputRef.current.click()
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={fotos.length >= maxFotos}
        />
        
        {fotos.length >= maxFotos ? (
          <div className="text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Limite de {maxFotos} fotos atingido</p>
          </div>
        ) : (
          <div className="text-[#3599B8]">
            <Upload className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              Clique ou arraste fotos aqui
            </p>
            <p className="text-sm text-[#5F6B6D]/60">
              JPG, PNG ou WebP • Máximo {maxTamanho}MB por foto
            </p>
            <p className="text-xs text-[#5F6B6D]/60 mt-1">
              {fotos.length}/{maxFotos} fotos adicionadas
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Preview das Fotos */}
      {fotos.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-[#5F6B6D]">
            <Camera className="w-4 h-4 inline mr-2" />
            Fotos Selecionadas ({fotos.length})
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fotos.map((foto, index) => (
              <div key={index} className="relative group">
                <div className="relative bg-white rounded-lg border border-[#E8E8E8] overflow-hidden">
                  {/* Preview da Imagem */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <img
                      src={foto.url}
                      alt={foto.nome}
                      className="max-w-full max-h-full object-cover"
                      onError={(e) => {
                        // Fallback se a imagem não carregar
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center text-gray-400">
                            <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                            </svg>
                          </div>
                        `
                      }}
                    />
                  </div>
                  
                  {/* Informações */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-[#5F6B6D] truncate" title={foto.nome}>
                      {foto.nome}
                    </p>
                    <p className="text-xs text-[#5F6B6D]/60">
                      {formatarTamanho(foto.tamanho)}
                    </p>
                  </div>
                  
                  {/* Botão Remover */}
                  <button
                    onClick={() => removerFoto(index)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* Loading Overlay */}
                  {uploadingIndex === index && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-sm">Enviando...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dicas */}
      {fotos.length === 0 && (
        <div className="bg-[#F4DDAE]/30 rounded-lg border-2 border-[#fabd07]/20 p-4">
          <h4 className="font-medium text-[#5F6B6D] mb-2">
            📸 Dicas para melhores fotos
          </h4>
          <ul className="text-sm text-[#5F6B6D]/80 space-y-1">
            <li>• Tire fotos dos produtos desperdiçados para documentação</li>
            <li>• Use boa iluminação para melhor qualidade</li>
            <li>• Fotografe diferentes ângulos quando necessário</li>
            <li>• Fotos ajudam na análise posterior dos desperdícios</li>
          </ul>
        </div>
      )}
    </div>
  )
}