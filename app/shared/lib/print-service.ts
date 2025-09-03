/// <reference path="../types/webusb.d.ts" />
import { QRCodeData } from './transformacao-service'
import { QRService } from './qr-service'

// Interface para impressora
export interface PrinterDevice {
  deviceId: string
  productName: string
  manufacturerName: string
  connected: boolean
}

// Comandos ESC/POS para Elgin LP42PRO
export class ESCPOSCommands {
  // Comandos básicos
  static ESC = '\x1B'
  static GS = '\x1D'
  static LF = '\x0A'
  static CR = '\x0D'
  static CUT = '\x1D\x56\x00' // Corte total
  static INIT = '\x1B\x40' // Inicializar impressora

  // Alinhamento
  static ALIGN_LEFT = '\x1B\x61\x00'
  static ALIGN_CENTER = '\x1B\x61\x01'
  static ALIGN_RIGHT = '\x1B\x61\x02'

  // Tamanhos de fonte
  static FONT_SIZE_NORMAL = '\x1D\x21\x00'
  static FONT_SIZE_DOUBLE_HEIGHT = '\x1D\x21\x01'
  static FONT_SIZE_DOUBLE_WIDTH = '\x1D\x21\x10'
  static FONT_SIZE_DOUBLE = '\x1D\x21\x11'

  // Estilos de texto
  static BOLD_ON = '\x1B\x45\x01'
  static BOLD_OFF = '\x1B\x45\x00'
  static UNDERLINE_ON = '\x1B\x2D\x01'
  static UNDERLINE_OFF = '\x1B\x2D\x00'

  // QR Code (Modelo 2)
  static qrCode(data: string): string {
    const dataLength = data.length
    const pL = dataLength % 256
    const pH = Math.floor(dataLength / 256)
    
    return [
      '\x1D\x28\x6B\x04\x00\x31\x41\x32\x00', // Selecionar modelo QR Code 2
      '\x1D\x28\x6B\x03\x00\x31\x43\x08', // Definir tamanho do módulo (8)
      '\x1D\x28\x6B\x03\x00\x31\x45\x31', // Nível de correção de erro L
      `\x1D\x28\x6B${String.fromCharCode(pL + 3, pH)}\x31\x50\x30${data}`, // Armazenar dados
      '\x1D\x28\x6B\x03\x00\x31\x51\x30' // Imprimir QR Code
    ].join('')
  }

  // Linha separadora
  static separatorLine(char: string = '-', length: number = 32): string {
    return char.repeat(length) + this.LF
  }

  // Texto centralizado com padding
  static centerText(text: string, width: number = 32): string {
    if (text.length >= width) return text.substring(0, width)
    
    const padding = Math.floor((width - text.length) / 2)
    return ' '.repeat(padding) + text + ' '.repeat(width - text.length - padding)
  }

  // Texto justificado (esquerda-direita)
  static justifyText(left: string, right: string, width: number = 32): string {
    const totalContent = left.length + right.length
    if (totalContent >= width) {
      return left.substring(0, width - right.length) + right
    }
    
    const spaces = width - totalContent
    return left + ' '.repeat(spaces) + right
  }
}

// Serviço principal de impressão
export class PrintService {
  private device: USBDevice | null = null
  private interface: USBInterface | null = null
  private endpoint: USBEndpoint | null = null

  // Verificar se WebUSB está disponível
  static isWebUSBSupported(): boolean {
    return 'usb' in navigator && typeof navigator.usb.requestDevice === 'function'
  }

  // Verificar permissões detalhadamente
  static async checkPermissions(): Promise<{ 
    webUSBSupported: boolean, 
    httpsRequired: boolean, 
    browserSupported: boolean,
    edgeFlags: string[]
  }> {
    const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    const userAgent = navigator.userAgent.toLowerCase()
    const isEdge = userAgent.includes('edg/')
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg/')
    
    return {
      webUSBSupported: 'usb' in navigator,
      httpsRequired: !isHTTPS,
      browserSupported: isEdge || isChrome,
      edgeFlags: isEdge ? [
        'edge://flags/#enable-experimental-web-platform-features',
        'edge://flags/#enable-webusb-device-detection'
      ] : []
    }
  }

  // Instruções específicas para Edge
  static getEdgeSetupInstructions(): string {
    return `
🔧 CONFIGURAR MICROSOFT EDGE PARA WEBUSB:

1. **Habilitar Flags Experimentais:**
   • Digite: edge://flags/ na barra de endereços
   • Procure por: "Experimental Web Platform features"
   • Altere para: "Enabled"
   • Procure por: "WebUSB Device Detection"  
   • Altere para: "Enabled"
   • Reinicie o Edge

2. **Verificar Permissões do Site:**
   • Clique no ícone do cadeado na barra de endereços
   • Vá em "Permissões para este site"
   • Certifique-se que "Dispositivos USB" está permitido

3. **Configurações de Privacidade:**
   • Edge > Configurações > Cookies e permissões de site
   • Role até "Dispositivos USB"
   • Adicione este site à lista de permitidos

4. **Se ainda não funcionar:**
   • Use Google Chrome (tem melhor suporte WebUSB)
   • Ou execute como administrador
   • Verifique se a impressora não está em uso por outro app

5. **Teste de Conectividade:**
   • Abra o console (F12) e digite: navigator.usb
   • Deve retornar um objeto (não undefined)
    `
  }

  // Listar dispositivos USB disponíveis (sem solicitar permissão)
  async getAvailableDevices(): Promise<USBDevice[]> {
    if (!PrintService.isWebUSBSupported()) {
      return []
    }

    try {
      const devices = await navigator.usb.getDevices()
      return devices.filter(device => {
        // Fabricantes conhecidos de impressoras
        const knownVendors = [
          0x0DD4, // Elgin
          0x04B8, // Epson
          0x04E8, // Samsung
          0x067B, // Prolific
          0x1CBE, // Verifone
          0x0483, // STMicroelectronics
          0x10C4, // Silicon Labs
          0x0403  // FTDI
        ]
        
        return knownVendors.includes(device.vendorId)
      })
    } catch (error) {
      console.error('Erro ao listar dispositivos:', error)
      return []
    }
  }

  // Conectar com qualquer dispositivo USB (modo desenvolvedor)
  async connectAnyDevice(): Promise<boolean> {
    if (!PrintService.isWebUSBSupported()) {
      throw new Error('WebUSB não é suportado neste navegador. Use Chrome, Edge ou Opera.')
    }

    try {
      console.log('🔧 Modo desenvolvedor: Mostrando todos os dispositivos USB...')
      
      // Solicitar QUALQUER dispositivo USB (sem filtros)
      const device = await navigator.usb.requestDevice({
        filters: [] // Array vazio = mostrar todos os dispositivos
      })

      await this.setupDevice(device)
      return true

    } catch (error: any) {
      console.error('❌ Erro ao conectar dispositivo:', error)
      if (error.name === 'NotFoundError' || error.message.includes('No device selected')) {
        throw new Error('Nenhum dispositivo selecionado. Tente novamente e selecione a impressora Elgin LP42PRO na lista.')
      }
      throw error
    }
  }

  // Método auxiliar para configurar o dispositivo
  private async setupDevice(device: USBDevice): Promise<void> {
    // Abrir dispositivo (será ignorado se já estiver aberto)
    try {
      await device.open()
    } catch (error: any) {
      if (!error.message?.includes('already opened')) {
        throw error
      }
    }
    
    // Selecionar configuração
    if (device.configuration === null) {
      await device.selectConfiguration(1)
    }

    // Procurar interface de impressão ou interface genérica
    let configInterface = device.configuration?.interfaces.find(
      iface => iface.alternates[0].interfaceClass === 7 // Printer class
    )

    // Se não encontrar interface de impressora, tentar a primeira interface disponível
    if (!configInterface && device.configuration?.interfaces.length > 0) {
      configInterface = device.configuration.interfaces[0]
      console.log('⚠️  Interface de impressão não encontrada, usando primeira interface disponível')
    }

    if (!configInterface) {
      throw new Error('Nenhuma interface USB disponível no dispositivo')
    }

    await device.claimInterface(configInterface.interfaceNumber)

    // Procurar endpoint de saída
    const outputEndpoint = configInterface.alternates[0].endpoints.find(
      endpoint => endpoint.direction === 'out'
    )

    if (!outputEndpoint) {
      throw new Error('Endpoint de saída não encontrado. Este dispositivo pode não ser compatível.')
    }

    this.device = device
    this.interface = configInterface
    this.endpoint = outputEndpoint

    console.log('✅ Dispositivo conectado:', {
      name: device.productName || 'Dispositivo USB',
      vendor: device.manufacturerName || 'Fabricante desconhecido',
      vendorId: '0x' + device.vendorId.toString(16).padStart(4, '0'),
      productId: '0x' + device.productId.toString(16).padStart(4, '0'),
      interfaceClass: configInterface.alternates[0].interfaceClass,
      endpointNumber: outputEndpoint.endpointNumber
    })
  }

  // Solicitar permissão e conectar com impressora
  async connect(): Promise<boolean> {
    if (!PrintService.isWebUSBSupported()) {
      throw new Error('WebUSB não é suportado neste navegador. Use Chrome, Edge ou Opera.')
    }

    try {
      // Primeiro verificar se já existem dispositivos autorizados
      const authorizedDevices = await this.getAvailableDevices()
      let device: USBDevice | null = null

      if (authorizedDevices.length > 0) {
        // Usar o primeiro dispositivo autorizado
        device = authorizedDevices[0]
        console.log('📋 Usando dispositivo já autorizado:', device.productName || 'Dispositivo USB')
      } else {
        // Solicitar novo dispositivo USB (filtros amplos para impressoras)
        try {
          device = await navigator.usb.requestDevice({
            filters: [
              // Filtros específicos por fabricante
              { vendorId: 0x0DD4 }, // Elgin
              { vendorId: 0x04B8 }, // Epson
              { vendorId: 0x04E8 }, // Samsung
              { vendorId: 0x067B }, // Prolific (usado por algumas Elgin)
              { vendorId: 0x1CBE }, // Verifone (algumas impressoras)
              { vendorId: 0x0483 }, // STMicroelectronics (chips USB)
              
              // Filtros por classe de dispositivo (impressoras)
              { classCode: 7 }, // Printer class
              { classCode: 7, subclassCode: 1 }, // Printer subclass
              { classCode: 7, subclassCode: 1, protocolCode: 1 }, // Unidirectional
              { classCode: 7, subclassCode: 1, protocolCode: 2 }, // Bidirectional
              { classCode: 7, subclassCode: 1, protocolCode: 3 }, // IEEE 1284.4
              
              // Filtro genérico para dispositivos USB-Serial (muitas impressoras térmicas)
              { classCode: 2 }, // Communications Device Class
              { vendorId: 0x10C4 }, // Silicon Labs (conversores USB-Serial)
              { vendorId: 0x0403 }  // FTDI (conversores USB-Serial)
            ]
          })
        } catch (requestError: any) {
          if (requestError.name === 'NotFoundError' || requestError.message.includes('No device selected')) {
            throw new Error('Nenhum dispositivo foi selecionado. Por favor, conecte a impressora Elgin LP42PRO via USB e tente novamente.')
          }
          throw requestError
        }
      }

      if (!device) {
        throw new Error('Dispositivo não encontrado')
      }

      await this.setupDevice(device)
      return true

    } catch (error: any) {
      console.error('❌ Erro ao conectar impressora:', error)
      
      // Melhorar mensagens de erro para o usuário
      if (error.name === 'NotFoundError' || error.message.includes('No device selected')) {
        throw new Error('Nenhuma impressora foi selecionada. Conecte a impressora Elgin LP42PRO via USB e selecione-a no diálogo.')
      } else if (error.name === 'SecurityError') {
        throw new Error('Acesso negado à impressora. Verifique as permissões do navegador.')
      } else if (error.name === 'NetworkError') {
        throw new Error('Erro de comunicação com a impressora. Verifique a conexão USB.')
      } else if (error.message?.includes('device is already opened')) {
        throw new Error('A impressora já está sendo usada por outro processo. Feche outros aplicativos que possam estar usando a impressora.')
      }
      
      throw error
    }
  }

  // Desconectar impressora
  async disconnect(): Promise<void> {
    if (this.device && this.interface) {
      try {
        await this.device.releaseInterface(this.interface.interfaceNumber)
        await this.device.close()
      } catch (error) {
        console.warn('Erro ao desconectar impressora:', error)
      }
    }

    this.device = null
    this.interface = null
    this.endpoint = null
  }

  // Enviar dados para impressora
  private async sendData(data: string): Promise<void> {
    if (!this.device || !this.endpoint) {
      throw new Error('Impressora não conectada')
    }

    try {
      const encoder = new TextEncoder()
      const buffer = encoder.encode(data)
      
      await this.device.transferOut(this.endpoint.endpointNumber, buffer)
      
    } catch (error) {
      console.error('❌ Erro ao enviar dados:', error)
      throw error
    }
  }

  // Imprimir etiqueta única
  async printLabel(etiquetaData: QRCodeData): Promise<void> {
    if (!this.device) {
      throw new Error('Impressora não conectada')
    }

    try {
      // Formatações
      const dataValidade = new Date(etiquetaData.validade).toLocaleDateString('pt-BR')
      const pesoFormatado = `${etiquetaData.peso}${etiquetaData.unidade}`
      const pecaFormatada = `#${etiquetaData.peca.toString().padStart(3, '0')}`
      const nomeReduzido = etiquetaData.nome.substring(0, 20).toUpperCase()

      // Construir comando de impressão
      let printData = ''
      
      // Inicializar
      printData += ESCPOSCommands.INIT
      printData += ESCPOSCommands.FONT_SIZE_NORMAL
      
      // QR Code
      const qrString = JSON.stringify(etiquetaData)
      printData += ESCPOSCommands.ALIGN_LEFT
      printData += ESCPOSCommands.qrCode(qrString)
      printData += ESCPOSCommands.LF
      
      // Nome do produto (negrito e maior)
      printData += ESCPOSCommands.BOLD_ON
      printData += ESCPOSCommands.FONT_SIZE_DOUBLE_WIDTH
      printData += ESCPOSCommands.ALIGN_CENTER
      printData += nomeReduzido + ESCPOSCommands.LF
      printData += ESCPOSCommands.FONT_SIZE_NORMAL
      printData += ESCPOSCommands.BOLD_OFF
      
      // Peso e Peça
      printData += ESCPOSCommands.ALIGN_LEFT
      printData += ESCPOSCommands.justifyText(pesoFormatado, `Peca ${pecaFormatada}`, 32)
      printData += ESCPOSCommands.LF
      
      // Lote
      printData += `Lote: ${etiquetaData.lote}` + ESCPOSCommands.LF
      
      // Validade (negrito)
      printData += ESCPOSCommands.BOLD_ON
      printData += `Val: ${dataValidade}` + ESCPOSCommands.LF
      printData += ESCPOSCommands.BOLD_OFF
      
      // Separador e corte
      printData += ESCPOSCommands.separatorLine('=', 32)
      printData += ESCPOSCommands.LF
      printData += ESCPOSCommands.CUT

      // Enviar para impressora
      await this.sendData(printData)
      
      console.log('✅ Etiqueta impressa:', etiquetaData.lote, etiquetaData.peca)

    } catch (error) {
      console.error('❌ Erro ao imprimir etiqueta:', error)
      throw error
    }
  }

  // Imprimir múltiplas etiquetas
  async printLabels(etiquetas: QRCodeData[]): Promise<void> {
    if (!etiquetas.length) {
      throw new Error('Nenhuma etiqueta para imprimir')
    }

    console.log('🖨️ Imprimindo', etiquetas.length, 'etiquetas...')

    for (let i = 0; i < etiquetas.length; i++) {
      try {
        await this.printLabel(etiquetas[i])
        
        // Pequena pausa entre etiquetas
        if (i < etiquetas.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
      } catch (error) {
        console.error(`Erro ao imprimir etiqueta ${i + 1}:`, error)
        throw error
      }
    }

    console.log('✅ Todas as etiquetas impressas com sucesso')
  }

  // Imprimir etiqueta de teste
  async printTestLabel(): Promise<void> {
    const testData: QRCodeData = {
      lote: 'TESTE001',
      peca: 1,
      produto: 'TEST_PRODUTO',
      nome: 'PRODUTO DE TESTE',
      peso: 250,
      unidade: 'g',
      validade: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      producao: new Date().toISOString().split('T')[0],
      transformacao: 'test-id',
      codigo_barras: 'TESTE001-001',
      criado: new Date().toISOString()
    }

    await this.printLabel(testData)
  }

  // Verificar status da impressora
  async checkStatus(): Promise<{ connected: boolean; deviceName: string | null }> {
    return {
      connected: this.device !== null && this.endpoint !== null,
      deviceName: this.device?.productName || null
    }
  }

  // Método alternativo: Gerar arquivo de comandos ESC/POS para impressão manual
  generatePrintFile(etiquetaData: QRCodeData): Blob {
    try {
      // Formatações
      const dataValidade = new Date(etiquetaData.validade).toLocaleDateString('pt-BR')
      const pesoFormatado = `${etiquetaData.peso}${etiquetaData.unidade}`
      const pecaFormatada = `#${etiquetaData.peca.toString().padStart(3, '0')}`
      const nomeReduzido = etiquetaData.nome.substring(0, 20).toUpperCase()

      // Construir comando de impressão
      let printData = ''
      
      // Inicializar
      printData += ESCPOSCommands.INIT
      printData += ESCPOSCommands.FONT_SIZE_NORMAL
      
      // QR Code
      const qrString = JSON.stringify(etiquetaData)
      printData += ESCPOSCommands.ALIGN_LEFT
      printData += ESCPOSCommands.qrCode(qrString)
      printData += ESCPOSCommands.LF
      
      // Nome do produto (negrito e maior)
      printData += ESCPOSCommands.BOLD_ON
      printData += ESCPOSCommands.FONT_SIZE_DOUBLE_WIDTH
      printData += ESCPOSCommands.ALIGN_CENTER
      printData += nomeReduzido + ESCPOSCommands.LF
      printData += ESCPOSCommands.FONT_SIZE_NORMAL
      printData += ESCPOSCommands.BOLD_OFF
      
      // Peso e Peça
      printData += ESCPOSCommands.ALIGN_LEFT
      printData += ESCPOSCommands.justifyText(pesoFormatado, `Peca ${pecaFormatada}`, 32)
      printData += ESCPOSCommands.LF
      
      // Lote
      printData += `Lote: ${etiquetaData.lote}` + ESCPOSCommands.LF
      
      // Validade (negrito)
      printData += ESCPOSCommands.BOLD_ON
      printData += `Val: ${dataValidade}` + ESCPOSCommands.LF
      printData += ESCPOSCommands.BOLD_OFF
      
      // Separador e corte
      printData += ESCPOSCommands.separatorLine('=', 32)
      printData += ESCPOSCommands.LF
      printData += ESCPOSCommands.CUT

      // Criar blob com os dados binários
      const encoder = new TextEncoder()
      const buffer = encoder.encode(printData)
      
      return new Blob([buffer], { type: 'application/octet-stream' })
      
    } catch (error) {
      console.error('❌ Erro ao gerar arquivo de impressão:', error)
      throw error
    }
  }

  // Gerar múltiplos arquivos de impressão
  generateMultiplePrintFiles(etiquetas: QRCodeData[]): Blob {
    try {
      let allData = ''
      
      for (let i = 0; i < etiquetas.length; i++) {
        const etiqueta = etiquetas[i]
        
        // Formatações
        const dataValidade = new Date(etiqueta.validade).toLocaleDateString('pt-BR')
        const pesoFormatado = `${etiqueta.peso}${etiqueta.unidade}`
        const pecaFormatada = `#${etiqueta.peca.toString().padStart(3, '0')}`
        const nomeReduzido = etiqueta.nome.substring(0, 20).toUpperCase()

        // Comando para esta etiqueta
        let printData = ''
        
        // Inicializar (apenas na primeira)
        if (i === 0) {
          printData += ESCPOSCommands.INIT
        }
        
        printData += ESCPOSCommands.FONT_SIZE_NORMAL
        
        // QR Code
        const qrString = JSON.stringify(etiqueta)
        printData += ESCPOSCommands.ALIGN_LEFT
        printData += ESCPOSCommands.qrCode(qrString)
        printData += ESCPOSCommands.LF
        
        // Nome do produto (negrito e maior)
        printData += ESCPOSCommands.BOLD_ON
        printData += ESCPOSCommands.FONT_SIZE_DOUBLE_WIDTH
        printData += ESCPOSCommands.ALIGN_CENTER
        printData += nomeReduzido + ESCPOSCommands.LF
        printData += ESCPOSCommands.FONT_SIZE_NORMAL
        printData += ESCPOSCommands.BOLD_OFF
        
        // Peso e Peça
        printData += ESCPOSCommands.ALIGN_LEFT
        printData += ESCPOSCommands.justifyText(pesoFormatado, `Peca ${pecaFormatada}`, 32)
        printData += ESCPOSCommands.LF
        
        // Lote
        printData += `Lote: ${etiqueta.lote}` + ESCPOSCommands.LF
        
        // Validade (negrito)
        printData += ESCPOSCommands.BOLD_ON
        printData += `Val: ${dataValidade}` + ESCPOSCommands.LF
        printData += ESCPOSCommands.BOLD_OFF
        
        // Separador e corte
        printData += ESCPOSCommands.separatorLine('=', 32)
        printData += ESCPOSCommands.LF
        printData += ESCPOSCommands.CUT

        allData += printData
      }

      // Criar blob com todos os dados
      const encoder = new TextEncoder()
      const buffer = encoder.encode(allData)
      
      return new Blob([buffer], { type: 'application/octet-stream' })
      
    } catch (error) {
      console.error('❌ Erro ao gerar arquivos de impressão:', error)
      throw error
    }
  }

  // Baixar arquivo de comandos para impressão manual
  downloadPrintFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  // Listar informações sobre dispositivos autorizados
  async getDeviceInfo(): Promise<PrinterDevice[]> {
    const devices = await this.getAvailableDevices()
    
    return devices.map(device => ({
      deviceId: device.serialNumber || 'unknown',
      productName: device.productName || 'Dispositivo USB',
      manufacturerName: device.manufacturerName || 'Desconhecido',
      connected: this.device === device
    }))
  }

  // Método estático para verificar se existem impressoras instaladas no Windows
  static getPrinterInstructions(): string {
    return `
📋 COMO CONECTAR A IMPRESSORA ELGIN LP42PRO:

1. **Conexão Física:**
   • Conecte a impressora via cabo USB
   • Ligue a impressora
   • Instale os drivers da Elgin LP42PRO (se necessário)

2. **Navegador:**
   • Use Chrome, Edge ou Opera (WebUSB suportado)
   • Permita acesso a dispositivos USB quando solicitado

3. **Primeiro Uso:**
   • Clique em "Conectar Impressora"
   • Selecione a impressora na lista do navegador
   • Teste a impressão com "Teste"

4. **Se não aparecer na lista:**
   • Verifique se os drivers estão instalados
   • Teste a impressora no Windows (imprimir página de teste)
   • Reconecte o cabo USB
   • Atualize a página e tente novamente
    `
  }
}

// Instância singleton do serviço de impressão
export const printService = new PrintService()

// Funções utilitárias
export const PrintUtils = {
  // Formatar texto para largura da impressora
  formatText(text: string, width: number = 32): string {
    if (text.length <= width) return text
    return text.substring(0, width - 3) + '...'
  },

  // Converter peso para string formatada
  formatWeight(peso: number, unidade: string = 'g'): string {
    if (unidade === 'kg' && peso < 1) {
      return `${(peso * 1000).toFixed(0)}g`
    }
    return `${peso}${unidade}`
  },

  // Validar dados antes da impressão
  validateLabelData(data: QRCodeData): boolean {
    const required = ['lote', 'peca', 'produto', 'nome', 'peso', 'validade']
    return required.every(field => data[field as keyof QRCodeData] != null)
  }
}