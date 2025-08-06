"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Log para monitoramento (pode ser enviado para serviço de logging)
    this.logError(error, errorInfo)
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    }

    console.error('Erro detalhado:', errorData)
    
    // Aqui você poderia enviar para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
  }

  private handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1
    
    this.setState({
      retryCount: newRetryCount
    })

    // Retry com delay progressivo
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 10000)
    
    console.log(`Tentando recuperar do erro (tentativa ${newRetryCount}) em ${delay}ms...`)
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      })
    }, delay)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private getErrorMessage = (error: Error): string => {
    if (error.message.includes('ChunkLoadError') || 
        error.message.includes('Loading chunk')) {
      return 'Erro ao carregar recursos. A aplicação pode ter sido atualizada.'
    }
    
    if (error.message.includes('Network')) {
      return 'Erro de conexão com a internet.'
    }
    
    if (error.message.includes('Script error')) {
      return 'Erro no script da aplicação.'
    }
    
    return error.message || 'Erro inesperado na aplicação'
  }

  private getSuggestion = (error: Error): string => {
    if (error.message.includes('ChunkLoadError') || 
        error.message.includes('Loading chunk')) {
      return 'Tente recarregar a página para obter a versão mais recente.'
    }
    
    if (error.message.includes('Network')) {
      return 'Verifique sua conexão com a internet e tente novamente.'
    }
    
    return 'Tente novamente ou recarregue a página.'
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Renderizar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Renderizar tela de erro padrão
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Card className="border-2 border-[#FB8281] shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-[#FB8281] mx-auto mb-3" />
                  <h2 className="text-xl font-bold text-[#000000] mb-2">Oops! Algo deu errado</h2>
                  <p className="text-[#5F6B6D] text-sm mb-1">
                    {this.getErrorMessage(this.state.error)}
                  </p>
                  <p className="text-[#8B8C7E] text-xs">
                    {this.getSuggestion(this.state.error)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={this.handleRetry}
                    disabled={this.state.retryCount >= 3}
                    className="w-full bg-[#fabd07] hover:bg-[#b58821] text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {this.state.retryCount >= 3 
                      ? 'Máximo de tentativas atingido' 
                      : `Tentar Novamente (${this.state.retryCount}/3)`
                    }
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      className="text-sm"
                    >
                      <Home className="w-4 h-4 mr-1" />
                      Início
                    </Button>
                    <Button
                      onClick={this.handleReload}
                      variant="outline"
                      className="text-sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Recarregar
                    </Button>
                  </div>
                </div>

                {/* Informações de debug (apenas em desenvolvimento) */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="text-xs bg-gray-100 p-2 rounded">
                    <summary className="cursor-pointer font-semibold text-gray-700">
                      Detalhes técnicos
                    </summary>
                    <div className="mt-2 space-y-1 text-gray-600">
                      <p><strong>Erro:</strong> {this.state.error.message}</p>
                      <p><strong>Componente:</strong> {this.state.errorInfo?.componentStack}</p>
                      <p><strong>Tentativas:</strong> {this.state.retryCount}</p>
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}