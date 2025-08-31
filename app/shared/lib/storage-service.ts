import { useState } from "react"
import { supabase } from "./supabase"

export interface UploadResult {
  url: string
  path: string
  success: boolean
  error?: string
}

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

// Service para gerenciar uploads de fotos no Supabase Storage
export const storageService = {
  
  // Comprimir imagem antes do upload
  async compressImage(file: File, options: CompressOptions = {}): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8
    } = options

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Calcular dimensões mantendo proporção
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        // Configurar canvas
        canvas.width = width
        canvas.height = height

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file) // Fallback para arquivo original
            }
          },
          file.type,
          quality
        )
      }

      img.onerror = () => resolve(file) // Fallback para arquivo original
      img.src = URL.createObjectURL(file)
    })
  },

  // Upload de foto do prato finalizado
  async uploadFotoPrato(file: File, pratoId: string, usuarioId: string): Promise<UploadResult> {
    try {
      // Comprimir imagem
      const compressedFile = await this.compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85
      })

      // Gerar nome único do arquivo
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const fileName = `prato_${pratoId}_${timestamp}.${extension}`
      const filePath = `fichas-tecnicas/pratos/${usuarioId}/${fileName}`

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('fichas-tecnicas-fotos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Erro no upload:', error)
        return {
          url: '',
          path: '',
          success: false,
          error: error.message
        }
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('fichas-tecnicas-fotos')
        .getPublicUrl(data.path)

      return {
        url: urlData.publicUrl,
        path: data.path,
        success: true
      }

    } catch (error) {
      console.error('Erro no upload da foto do prato:', error)
      return {
        url: '',
        path: '',
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Upload de foto de etapa do preparo
  async uploadFotoEtapa(file: File, pratoId: string, usuarioId: string, etapa: number): Promise<UploadResult> {
    try {
      // Comprimir imagem (mais agressivo para fotos de etapa)
      const compressedFile = await this.compressImage(file, {
        maxWidth: 1200,
        maxHeight: 900,
        quality: 0.75
      })

      // Gerar nome único do arquivo
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const fileName = `etapa_${etapa}_${timestamp}.${extension}`
      const filePath = `fichas-tecnicas/etapas/${usuarioId}/${pratoId}/${fileName}`

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('fichas-tecnicas-fotos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Erro no upload da etapa:', error)
        return {
          url: '',
          path: '',
          success: false,
          error: error.message
        }
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('fichas-tecnicas-fotos')
        .getPublicUrl(data.path)

      return {
        url: urlData.publicUrl,
        path: data.path,
        success: true
      }

    } catch (error) {
      console.error('Erro no upload da foto da etapa:', error)
      return {
        url: '',
        path: '',
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Remover foto do storage
  async removerFoto(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('fichas-tecnicas-fotos')
        .remove([filePath])

      if (error) {
        console.error('Erro ao remover foto:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao remover foto:', error)
      return false
    }
  },

  // Listar fotos de um prato
  async listarFotosPrato(usuarioId: string, pratoId?: string): Promise<string[]> {
    try {
      const prefix = pratoId 
        ? `fichas-tecnicas/etapas/${usuarioId}/${pratoId}/`
        : `fichas-tecnicas/pratos/${usuarioId}/`

      const { data, error } = await supabase.storage
        .from('fichas-tecnicas-fotos')
        .list(prefix)

      if (error) {
        console.error('Erro ao listar fotos:', error)
        return []
      }

      return data?.map(file => file.name) || []
    } catch (error) {
      console.error('Erro ao listar fotos:', error)
      return []
    }
  },

  // Validar arquivo de imagem
  validarArquivoImagem(file: File): { valido: boolean; erro?: string } {
    // Verificar tipo do arquivo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!tiposPermitidos.includes(file.type)) {
      return {
        valido: false,
        erro: 'Formato não suportado. Use JPEG, PNG ou WebP.'
      }
    }

    // Verificar tamanho (máximo 10MB)
    const tamanhoMaximo = 10 * 1024 * 1024 // 10MB em bytes
    if (file.size > tamanhoMaximo) {
      return {
        valido: false,
        erro: 'Arquivo muito grande. Máximo 10MB.'
      }
    }

    return { valido: true }
  },

  // Gerar thumbnail para preview
  async gerarThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          
          // Dimensões do thumbnail
          const size = 150
          canvas.width = size
          canvas.height = size
          
          // Calcular crop para manter proporção quadrada
          const minDim = Math.min(img.width, img.height)
          const sx = (img.width - minDim) / 2
          const sy = (img.height - minDim) / 2
          
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }
}

// Hook personalizado para uploads
export function useUploadFotos() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const uploadFotoPrato = async (file: File, pratoId: string, usuarioId: string): Promise<UploadResult> => {
    setUploading(true)
    setProgress(0)
    
    try {
      // Simular progresso
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 100)
      
      const result = await storageService.uploadFotoPrato(file, pratoId, usuarioId)
      
      clearInterval(interval)
      setProgress(100)
      
      return result
    } finally {
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
      }, 500)
    }
  }

  const uploadFotoEtapa = async (file: File, pratoId: string, usuarioId: string, etapa: number): Promise<UploadResult> => {
    setUploading(true)
    setProgress(0)
    
    try {
      // Simular progresso
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 100)
      
      const result = await storageService.uploadFotoEtapa(file, pratoId, usuarioId, etapa)
      
      clearInterval(interval)
      setProgress(100)
      
      return result
    } finally {
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
      }, 500)
    }
  }

  return {
    uploading,
    progress,
    uploadFotoPrato,
    uploadFotoEtapa
  }
}