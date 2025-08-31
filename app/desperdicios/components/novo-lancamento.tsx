"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Trash2, Calendar, User, FileText, Camera, AlertTriangle } from "lucide-react"
import { desperdiciosService, type NovoDesperdicio, type NovoItemDesperdicio, type FotoDesperdicio } from "../../shared/lib/desperdicios-service"
import { produtoService, type Produto } from "../../shared/lib/supabase"
import { SETORES } from "../../shared/lib/setores"
import { UploadFotos } from "./upload-fotos"
import { SeletorProdutos } from "./seletor-produtos"
import type { Usuario } from "../../shared/lib/auth"

interface NovoLancamentoProps {
  usuario: Usuario
  onVoltar: () => void
  onLancamentoCriado: () => void
}

interface ItemTemp extends NovoItemDesperdicio {
  id: string
  produto_nome?: string
  produto_categoria?: string
}

export function NovoLancamento({ usuario, onVoltar, onLancamentoCriado }: NovoLancamentoProps) {
  const [formData, setFormData] = useState({
    data_desperdicio: new Date().toISOString().split('T')[0],
    setor: '',
    responsavel_nome: usuario.nome,
    comentario: ''
  })
  
  const [itens, setItens] = useState<ItemTemp[]>([])
  const [fotos, setFotos] = useState<FotoDesperdicio[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [showProdutoSelector, setShowProdutoSelector] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    carregarDados()
  }, [])

  // Verificar se produtos foram carregados
  useEffect(() => {
    console.log('📦 Estado atual dos produtos:', produtos.length)
    if (produtos.length > 0) {
      console.log('📦 Exemplo do primeiro produto:', produtos[0])
    }
  }, [produtos])

  const carregarDados = async () => {
    try {
      console.log('🔄 Carregando produtos para loja:', usuario.loja_id)
      
      // Verificar se o service existe
      if (!produtoService || !produtoService.listar) {
        console.warn('⚠️ produtoService não disponível')
        setProdutos([])
        setUsuarios([])
        return
      }

      const produtosData = await produtoService.listar()
      console.log('✅ Produtos carregados:', produtosData.length)
      
      setProdutos(produtosData || [])
      setUsuarios([{ id: usuario.id, nome: usuario.nome }])
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error)
      // Definir array vazio para não quebrar a interface
      setProdutos([])
      setUsuarios([])
    } finally {
      setLoadingData(false)
    }
  }

  const validarFormulario = () => {
    const novosErrors: Record<string, string> = {}
    
    if (!formData.data_desperdicio) {
      novosErrors.data_desperdicio = 'Data é obrigatória'
    }
    
    if (!formData.setor) {
      novosErrors.setor = 'Setor é obrigatório'
    }
    
    if (!formData.responsavel_nome.trim()) {
      novosErrors.responsavel_nome = 'Nome do responsável é obrigatório'
    }
    
    if (!formData.comentario.trim()) {
      novosErrors.comentario = 'Comentário sobre os motivos é obrigatório'
    }
    
    if (itens.length === 0) {
      novosErrors.itens = 'Adicione pelo menos um produto'
    }
    
    // Validar itens
    itens.forEach((item, index) => {
      if (!item.quantidade || item.quantidade <= 0) {
        novosErrors[`item_${index}_quantidade`] = 'Quantidade deve ser maior que zero'
      }
    })
    
    setErrors(novosErrors)
    return Object.keys(novosErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validarFormulario()) {
      return
    }
    
    setLoading(true)
    try {
      const novoLancamento: NovoDesperdicio = {
        loja_id: usuario.loja_id,
        data_desperdicio: formData.data_desperdicio,
        setor: formData.setor,
        responsavel_nome: formData.responsavel_nome,
        comentario: formData.comentario,
        fotos: fotos,
        itens: itens.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valor_unitario: item.valor_unitario,
          observacoes: item.observacoes
        }))
      }
      
      await desperdiciosService.criar(novoLancamento, usuario.id)
      onLancamentoCriado()
    } catch (error: any) {
      console.error('Erro ao criar lançamento:', error)
      
      // Verificar se é erro de tabelas não criadas
      if (error.message?.includes('não foram criadas ainda')) {
        setErrors({ submit: 'Módulo não configurado. Execute o script SQL primeiro.' })
      } else {
        setErrors({ submit: `Erro ao salvar: ${error.message || 'Tente novamente.'}` })
      }
    } finally {
      setLoading(false)
    }
  }

  const adicionarProduto = (produto: Produto) => {
    const novoItem: ItemTemp = {
      id: Date.now().toString(),
      produto_id: produto.id,
      produto_nome: produto.nome,
      produto_categoria: produto.categoria,
      quantidade: 1,
      unidade: produto.unidade || 'UN',
      valor_unitario: 0,
      observacoes: ''
    }
    
    setItens(prev => [...prev, novoItem])
    setShowProdutoSelector(false)
  }

  const removerItem = (id: string) => {
    setItens(prev => prev.filter(item => item.id !== id))
  }

  const atualizarItem = (id: string, campo: keyof ItemTemp, valor: any) => {
    setItens(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, [campo]: valor }
          : item
      )
    )
  }

  const calcularValorTotal = () => {
    return itens.reduce((total, item) => {
      return total + (item.quantidade * (item.valor_unitario || 0))
    }, 0)
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3599B8] mx-auto"></div>
          <p className="text-[#5F6B6D] mt-4">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onVoltar}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#5F6B6D]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#5F6B6D]">
                🗑️ Novo Lançamento de Desperdício
              </h1>
              <p className="text-[#5F6B6D]/70">Registre produtos desperdiçados por setor</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#5F6B6D]/70">Valor Total</p>
            <p className="text-xl font-bold text-[#FB8281]">
              {formatarMoeda(calcularValorTotal())}
            </p>
          </div>
        </div>

        {/* Formulário Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
          <h2 className="text-lg font-semibold text-[#5F6B6D] mb-6">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data do Desperdício */}
            <div>
              <label className="block text-sm font-medium text-[#5F6B6D] mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data do Desperdício *
              </label>
              <input
                type="date"
                value={formData.data_desperdicio}
                onChange={(e) => setFormData(prev => ({ ...prev, data_desperdicio: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent ${
                  errors.data_desperdicio ? 'border-red-500' : 'border-[#E8E8E8]'
                }`}
              />
              {errors.data_desperdicio && (
                <p className="text-red-500 text-sm mt-1">{errors.data_desperdicio}</p>
              )}
            </div>

            {/* Setor */}
            <div>
              <label className="block text-sm font-medium text-[#5F6B6D] mb-2">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Setor *
              </label>
              <select
                value={formData.setor}
                onChange={(e) => setFormData(prev => ({ ...prev, setor: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent ${
                  errors.setor ? 'border-red-500' : 'border-[#E8E8E8]'
                }`}
              >
                <option value="">Selecione o setor</option>
                {SETORES.map(setor => (
                  <option key={setor.nome} value={setor.nome}>
                    {setor.emoji} {setor.nome}
                  </option>
                ))}
              </select>
              {errors.setor && (
                <p className="text-red-500 text-sm mt-1">{errors.setor}</p>
              )}
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-sm font-medium text-[#5F6B6D] mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nome do Responsável *
              </label>
              <input
                type="text"
                value={formData.responsavel_nome}
                onChange={(e) => setFormData(prev => ({ ...prev, responsavel_nome: e.target.value }))}
                placeholder="Digite o nome do responsável"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent ${
                  errors.responsavel_nome ? 'border-red-500' : 'border-[#E8E8E8]'
                }`}
              />
              {errors.responsavel_nome && (
                <p className="text-red-500 text-sm mt-1">{errors.responsavel_nome}</p>
              )}
            </div>
          </div>

          {/* Comentário */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-[#5F6B6D] mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Motivos do Desperdício *
            </label>
            <textarea
              value={formData.comentario}
              onChange={(e) => setFormData(prev => ({ ...prev, comentario: e.target.value }))}
              rows={4}
              placeholder="Descreva os motivos que levaram ao desperdício..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent resize-none ${
                errors.comentario ? 'border-red-500' : 'border-[#E8E8E8]'
              }`}
            />
            {errors.comentario && (
              <p className="text-red-500 text-sm mt-1">{errors.comentario}</p>
            )}
          </div>
        </div>

        {/* Produtos Desperdiçados */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#5F6B6D]">Produtos Desperdiçados</h2>
            <button
              onClick={() => setShowProdutoSelector(true)}
              className="bg-[#3599B8] hover:bg-[#3599B8]/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Produto
            </button>
          </div>

          {errors.itens && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.itens}</p>
            </div>
          )}

          {itens.length === 0 ? (
            <div className="text-center py-8 text-[#5F6B6D]/60">
              <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum produto adicionado</p>
              <button
                onClick={() => setShowProdutoSelector(true)}
                className="text-[#3599B8] hover:underline mt-2"
              >
                Adicionar primeiro produto →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {itens.map((item, index) => (
                <div key={item.id} className="border border-[#E8E8E8] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-[#5F6B6D]">{item.produto_nome}</h4>
                      <p className="text-sm text-[#5F6B6D]/60">{item.produto_categoria}</p>
                    </div>
                    <button
                      onClick={() => removerItem(item.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5F6B6D] mb-1">
                        Quantidade *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={item.quantidade}
                        onChange={(e) => atualizarItem(item.id, 'quantidade', Number(e.target.value))}
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#3599B8] focus:border-transparent ${
                          errors[`item_${index}_quantidade`] ? 'border-red-500' : 'border-[#E8E8E8]'
                        }`}
                      />
                      {errors[`item_${index}_quantidade`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantidade`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#5F6B6D] mb-1">
                        Unidade
                      </label>
                      <input
                        type="text"
                        value={item.unidade}
                        onChange={(e) => atualizarItem(item.id, 'unidade', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8E8E8] rounded focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#5F6B6D] mb-1">
                        Valor Unitário (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.valor_unitario || ''}
                        onChange={(e) => atualizarItem(item.id, 'valor_unitario', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-[#E8E8E8] rounded focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#5F6B6D] mb-1">
                        Valor Total
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-[#E8E8E8] rounded text-[#5F6B6D] font-medium">
                        {formatarMoeda(item.quantidade * (item.valor_unitario || 0))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-medium text-[#5F6B6D] mb-1">
                      Observações
                    </label>
                    <input
                      type="text"
                      value={item.observacoes || ''}
                      onChange={(e) => atualizarItem(item.id, 'observacoes', e.target.value)}
                      placeholder="Observações específicas deste item..."
                      className="w-full px-3 py-2 border border-[#E8E8E8] rounded focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload de Fotos */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
          <h2 className="text-lg font-semibold text-[#5F6B6D] mb-6">
            <Camera className="w-5 h-5 inline mr-2" />
            Fotos do Desperdício
          </h2>
          <UploadFotos 
            fotos={fotos}
            onFotosChange={setFotos}
            maxFotos={5}
          />
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between">
          {errors.submit && (
            <div className="text-red-500 text-sm">{errors.submit}</div>
          )}
          <div className="flex gap-4 ml-auto">
            <button
              onClick={onVoltar}
              className="px-6 py-3 border border-[#E8E8E8] text-[#5F6B6D] rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#FB8281] hover:bg-[#FB8281]/90 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Lançamento'}
            </button>
          </div>
        </div>
      </div>

      {/* Seletor de Produtos Modal */}
      {showProdutoSelector && (
        <SeletorProdutos
          produtos={produtos}
          onSelecionar={adicionarProduto}
          onFechar={() => setShowProdutoSelector(false)}
        />
      )}
    </div>
  )
}