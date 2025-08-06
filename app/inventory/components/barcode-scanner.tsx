"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, CameraOff, RotateCcw, X } from "lucide-react"

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScanned: (barcode: string) => void
}

export function BarcodeScanner({ isOpen, onClose, onScanned }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissaoConcedida, setPermissaoConcedida] = useState<boolean | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceAtual, setDeviceAtual] = useState<string>("")
  const [reader, setReader] = useState<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    if (isOpen) {
      inicializarScanner()
    } else {
      pararScanner()
    }

    return () => {
      pararScanner()
    }
  }, [isOpen])

  const inicializarScanner = async () => {
    try {
      setError(null)
      setScanning(true)

      // Verificar permissão da câmera
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      if (permission.state === 'denied') {
        throw new Error("Permissão da câmera negada. Habilite nas configurações do navegador.")
      }

      // Criar leitor de código de barras
      const codeReader = new BrowserMultiFormatReader()
      setReader(codeReader)

      // Listar dispositivos de câmera
      const videoDevices = await codeReader.listVideoInputDevices()
      setDevices(videoDevices)

      if (videoDevices.length === 0) {
        throw new Error("Nenhuma câmera encontrada no dispositivo")
      }

      // Preferir câmera traseira em dispositivos móveis
      const cameraTraseiraIndex = videoDevices.findIndex(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('environment') ||
        device.label.toLowerCase().includes('rear')
      )
      
      const deviceId = cameraTraseiraIndex >= 0 
        ? videoDevices[cameraTraseiraIndex].deviceId 
        : videoDevices[0].deviceId

      setDeviceAtual(deviceId)
      setPermissaoConcedida(true)

      // Iniciar scanner
      await iniciarScan(codeReader, deviceId)

    } catch (err: any) {
      console.error("Erro ao inicializar scanner:", err)
      setError(err.message || "Erro ao acessar câmera")
      setPermissaoConcedida(false)
      setScanning(false)
    }
  }

  const iniciarScan = async (codeReader: BrowserMultiFormatReader, deviceId: string) => {
    try {
      if (!videoRef.current) return

      await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            // Código encontrado
            const codigo = result.getText()
            console.log("Código escaneado:", codigo)
            
            // Vibrar se disponível
            if ('vibrate' in navigator) {
              navigator.vibrate(100)
            }
            
            onScanned(codigo)
            pararScanner()
          }
          
          if (err && !(err instanceof NotFoundException)) {
            console.error("Erro no scanner:", err)
          }
        }
      )
      
    } catch (err: any) {
      console.error("Erro ao iniciar scan:", err)
      setError("Erro ao iniciar scanner de código")
    }
  }

  const trocarCamera = async () => {
    if (!reader || devices.length <= 1) return

    try {
      const currentIndex = devices.findIndex(d => d.deviceId === deviceAtual)
      const nextIndex = (currentIndex + 1) % devices.length
      const nextDeviceId = devices[nextIndex].deviceId

      setDeviceAtual(nextDeviceId)
      await iniciarScan(reader, nextDeviceId)
    } catch (err) {
      console.error("Erro ao trocar câmera:", err)
      setError("Erro ao trocar câmera")
    }
  }

  const pararScanner = () => {
    try {
      if (reader) {
        reader.reset()
      }
      setScanning(false)
    } catch (err) {
      console.error("Erro ao parar scanner:", err)
    }
  }

  const handleClose = () => {
    pararScanner()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-[95vw] mx-auto max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#fabd07]" />
              Escanear Código de Barras
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black">
          {/* Área do vídeo */}
          <div className="relative aspect-[4/3] w-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Overlay de enquadramento */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Linha de scan animada */}
                <div className="w-64 h-40 border-2 border-[#fabd07] border-dashed rounded-lg relative overflow-hidden">
                  {scanning && (
                    <div className="absolute inset-x-0 h-0.5 bg-[#fabd07] animate-pulse" 
                         style={{
                           animation: 'scan-line 2s ease-in-out infinite',
                           top: '50%'
                         }} />
                  )}
                </div>
                
                {/* Cantos do enquadramento */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-[#fabd07]" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-[#fabd07]" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-[#fabd07]" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-[#fabd07]" />
              </div>
            </div>

            {/* Status overlay */}
            {error && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-center text-white p-4">
                  <CameraOff className="w-12 h-12 mx-auto mb-2 text-[#FB8281]" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Instruções */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/60 rounded-lg p-3 text-center">
              <p className="text-white text-sm">
                {scanning ? "Aponte para o código de barras EAN-13" : "Iniciando câmera..."}
              </p>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="p-4 flex justify-center gap-3">
          {devices.length > 1 && (
            <Button
              onClick={trocarCamera}
              disabled={!scanning}
              className="flex items-center gap-2 bg-[#3599B8] hover:bg-[#4AC5BB]"
            >
              <RotateCcw className="w-4 h-4" />
              Trocar Câmera
            </Button>
          )}
          
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-[#FB8281] text-[#FB8281] hover:bg-[#FB8281]/10"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>

      <style jsx>{`
        @keyframes scan-line {
          0% { top: 0; opacity: 1; }
          50% { opacity: 0.8; }
          100% { top: 100%; opacity: 1; }
        }
      `}</style>
    </Dialog>
  )
}