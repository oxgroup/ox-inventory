import { QRCodeData } from './transformacao-service'

// Biblioteca para geração de QR codes
export class QRService {
  // Gerar QR code como SVG
  static async generateQRCodeSVG(data: QRCodeData): Promise<string> {
    try {
      // Usar a biblioteca qrcode (será instalada)
      const QRCode = (await import('qrcode')).default
      
      const qrString = JSON.stringify(data)
      
      const options = {
        type: 'svg' as const,
        width: 200, // Tamanho do QR code
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const // Nível médio de correção
      }

      const svgString = await QRCode.toString(qrString, options)
      return svgString
    } catch (error) {
      console.error('Erro ao gerar QR code:', error)
      throw new Error('Falha ao gerar QR code')
    }
  }

  // Gerar QR code como Data URL (base64)
  static async generateQRCodeDataURL(data: QRCodeData): Promise<string> {
    try {
      const QRCode = (await import('qrcode')).default
      
      const qrString = JSON.stringify(data)
      
      const options = {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const
      }

      const dataURL = await QRCode.toDataURL(qrString, options)
      return dataURL
    } catch (error) {
      console.error('Erro ao gerar QR code:', error)
      throw new Error('Falha ao gerar QR code')
    }
  }

  // Validar dados do QR code
  static validateQRData(data: QRCodeData): boolean {
    const requiredFields = ['lote', 'peca', 'produto', 'peso', 'validade']
    
    for (const field of requiredFields) {
      if (!data[field as keyof QRCodeData]) {
        return false
      }
    }

    // Validar formato de data
    if (!this.isValidDate(data.validade) || !this.isValidDate(data.producao)) {
      return false
    }

    // Validar peso positivo
    if (data.peso <= 0) {
      return false
    }

    // Validar número da peça
    if (data.peca <= 0) {
      return false
    }

    return true
  }

  // Decodificar QR code
  static decodeQRData(qrString: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrString) as QRCodeData
      
      if (this.validateQRData(data)) {
        return data
      }
      
      return null
    } catch (error) {
      console.error('Erro ao decodificar QR code:', error)
      return null
    }
  }

  // Gerar hash único para QR code
  static generateQRHash(data: QRCodeData): string {
    const qrString = JSON.stringify(data)
    return btoa(qrString).slice(0, 32)
  }

  // Verificar se string é uma data válida
  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }
}

// Interface para configurações de etiqueta
export interface EtiquetaConfig {
  width: number // Largura em mm
  height: number // Altura em mm
  qrSize: number // Tamanho do QR code em mm
  fontSize: {
    titulo: number
    normal: number
    pequeno: number
  }
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// Configuração padrão para Elgin LP42PRO (90x40mm)
export const ETIQUETA_CONFIG_PADRAO: EtiquetaConfig = {
  width: 90,
  height: 40,
  qrSize: 20,
  fontSize: {
    titulo: 8,
    normal: 6,
    pequeno: 5
  },
  margins: {
    top: 2,
    right: 2,
    bottom: 2,
    left: 2
  }
}

// Classe para geração de etiquetas
export class EtiquetaService {
  private config: EtiquetaConfig

  constructor(config: EtiquetaConfig = ETIQUETA_CONFIG_PADRAO) {
    this.config = config
  }

  // Gerar HTML da etiqueta
  async generateLabelHTML(data: QRCodeData): Promise<string> {
    const qrCodeSVG = await QRService.generateQRCodeSVG(data)
    
    // Formatações
    const dataValidade = new Date(data.validade).toLocaleDateString('pt-BR')
    const pesoFormatado = `${data.peso}${data.unidade}`
    const pecaFormatada = `#${data.peca.toString().padStart(3, '0')}`

    const html = `
      <div class="etiqueta" style="
        width: ${this.config.width}mm;
        height: ${this.config.height}mm;
        border: 1px solid #000;
        display: flex;
        padding: ${this.config.margins.top}mm;
        font-family: 'Courier New', monospace;
        font-size: ${this.config.fontSize.normal}pt;
        line-height: 1.1;
        background: white;
        color: black;
        box-sizing: border-box;
        page-break-after: always;
      ">
        <!-- QR Code -->
        <div style="
          width: ${this.config.qrSize}mm;
          height: ${this.config.qrSize}mm;
          margin-right: 2mm;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${qrCodeSVG}
        </div>
        
        <!-- Informações -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-weight: bold;
        ">
          <!-- Nome do produto -->
          <div style="
            font-size: ${this.config.fontSize.titulo}pt;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1;
            margin-bottom: 1mm;
          ">
            ${data.nome.substring(0, 20)}
          </div>
          
          <!-- Peso e Peça -->
          <div style="
            font-size: ${this.config.fontSize.normal}pt;
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
          ">
            <span>${pesoFormatado}</span>
            <span>Peça ${pecaFormatada}</span>
          </div>
          
          <!-- Lote -->
          <div style="
            font-size: ${this.config.fontSize.pequeno}pt;
            margin-bottom: 1mm;
          ">
            Lote: ${data.lote}
          </div>
          
          <!-- Validade -->
          <div style="
            font-size: ${this.config.fontSize.normal}pt;
            font-weight: bold;
          ">
            Val: ${dataValidade}
          </div>
        </div>
      </div>
    `

    return html
  }

  // Gerar PDF com etiquetas
  async generateLabelsPDF(etiquetas: QRCodeData[]): Promise<Blob> {
    try {
      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default

      // Configurar PDF para o tamanho da etiqueta
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [this.config.width, this.config.height]
      })

      // Container temporário para renderizar etiquetas
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '-9999px'
      document.body.appendChild(container)

      for (let i = 0; i < etiquetas.length; i++) {
        const etiqueta = etiquetas[i]
        
        // Gerar HTML da etiqueta
        const html = await this.generateLabelHTML(etiqueta)
        container.innerHTML = html

        // Converter para canvas
        const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
          width: this.config.width * 3.78, // Conversão mm para px (aproximada)
          height: this.config.height * 3.78,
          scale: 2
        })

        // Adicionar ao PDF
        if (i > 0) {
          pdf.addPage([this.config.width, this.config.height], 'landscape')
        }

        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          0,
          this.config.width,
          this.config.height
        )
      }

      // Limpar container temporário
      document.body.removeChild(container)

      // Retornar como blob
      const pdfBlob = pdf.output('blob')
      return pdfBlob

    } catch (error) {
      console.error('Erro ao gerar PDF das etiquetas:', error)
      throw new Error('Falha ao gerar PDF das etiquetas')
    }
  }

  // Baixar PDF
  downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}