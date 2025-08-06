// Utilitários para operações assíncronas robustas

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class RetryError extends Error {
  constructor(message: string, public originalError: any) {
    super(message)
    this.name = 'RetryError'
  }
}

// Wrapper para timeout em operações async
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(errorMessage || `Operação excedeu timeout de ${timeoutMs}ms`))
      }, timeoutMs)
    })
  ])
}

// Retry com backoff exponencial
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    timeout?: number
    shouldRetry?: (error: any) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    timeout = 15000,
    shouldRetry = (error: any) => {
      // Não fazer retry para erros de autenticação específicos
      if (error?.message?.includes('Invalid login credentials')) return false
      if (error?.message?.includes('Email not confirmed')) return false
      if (error?.code === 'PGRST301') return false
      return true
    }
  } = options

  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Aplicar timeout na operação
      const result = await withTimeout(operation(), timeout)
      return result
    } catch (error: any) {
      lastError = error
      
      console.warn(`Tentativa ${attempt}/${maxRetries} falhou:`, error.message)
      
      // Se não deve fazer retry ou é a última tentativa
      if (!shouldRetry(error) || attempt >= maxRetries) {
        break
      }
      
      // Calcular delay com backoff exponencial
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
      const jitter = Math.random() * 0.1 * delay // 10% de jitter
      const finalDelay = delay + jitter
      
      console.log(`Aguardando ${Math.round(finalDelay)}ms antes da próxima tentativa...`)
      await new Promise(resolve => setTimeout(resolve, finalDelay))
    }
  }
  
  throw new RetryError(`Falha após ${maxRetries} tentativas`, lastError)
}

// Debounce para operações frequentes
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// Cleanup helper para promises
export class AbortablePromise<T> {
  private aborted = false
  private abortController = new AbortController()
  
  constructor(private promise: Promise<T>) {}
  
  abort() {
    this.aborted = true
    this.abortController.abort()
  }
  
  async run(): Promise<T> {
    if (this.aborted) {
      throw new Error('Promise was aborted')
    }
    return this.promise
  }
  
  get signal() {
    return this.abortController.signal
  }
}

// Estado de loading com timeout automático
export class LoadingState {
  private timeoutId: NodeJS.Timeout | null = null
  
  constructor(
    private setState: (loading: boolean) => void,
    private maxDuration: number = 30000
  ) {}
  
  start() {
    this.setState(true)
    
    // Fallback de segurança - sempre para o loading após maxDuration
    this.timeoutId = setTimeout(() => {
      console.warn('Loading state forçadamente finalizado por timeout de segurança')
      this.stop()
    }, this.maxDuration)
  }
  
  stop() {
    this.setState(false)
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }
}

// Verificador de conectividade
export class ConnectivityManager {
  private listeners: Set<(online: boolean) => void>
  
  constructor() {
    this.listeners = new Set()
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.notifyListeners(true))
      window.addEventListener('offline', () => this.notifyListeners(false))
    }
  }
  
  isOnline(): boolean {
    if (typeof window === 'undefined') return true
    return navigator.onLine
  }
  
  addListener(callback: (online: boolean) => void) {
    this.listeners.add(callback)
  }
  
  removeListener(callback: (online: boolean) => void) {
    this.listeners.delete(callback)
  }
  
  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(online)
      } catch (error) {
        console.error('Erro no listener de conectividade:', error)
      }
    })
  }
}

// Instância global segura para SSR
export const connectivity = typeof window !== 'undefined' 
  ? new ConnectivityManager() 
  : ({
      isOnline: () => true,
      addListener: () => {},
      removeListener: () => {}
    } as unknown as ConnectivityManager)