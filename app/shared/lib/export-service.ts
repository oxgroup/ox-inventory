// Service para exportação de dados de inventário
import { itemInventarioService } from "./supabase"

export const exportService = {
  /**
   * Exporta a contagem de um inventário para arquivo TXT
   * Formato: produto_id;quantidade_total (com vírgula decimal brasileira)
   */
  async exportarContagem(inventarioId: string, nomeSetor: string): Promise<void> {
    try {
      // 1. Buscar itens do inventário
      console.log("📦 [EXPORT] Buscando itens do inventário:", inventarioId)
      const itens = await itemInventarioService.listarPorInventario(inventarioId)
      
      if (!itens || itens.length === 0) {
        throw new Error("Nenhum item encontrado neste inventário")
      }
      
      console.log("📊 [EXPORT] Itens encontrados:", itens.length)
      
      // 2. Processar dados: produto_id;quantidade_total (formato BR)
      const conteudo = itens.map(item => {
        const total = (item.quantidade_fechada || 0) + (item.quantidade_em_uso || 0)
        
        // Formatar número brasileiro (vírgula como separador decimal)
        const totalFormatado = total.toLocaleString('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: false // Remove separador de milhares
        })
        
        return `${item.produto_id};${totalFormatado}`
      }).join('\n')
      
      console.log("📝 [EXPORT] Conteúdo gerado:", conteudo.split('\n').length, "linhas")
      
      // 3. Gerar nome do arquivo com data atual
      const dataAtual = new Date().toISOString().split('T')[0]
      const nomeArquivo = `inventario_${nomeSetor.replace(/\s+/g, '_')}_${dataAtual}.txt`
      
      // 4. Baixar arquivo
      this.baixarArquivo(conteudo, nomeArquivo)
      
      console.log("✅ [EXPORT] Arquivo exportado com sucesso:", nomeArquivo)
    } catch (error) {
      console.error("💥 [EXPORT] Erro ao exportar contagem:", error)
      throw error
    }
  },

  /**
   * Cria e baixa um arquivo de texto no navegador
   */
  baixarArquivo(conteudo: string, nomeArquivo: string): void {
    try {
      // Criar blob com encoding UTF-8 para caracteres especiais
      const blob = new Blob([conteudo], { 
        type: 'text/plain;charset=utf-8' 
      })
      
      // Criar URL temporária para o blob
      const url = URL.createObjectURL(blob)
      
      // Criar elemento de link temporário
      const link = document.createElement('a')
      link.href = url
      link.download = nomeArquivo
      link.style.display = 'none'
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Liberar memória
      URL.revokeObjectURL(url)
      
      console.log("📁 [EXPORT] Download iniciado:", nomeArquivo)
    } catch (error) {
      console.error("💥 [EXPORT] Erro ao baixar arquivo:", error)
      throw new Error("Erro ao baixar arquivo de exportação")
    }
  },

  /**
   * Valida se um inventário pode ser exportado
   */
  podeExportar(inventario: any): boolean {
    // Permite exportar inventários finalizados ou conciliados
    return inventario?.status === "finalizado" || inventario?.status === "conciliado"
  },

  /**
   * Gera preview do conteúdo que será exportado (para debug/teste)
   */
  async gerarPreview(inventarioId: string): Promise<string> {
    try {
      const itens = await itemInventarioService.listarPorInventario(inventarioId)
      
      if (!itens || itens.length === 0) {
        return "Nenhum item encontrado"
      }
      
      const preview = itens.slice(0, 5).map(item => {
        const total = (item.quantidade_fechada || 0) + (item.quantidade_em_uso || 0)
        const totalFormatado = total.toLocaleString('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: false
        })
        return `${item.produto_id};${totalFormatado}`
      }).join('\n')
      
      const totalItens = itens.length
      const sufixo = totalItens > 5 ? `\n... e mais ${totalItens - 5} itens` : ''
      
      return preview + sufixo
    } catch (error) {
      console.error("Erro ao gerar preview:", error)
      return "Erro ao gerar preview"
    }
  }
}