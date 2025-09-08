"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Printer, Download, QrCode, Eye, Settings, CheckCircle, AlertCircle } from "lucide-react"
import { transformacaoService, type Transformacao, type EtiquetaTransformacao, type QRCodeData } from "../../shared/lib/transformacao-service"
import { QRService, EtiquetaService } from "../../shared/lib/qr-service"
import { printService, PrintService } from "../../shared/lib/print-service"

interface GeradorEtiquetasProps {
  transformacaoId?: string | null
  usuario: any
  onVoltar: () => void
}

export function GeradorEtiquetas({ transformacaoId, usuario, onVoltar }: GeradorEtiquetasProps) {
  const [transformacao, setTransformacao] = useState<Transformacao | null>(null)
  const [etiquetas, setEtiquetas] = useState<EtiquetaTransformacao[]>([])
  const [etiquetasSelecionadas, setEtiquetasSelecionadas] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [gerandoEtiquetas, setGerandoEtiquetas] = useState(false)
  const [impressoraConectada, setImpressoraConectada] = useState(false)
  const [previewEtiqueta, setPreviewEtiqueta] = useState<string | null>(null)
  
  // Configurações
  const [diasValidade, setDiasValidade] = useState(5)

  useEffect(() => {
    if (transformacaoId) {
      carregarDados()
    }
    verificarImpressora()
  }, [transformacaoId])

  const carregarDados = async () => {
    if (!transformacaoId) return
    
    setLoading(true)
    try {
      const [transformacaoData, etiquetasData] = await Promise.all([
        transformacaoService.obter(transformacaoId),
        transformacaoService.obterEtiquetas(transformacaoId)
      ])
      
      setTransformacao(transformacaoData)
      setEtiquetas(etiquetasData)
      setDiasValidade(transformacaoData.dias_validade)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados da transformação')
    } finally {
      setLoading(false)
    }
  }

  const verificarImpressora = async () => {
    try {
      const status = await printService.checkStatus()
      setImpressoraConectada(status.connected)
    } catch (error) {
      setImpressoraConectada(false)
    }
  }

  const conectarImpressora = async () => {
    try {
      // Verificar permissões primeiro
      const permissions = await PrintService.checkPermissions()
      
      if (!permissions.webUSBSupported) {
        alert('❌ WebUSB não está disponível neste navegador.\n\nUse Google Chrome ou Microsoft Edge.')
        return
      }
      
      if (permissions.httpsRequired) {
        alert('❌ WebUSB requer HTTPS ou localhost.\n\nVerifique a URL do site.')
        return
      }
      
      await printService.connect()
      setImpressoraConectada(true)
      alert('✅ Impressora conectada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao conectar impressora:', error)
      
      // Se for erro de permissão e estivermos no Edge, mostrar instruções específicas
      if (error.name === 'SecurityError' || error.message.toLowerCase().includes('acesso negado')) {
        const edgeInstructions = PrintService.getEdgeSetupInstructions()
        if (confirm(`❌ Acesso negado aos dispositivos USB.\n\nEste problema é comum no Edge. Deseja ver as instruções de configuração?`)) {
          alert(edgeInstructions)
        }
      } else {
        // Mostrar instruções gerais
        const instructions = PrintService.getPrinterInstructions()
        
        if (confirm(`❌ ${error.message}\n\nDeseja ver as instruções de conexão?`)) {
          alert(instructions)
        }
      }
    }
  }

  const conectarQualquerDispositivo = async () => {
    if (!confirm('🔧 MODO DESENVOLVEDOR\n\nEste modo mostra TODOS os dispositivos USB conectados.\nApenas use se a impressora não aparecer no modo normal.\n\nContinuar?')) {
      return
    }

    try {
      await printService.connectAnyDevice()
      setImpressoraConectada(true)
      alert('✅ Dispositivo conectado! Teste a impressão antes de usar.')
    } catch (error: any) {
      console.error('Erro ao conectar dispositivo:', error)
      alert(`❌ ${error.message}`)
    }
  }

  const verificarConfiguracoes = async () => {
    try {
      const permissions = await PrintService.checkPermissions()
      const userAgent = navigator.userAgent
      
      let status = '🔍 DIAGNÓSTICO DO NAVEGADOR:\n\n'
      status += `✅ WebUSB Suportado: ${permissions.webUSBSupported ? 'SIM' : 'NÃO'}\n`
      status += `✅ HTTPS/Localhost: ${!permissions.httpsRequired ? 'SIM' : 'NÃO'}\n`
      status += `✅ Navegador Compatível: ${permissions.browserSupported ? 'SIM' : 'NÃO'}\n`
      status += `🌐 Navegador: ${userAgent.includes('Edg') ? 'Microsoft Edge' : userAgent.includes('Chrome') ? 'Google Chrome' : 'Outro'}\n\n`
      
      if (permissions.edgeFlags.length > 0) {
        status += '⚠️ EDGE: Habilite estas flags:\n'
        permissions.edgeFlags.forEach(flag => {
          status += `• ${flag}\n`
        })
      }
      
      alert(status)
      
      if (!permissions.webUSBSupported || permissions.httpsRequired || permissions.edgeFlags.length > 0) {
        if (confirm('Deseja ver as instruções completas de configuração?')) {
          alert(PrintService.getEdgeSetupInstructions())
        }
      }
    } catch (error) {
      console.error('Erro ao verificar configurações:', error)
    }
  }

  const gerarEtiquetas = async () => {
    if (!transformacaoId) return

    setGerandoEtiquetas(true)
    try {
      const novasEtiquetas = await transformacaoService.gerarEtiquetas(transformacaoId, diasValidade)
      setEtiquetas(novasEtiquetas)
      alert(`${novasEtiquetas.length} etiquetas geradas com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao gerar etiquetas:', error)
      alert(error.message || 'Erro ao gerar etiquetas')
    } finally {
      setGerandoEtiquetas(false)
    }
  }

  const selecionarTodas = () => {
    if (etiquetasSelecionadas.size === etiquetas.length) {
      setEtiquetasSelecionadas(new Set())
    } else {
      setEtiquetasSelecionadas(new Set(etiquetas.map(e => e.id!)))
    }
  }

  const toggleSelecaoEtiqueta = (etiquetaId: string) => {
    const novaSelecao = new Set(etiquetasSelecionadas)
    if (novaSelecao.has(etiquetaId)) {
      novaSelecao.delete(etiquetaId)
    } else {
      novaSelecao.add(etiquetaId)
    }
    setEtiquetasSelecionadas(novaSelecao)
  }

  const imprimirEtiquetasTeste = async () => {
    if (!impressoraConectada) {
      alert('Conecte a impressora primeiro')
      return
    }

    try {
      await printService.printTestLabel()
      alert('Etiqueta de teste impressa!')
    } catch (error: any) {
      console.error('Erro ao imprimir teste:', error)
      alert(error.message || 'Erro ao imprimir etiqueta de teste')
    }
  }

  const imprimirEtiquetas = async () => {
    if (etiquetasSelecionadas.size === 0) {
      alert('Selecione pelo menos uma etiqueta')
      return
    }

    if (!impressoraConectada) {
      alert('Conecte a impressora primeiro')
      return
    }

    try {
      const etiquetasParaImprimir = etiquetas.filter(e => etiquetasSelecionadas.has(e.id!))
      
      for (const etiqueta of etiquetasParaImprimir) {
        const qrData = etiqueta.qr_code_data as QRCodeData
        await printService.printLabel(qrData)
        
        // Marcar como impressa
        await transformacaoService.marcarEtiquetaImpressa(etiqueta.id!, etiqueta.impresso)
      }

      alert(`${etiquetasParaImprimir.length} etiquetas impressas com sucesso!`)
      carregarDados() // Recarregar para atualizar status
      
    } catch (error: any) {
      console.error('Erro ao imprimir etiquetas:', error)
      alert(error.message || 'Erro ao imprimir etiquetas')
    }
  }

  // Gerar arquivo de texto com instruções de impressão
  const gerarInstrucoesImpressao = async () => {
    if (etiquetasSelecionadas.size === 0) {
      alert('Selecione pelo menos uma etiqueta')
      return
    }

    try {
      const etiquetasParaImprimir = etiquetas
        .filter(e => etiquetasSelecionadas.has(e.id!))
        .map(e => e.qr_code_data as QRCodeData)

      let conteudo = `ETIQUETAS PARA IMPRESSÃO - ELGIN LP42PRO\n`
      conteudo += `===============================================\n`
      conteudo += `Data: ${new Date().toLocaleString('pt-BR')}\n`
      conteudo += `Total: ${etiquetasParaImprimir.length} etiquetas\n\n`

      etiquetasParaImprimir.forEach((etiqueta, index) => {
        const dataValidade = new Date(etiqueta.validade).toLocaleDateString('pt-BR')
        conteudo += `ETIQUETA ${index + 1}\n`
        conteudo += `---------\n`
        conteudo += `Produto: ${etiqueta.nome}\n`
        conteudo += `Lote: ${etiqueta.lote}\n`
        conteudo += `Peça: #${etiqueta.peca.toString().padStart(3, '0')}\n`
        conteudo += `Peso: ${etiqueta.peso}${etiqueta.unidade}\n`
        conteudo += `Validade: ${dataValidade}\n`
        conteudo += `QR Code: ${JSON.stringify(etiqueta)}\n\n`
      })

      conteudo += `\nINSTRUÇÕES DE IMPRESSÃO:\n`
      conteudo += `========================\n\n`
      
      conteudo += `OPÇÃO 1 - SOFTWARE ELGIN:\n`
      conteudo += `• Abra o software Elgin LP-Suite\n`
      conteudo += `• Crie um modelo de etiqueta 90x40mm\n`
      conteudo += `• Use os dados acima para preencher cada etiqueta\n`
      conteudo += `• Gere o QR Code com os dados JSON\n\n`
      
      conteudo += `OPÇÃO 2 - VIA WINDOWS:\n`
      conteudo += `• Vá em Configurações > Impressoras e scanners\n`
      conteudo += `• Clique na Elgin LP42PRO > Gerenciar > Imprimir página de teste\n`
      conteudo += `• Se funcionar, use qualquer editor que suporte ESC/POS\n\n`
      
      conteudo += `OPÇÃO 3 - NAVEGADOR CHROME:\n`
      conteudo += `• Instale Google Chrome\n`
      conteudo += `• Chrome tem melhor suporte WebUSB\n`
      conteudo += `• Tente conectar novamente neste sistema\n\n`

      const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
      const filename = transformacao ? 
        `instrucoes_${transformacao.numero_lote}_${new Date().toISOString().split('T')[0]}.txt` :
        `instrucoes_${new Date().toISOString().split('T')[0]}.txt`
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Remoção segura do link com setTimeout para evitar race conditions
      setTimeout(() => {
        try {
          if (link && link.parentNode === document.body) {
            document.body.removeChild(link)
          }
        } catch (error) {
          console.warn('Aviso: erro ao remover link de download:', error)
        }
      }, 100)
      
      URL.revokeObjectURL(url)

      alert(`✅ Arquivo de instruções baixado!\n\nO arquivo contém:\n• Dados de todas as etiquetas\n• Instruções passo-a-passo\n• 3 opções diferentes de impressão`)
      
    } catch (error: any) {
      console.error('Erro ao gerar instruções:', error)
      alert(error.message || 'Erro ao gerar arquivo de instruções')
    }
  }

  const baixarPDF = async () => {
    if (etiquetasSelecionadas.size === 0) {
      alert('Selecione pelo menos uma etiqueta')
      return
    }

    try {
      const etiquetasParaDownload = etiquetas
        .filter(e => etiquetasSelecionadas.has(e.id!))
        .map(e => e.qr_code_data as QRCodeData)

      const etiquetaService = new EtiquetaService()
      const pdfBlob = await etiquetaService.generateLabelsPDF(etiquetasParaDownload)
      
      const filename = transformacao ? 
        `etiquetas_${transformacao.numero_lote}_${new Date().toISOString().split('T')[0]}.pdf` :
        `etiquetas_${new Date().toISOString().split('T')[0]}.pdf`
      
      etiquetaService.downloadPDF(pdfBlob, filename)
      
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error)
      alert(error.message || 'Erro ao gerar PDF das etiquetas')
    }
  }

  const previewEtiquetaQR = async (etiqueta: EtiquetaTransformacao) => {
    try {
      const etiquetaService = new EtiquetaService()
      const html = await etiquetaService.generateLabelHTML(etiqueta.qr_code_data as QRCodeData)
      setPreviewEtiqueta(html)
    } catch (error) {
      console.error('Erro ao gerar preview:', error)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarPeso = (peso: number) => {
    if (peso >= 1) {
      return `${peso.toFixed(3)} kg`
    }
    return `${(peso * 1000).toFixed(0)} g`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onVoltar}
              className="flex items-center gap-2 text-[#5F6B6D] hover:text-[#3599B8] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#5F6B6D]">Gerador de Etiquetas</h1>
              <p className="text-[#5F6B6D]/70">
                {transformacao ? 
                  `${transformacao.numero_lote} - ${transformacao.produto_bruto_nome}` :
                  'Gerar etiquetas para transformação'
                }
              </p>
            </div>
          </div>

          {/* Status da impressora */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              impressoraConectada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                impressoraConectada ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {impressoraConectada ? 'Impressora Conectada' : 'Impressora Desconectada'}
            </div>
            
            {!impressoraConectada && (
              <div className="flex gap-2">
                <button
                  onClick={conectarImpressora}
                  className="bg-[#3599B8] text-white px-4 py-2 rounded-lg hover:bg-[#3599B8]/90 transition-colors"
                >
                  Conectar Impressora
                </button>
                <button
                  onClick={conectarQualquerDispositivo}
                  className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                  title="Modo desenvolvedor - mostra todos os dispositivos USB"
                >
                  🔧 Modo Dev
                </button>
                <button
                  onClick={verificarConfiguracoes}
                  className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  title="Verificar configurações do navegador"
                >
                  🔍 Diagnóstico
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Configurações */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#5F6B6D]" />
                <label className="text-sm font-medium text-[#5F6B6D]">
                  Dias de Validade:
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={diasValidade}
                  onChange={(e) => setDiasValidade(parseInt(e.target.value) || 1)}
                  className="w-20 px-2 py-1 border border-[#E8E8E8] rounded text-center"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3">
              {transformacaoId && (
                <button
                  onClick={gerarEtiquetas}
                  disabled={gerandoEtiquetas}
                  className="bg-[#4AC5BB] text-white px-4 py-2 rounded-lg hover:bg-[#4AC5BB]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  {gerandoEtiquetas ? 'Gerando...' : 'Gerar Etiquetas'}
                </button>
              )}
              
              <button
                onClick={imprimirEtiquetasTeste}
                disabled={!impressoraConectada}
                className="bg-[#fabd07] text-white px-4 py-2 rounded-lg hover:bg-[#fabd07]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Teste
              </button>
              
              <button
                onClick={baixarPDF}
                disabled={etiquetasSelecionadas.size === 0}
                className="bg-[#FB8281] text-white px-4 py-2 rounded-lg hover:bg-[#FB8281]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF ({etiquetasSelecionadas.size})
              </button>
              
              <button
                onClick={gerarInstrucoesImpressao}
                disabled={etiquetasSelecionadas.size === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                title="Baixar arquivo com dados e instruções de impressão"
              >
                <Download className="w-4 h-4" />
                Instruções ({etiquetasSelecionadas.size})
              </button>
              
              <button
                onClick={imprimirEtiquetas}
                disabled={etiquetasSelecionadas.size === 0 || !impressoraConectada}
                className="bg-[#3599B8] text-white px-4 py-2 rounded-lg hover:bg-[#3599B8]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir ({etiquetasSelecionadas.size})
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Etiquetas */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8E8E8]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#5F6B6D]">
                Etiquetas ({etiquetas.length})
              </h2>
              
              {etiquetas.length > 0 && (
                <button
                  onClick={selecionarTodas}
                  className="text-[#3599B8] hover:underline text-sm font-medium"
                >
                  {etiquetasSelecionadas.size === etiquetas.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                </button>
              )}
            </div>
          </div>

          {etiquetas.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      <input
                        type="checkbox"
                        checked={etiquetasSelecionadas.size === etiquetas.length && etiquetas.length > 0}
                        onChange={selecionarTodas}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Produto
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Peça
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Peso
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Validade
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[#5F6B6D]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {etiquetas.map((etiqueta) => (
                    <tr key={etiqueta.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={etiquetasSelecionadas.has(etiqueta.id!)}
                          onChange={() => toggleSelecaoEtiqueta(etiqueta.id!)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-[#5F6B6D] text-sm">
                            {etiqueta.nome_produto}
                          </div>
                          <div className="text-xs text-[#5F6B6D]/70">
                            {etiqueta.codigo_produto}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-[#5F6B6D]">
                            #{etiqueta.numero_peca.toString().padStart(3, '0')}
                          </div>
                          <div className="text-xs text-[#5F6B6D]/70">
                            {etiqueta.numero_lote}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#5F6B6D]">
                        {formatarPeso(etiqueta.peso_real)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#5F6B6D]">
                        {formatarData(etiqueta.data_validade)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {etiqueta.impresso ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          )}
                          <span className="text-xs">
                            {etiqueta.impresso ? 'Impressa' : 'Pendente'}
                          </span>
                          {etiqueta.reimpressoes > 0 && (
                            <span className="text-xs text-blue-600">
                              ({etiqueta.reimpressoes}x)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => previewEtiquetaQR(etiqueta)}
                          className="text-[#3599B8] hover:bg-blue-50 p-1 rounded transition-colors"
                          title="Visualizar etiqueta"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-[#5F6B6D]/60">
              <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhuma etiqueta gerada ainda</h3>
              {transformacaoId ? (
                <p className="mb-4">Clique em "Gerar Etiquetas" para criar as etiquetas desta transformação</p>
              ) : (
                <p className="mb-4">Selecione uma transformação para gerar etiquetas</p>
              )}
              
              {!transformacaoId && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-amber-800">
                    <strong>💡 Dica:</strong> Você pode acessar este gerador através do menu de uma transformação específica.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview da Etiqueta */}
        {previewEtiqueta && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-medium text-[#5F6B6D]">Preview da Etiqueta</h3>
                <button
                  onClick={() => setPreviewEtiqueta(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 text-center">
                <div 
                  className="inline-block border-2 border-dashed border-gray-300 p-4"
                  dangerouslySetInnerHTML={{ __html: previewEtiqueta }}
                />
                <p className="text-xs text-[#5F6B6D]/70 mt-4">
                  Preview da etiqueta em tamanho real (90x40mm)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dicas de Uso */}
        <div className="bg-[#F4DDAE]/30 rounded-xl border-2 border-[#fabd07]/20 p-6">
          <h3 className="text-lg font-semibold text-[#5F6B6D] mb-4">💡 Opções de Impressão</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#5F6B6D]/80">
            <div>
              <p><strong>🔗 Conexão Direta:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Melhor opção quando funciona</li>
                <li>Requer Chrome ou Edge configurado</li>
                <li>Impressão automática</li>
              </ul>
            </div>
            <div>
              <p><strong>📄 PDF:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Formato visual das etiquetas</li>
                <li>Funciona em qualquer impressora</li>
                <li>Boa para conferência antes da impressão</li>
              </ul>
            </div>
            <div>
              <p><strong>📋 Instruções (Recomendado):</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Arquivo de texto com todos os dados</li>
                <li>3 métodos diferentes de impressão</li>
                <li>Funciona sempre, independente do navegador</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-800 font-medium">🎯 Problema com WebUSB?</p>
            <p className="text-green-700 text-sm mt-1">
              Use o botão <strong>"Instruções"</strong> (verde) - ele baixa um arquivo com todos os dados das etiquetas e 
              3 métodos diferentes para imprimi-las, incluindo usando o software oficial da Elgin.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}