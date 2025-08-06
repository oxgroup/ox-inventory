import { supabase } from "./supabase"
import type { Produto } from "./supabase"

// Cache offline para produtos
let produtosCache: Produto[] = []
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export const barcodeService = {
  // Carregar produtos para cache offline
  async carregarProdutosParaCache() {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .not("codigo_barras", "is", null)
        .order("nome")
      
      if (error) throw error
      
      produtosCache = data || []
      cacheTimestamp = Date.now()
      
      // Salvar no localStorage para persistência offline
      localStorage.setItem('produtos_barcode_cache', JSON.stringify({
        produtos: produtosCache,
        timestamp: cacheTimestamp
      }))
      
      console.log(`Cache de produtos atualizado: ${produtosCache.length} produtos com código de barras`)
      return produtosCache
    } catch (error) {
      console.error("Erro ao carregar produtos para cache:", error)
      // Tentar carregar do localStorage
      return this.carregarCacheLocal()
    }
  },

  // Carregar cache do localStorage
  carregarCacheLocal(): Produto[] {
    try {
      const cache = localStorage.getItem('produtos_barcode_cache')
      if (cache) {
        const { produtos, timestamp } = JSON.parse(cache)
        produtosCache = produtos || []
        cacheTimestamp = timestamp || 0
        console.log(`Cache local carregado: ${produtosCache.length} produtos`)
        return produtosCache
      }
    } catch (error) {
      console.error("Erro ao carregar cache local:", error)
    }
    return []
  },

  // Buscar produto por código de barras (com suporte offline)
  async buscarPorCodigoBarras(codigoBarras: string): Promise<Produto | null> {
    // Validar formato EAN-13
    if (!this.validarEAN13(codigoBarras)) {
      throw new Error("Código de barras inválido. Use formato EAN-13 (13 dígitos)")
    }

    try {
      // Tentar busca online primeiro
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("codigo_barras", codigoBarras)
        .eq("ativo", true)
        .single()

      if (!error && data) {
        return data as Produto
      }
    } catch (error) {
      console.warn("Busca online falhou, usando cache offline:", error)
    }

    // Fallback: busca offline no cache
    if (produtosCache.length === 0) {
      this.carregarCacheLocal()
    }

    const produtoCache = produtosCache.find(p => p.codigo_barras === codigoBarras)
    if (produtoCache) {
      console.log("Produto encontrado no cache offline")
      return produtoCache
    }

    return null
  },

  // Validar formato EAN-13
  validarEAN13(codigo: string): boolean {
    // Verificar se tem 13 dígitos
    if (!/^\d{13}$/.test(codigo)) {
      return false
    }

    // Validar dígito verificador EAN-13
    const digits = codigo.split('').map(Number)
    const checksum = digits.slice(0, 12).reduce((sum, digit, index) => {
      return sum + digit * (index % 2 === 0 ? 1 : 3)
    }, 0)
    
    const calculatedCheckDigit = (10 - (checksum % 10)) % 10
    return calculatedCheckDigit === digits[12]
  },

  // Verificar se código de barras já existe (evitar duplicatas)
  async verificarCodigoExiste(codigoBarras: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("id")
        .eq("codigo_barras", codigoBarras)
        .single()

      return !error && !!data
    } catch {
      // Em caso de erro, verificar no cache
      if (produtosCache.length === 0) {
        this.carregarCacheLocal()
      }
      return produtosCache.some(p => p.codigo_barras === codigoBarras)
    }
  },

  // Limpar cache
  limparCache() {
    produtosCache = []
    cacheTimestamp = 0
    localStorage.removeItem('produtos_barcode_cache')
  },

  // Verificar se cache precisa ser atualizado
  cachePrecisaAtualizacao(): boolean {
    return Date.now() - cacheTimestamp > CACHE_DURATION
  }
}