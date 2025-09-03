"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ArrowRight, Plus, Trash2, Search, Package, Calculator, CheckCircle } from "lucide-react"
import { transformacaoService, type NovaTransformacao, type NovoItemTransformacao, type Produto } from "../../shared/lib/transformacao-service"
import { SeletorProdutoBruto } from "./seletor-produto-bruto"

interface NovaTransformacaoProps {
  usuario: any
  onVoltar: () => void
  onTransformacaoCriada: () => void
}

type Etapa = 1 | 2 | 3

export function NovaTransformacao({ usuario, onVoltar, onTransformacaoCriada }: NovaTransformacaoProps) {
  const [etapaAtual, setEtapaAtual] = useState<Etapa>(1)
  const [loading, setLoading] = useState(false)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [produtosPorcao, setProdutosPorcao] = useState<Produto[]>([])
  const [buscandoProdutosPorcao, setBuscandoProdutosPorcao] = useState(false)

  // Dados da transformação
  const [dadosTransformacao, setDadosTransformacao] = useState({
    produto_bruto_codigo: '',
    produto_bruto_nome: '',
    quantidade_inicial: 0,
    unidade_inicial: 'kg',
    custo_medio: 0,
    percentual_quebra: 0.5,
    data_transformacao: new Date().toISOString().split('T')[0],
    dias_validade: 5,
    observacoes: ''
  })

  const [itensTransformacao, setItensTransformacao] = useState<NovoItemTransformacao[]>([])

  const handleSelecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto)
    setDadosTransformacao(prev => ({
      ...prev,
      produto_bruto_codigo: produto.codigo,
      produto_bruto_nome: produto.nome,
      custo_medio: produto.preco_custo || 0
    }))
  }

  const adicionarItem = () => {
    const numeroItem = itensTransformacao.length + 1
    const codigoGerado = dadosTransformacao.quantidade_inicial > 0 
      ? `LOTE-${Date.now().toString().slice(-6)}-${numeroItem.toString().padStart(2, '0')}`
      : `TEMP-${numeroItem.toString().padStart(2, '0')}`
    
    const novoItem: NovoItemTransformacao = {
      produto_porcao_codigo: codigoGerado,
      produto_porcao_nome: '',
      quantidade_porcoes: 1,
      quantidade_utilizada: 0,
      peso_medio_porcao: 0, // Será calculado automaticamente
      unidade_porcao: 'peça',
      custo_unitario: 0,
      ponto_reposicao: 10
    }
    setItensTransformacao(prev => [...prev, novoItem])
  }

  const removerItem = (index: number) => {
    setItensTransformacao(prev => prev.filter((_, i) => i !== index))
  }

  const atualizarItem = (index: number, campo: keyof NovoItemTransformacao, valor: any) => {
    setItensTransformacao(prev => prev.map((item, i) => 
      i === index ? { ...item, [campo]: valor } : item
    ))
  }

  // Calcular automaticamente peso médio e custos
  const calcularItem = (index: number) => {
    const item = itensTransformacao[index]
    
    // Calcular peso médio por porção: quantidade_utilizada / quantidade_porcoes
    const pesoMedio = item.quantidade_porcoes > 0 ? item.quantidade_utilizada / item.quantidade_porcoes : 0
    
    // Usar quantidade_utilizada como quantidade utilizada total
    const quantidadeUtilizada = item.quantidade_utilizada
    
    // Calcular custo considerando a quebra em peso
    const quantidadeTotalComQuebra = dadosTransformacao.quantidade_inicial
    const quantidadeLiquida = quantidadeTotalComQuebra - dadosTransformacao.percentual_quebra
    const ratioQuebra = quantidadeLiquida > 0 ? quantidadeTotalComQuebra / quantidadeLiquida : 1
    const custoTotal = dadosTransformacao.custo_medio * quantidadeUtilizada * ratioQuebra
    const custoUnitario = item.quantidade_porcoes > 0 ? custoTotal / item.quantidade_porcoes : 0
    
    atualizarItem(index, 'peso_medio_porcao', pesoMedio)
    atualizarItem(index, 'quantidade_utilizada', quantidadeUtilizada)
    atualizarItem(index, 'custo_unitario', custoUnitario)
  }

  const buscarProdutosPorcao = async (termo: string) => {
    if (!termo.trim()) {
      setProdutosPorcao([])
      return
    }

    setBuscandoProdutosPorcao(true)
    try {
      const produtos = await transformacaoService.buscarProdutos(usuario.loja_id, termo)
      setProdutosPorcao(produtos)
    } catch (error) {
      console.error('Erro ao buscar produtos para porção:', error)
      setProdutosPorcao([])
    } finally {
      setBuscandoProdutosPorcao(false)
    }
  }

  const selecionarProdutoPorcao = (index: number, produto: Produto) => {
    atualizarItem(index, 'produto_porcao_nome', produto.nome)
    setProdutosPorcao([])
  }

  const proximaEtapa = () => {
    if (etapaAtual < 3) {
      setEtapaAtual((prev) => (prev + 1) as Etapa)
    }
  }

  const etapaAnterior = () => {
    if (etapaAtual > 1) {
      setEtapaAtual((prev) => (prev - 1) as Etapa)
    }
  }

  const validarEtapa1 = () => {
    return dadosTransformacao.produto_bruto_codigo &&
           dadosTransformacao.quantidade_inicial > 0 &&
           dadosTransformacao.custo_medio >= 0 &&
           dadosTransformacao.dias_validade > 0
  }

  const validarEtapa2 = () => {
    return itensTransformacao.length > 0 &&
           itensTransformacao.every(item => 
             item.produto_porcao_codigo &&
             item.produto_porcao_nome &&
             item.quantidade_porcoes > 0 &&
             item.quantidade_utilizada > 0
           )
  }

  const salvarTransformacao = async () => {
    if (!validarEtapa1() || !validarEtapa2()) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      const novaTransformacao: NovaTransformacao = {
        loja_id: usuario.loja_id,
        ...dadosTransformacao,
        itens: itensTransformacao
      }

      await transformacaoService.criar(novaTransformacao, usuario.id)
      
      alert('Transformação criada com sucesso!')
      onTransformacaoCriada()
    } catch (error: any) {
      console.error('Erro ao criar transformação:', error)
      alert(error.message || 'Erro ao criar transformação')
    } finally {
      setLoading(false)
    }
  }

  const totalQuantidadeUtilizada = itensTransformacao.reduce((acc, item) => acc + item.quantidade_utilizada, 0)
  const quantidadeLiquida = dadosTransformacao.quantidade_inicial - dadosTransformacao.percentual_quebra
  const validacaoPeso = totalQuantidadeUtilizada <= quantidadeLiquida

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A9C4E5] to-[#F4DDAE] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onVoltar}
            className="flex items-center gap-2 text-[#5F6B6D] hover:text-[#3599B8] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-[#5F6B6D]">Nova Transformação</h1>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`flex items-center gap-2 ${etapaAtual >= 1 ? 'text-[#3599B8]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${etapaAtual >= 1 ? 'bg-[#3599B8] text-white' : 'bg-gray-200'}`}>
                1
              </div>
              Produto Base
            </span>
            <span className={`flex items-center gap-2 ${etapaAtual >= 2 ? 'text-[#3599B8]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${etapaAtual >= 2 ? 'bg-[#3599B8] text-white' : 'bg-gray-200'}`}>
                2
              </div>
              Porções
            </span>
            <span className={`flex items-center gap-2 ${etapaAtual >= 3 ? 'text-[#3599B8]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${etapaAtual >= 3 ? 'bg-[#3599B8] text-white' : 'bg-gray-200'}`}>
                3
              </div>
              Confirmação
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#3599B8] h-2 rounded-full transition-all"
              style={{ width: `${(etapaAtual / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-6">
          {/* ETAPA 1: Produto Base */}
          {etapaAtual === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#5F6B6D] flex items-center gap-2">
                <Package className="w-5 h-5" />
                Definir Produto Base
              </h2>

              {/* Seletor de Produto Bruto */}
              <SeletorProdutoBruto
                usuario={usuario}
                produtoSelecionado={produtoSelecionado}
                onSelecionarProduto={handleSelecionarProduto}
              />

              {/* Quantidade e custos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5F6B6D]">
                    Quantidade Inicial *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={dadosTransformacao.quantidade_inicial}
                    onChange={(e) => setDadosTransformacao(prev => ({...prev, quantidade_inicial: parseFloat(e.target.value) || 0}))}
                    className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5F6B6D]">
                    Unidade
                  </label>
                  <select
                    value={dadosTransformacao.unidade_inicial}
                    onChange={(e) => setDadosTransformacao(prev => ({...prev, unidade_inicial: e.target.value}))}
                    className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="peça">peça</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5F6B6D]">
                    Custo Médio (por {dadosTransformacao.unidade_inicial})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dadosTransformacao.custo_medio}
                    onChange={(e) => setDadosTransformacao(prev => ({...prev, custo_medio: parseFloat(e.target.value) || 0}))}
                    className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5F6B6D]">
                    Quebra ({dadosTransformacao.unidade_inicial})
                    <span className="text-xs text-[#5F6B6D]/60 ml-2">
                      (Peso perdido no processamento)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={dadosTransformacao.quantidade_inicial}
                    value={dadosTransformacao.percentual_quebra}
                    onChange={(e) => setDadosTransformacao(prev => ({...prev, percentual_quebra: parseFloat(e.target.value) || 0}))}
                    className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                    placeholder={`Ex: 0.5 ${dadosTransformacao.unidade_inicial}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5F6B6D]">
                    Data da Transformação *
                  </label>
                  <input
                    type="date"
                    value={dadosTransformacao.data_transformacao}
                    onChange={(e) => setDadosTransformacao(prev => ({...prev, data_transformacao: e.target.value}))}
                    className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5F6B6D]">
                    Dias de Validade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={dadosTransformacao.dias_validade}
                    onChange={(e) => setDadosTransformacao(prev => ({...prev, dias_validade: parseInt(e.target.value) || 1}))}
                    className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#5F6B6D]">
                  Observações
                </label>
                <textarea
                  value={dadosTransformacao.observacoes}
                  onChange={(e) => setDadosTransformacao(prev => ({...prev, observacoes: e.target.value}))}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                  placeholder="Informações adicionais sobre a transformação..."
                />
              </div>

              {/* Resumo */}
              {dadosTransformacao.quantidade_inicial > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">Resumo</h3>
                  <p><strong>Quantidade Líquida:</strong> {(dadosTransformacao.quantidade_inicial - dadosTransformacao.percentual_quebra).toFixed(3)} {dadosTransformacao.unidade_inicial}</p>
                  <p><strong>Quebra:</strong> {dadosTransformacao.percentual_quebra.toFixed(3)} {dadosTransformacao.unidade_inicial}</p>
                  <p><strong>Porcentagem de Quebra:</strong> {dadosTransformacao.quantidade_inicial > 0 ? ((dadosTransformacao.percentual_quebra / dadosTransformacao.quantidade_inicial) * 100).toFixed(1) : 0}%</p>
                  <p><strong>Custo Total:</strong> R$ {(dadosTransformacao.custo_medio * dadosTransformacao.quantidade_inicial).toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* ETAPA 2: Porções */}
          {etapaAtual === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#5F6B6D] flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Definir Porções Resultantes
                </h2>
                <button
                  onClick={adicionarItem}
                  className="bg-[#3599B8] text-white px-4 py-2 rounded-lg hover:bg-[#3599B8]/90 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Porção
                </button>
              </div>

              {/* Lista de itens */}
              {itensTransformacao.length > 0 ? (
                <div className="space-y-4">
                  {itensTransformacao.map((item, index) => (
                    <div key={index} className="border border-[#E8E8E8] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-[#5F6B6D]">Porção #{index + 1}</h3>
                        <button
                          onClick={() => removerItem(index)}
                          className="text-[#FB8281] hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-[#5F6B6D]">
                            Código da Porção (Automático)
                          </label>
                          <input
                            type="text"
                            value={item.produto_porcao_codigo}
                            readOnly
                            className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg bg-gray-50 text-[#5F6B6D]"
                            placeholder="Código será gerado automaticamente"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-2 relative">
                          <label className="block text-sm font-medium text-[#5F6B6D]">
                            Produto Porção *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={item.produto_porcao_nome}
                              onChange={(e) => {
                                atualizarItem(index, 'produto_porcao_nome', e.target.value)
                                buscarProdutosPorcao(e.target.value)
                              }}
                              className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent pr-10"
                              placeholder="Digite para buscar produto..."
                            />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5F6B6D]/60" />
                            
                            {/* Dropdown de produtos */}
                            {produtosPorcao.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8E8E8] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                {produtosPorcao.map((produto, produtoIndex) => (
                                  <button
                                    key={produtoIndex}
                                    type="button"
                                    onClick={() => selecionarProdutoPorcao(index, produto)}
                                    className="w-full text-left px-3 py-2 hover:bg-[#F5F7FA] border-b border-[#E8E8E8] last:border-b-0"
                                  >
                                    <div className="font-medium text-[#5F6B6D]">{produto.nome}</div>
                                    <div className="text-xs text-[#5F6B6D]/60">{produto.categoria}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {buscandoProdutosPorcao && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8E8E8] rounded-lg shadow-lg p-3 text-center text-[#5F6B6D]/60">
                                Buscando produtos...
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-[#5F6B6D]">
                            Quantidade de Porções *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade_porcoes}
                            onChange={(e) => atualizarItem(index, 'quantidade_porcoes', parseInt(e.target.value) || 1)}
                            onBlur={() => calcularItem(index)}
                            className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-[#5F6B6D]">
                            Quantidade Usada (kg) *
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.quantidade_utilizada}
                            onChange={(e) => atualizarItem(index, 'quantidade_utilizada', parseFloat(e.target.value) || 0)}
                            onBlur={() => calcularItem(index)}
                            className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg focus:ring-2 focus:ring-[#3599B8] focus:border-transparent"
                            placeholder="Ex: 2.500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-[#5F6B6D]">
                            Peso Médio por Porção (Automático)
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            value={item.peso_medio_porcao}
                            readOnly
                            className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg bg-gray-50 text-[#5F6B6D]"
                            placeholder="Calculado automaticamente"
                          />
                        </div>

                      </div>

                      {/* Cálculos automáticos */}
                      <div className="mt-4 bg-gray-50 rounded-lg p-3">
                        <div className="text-sm space-y-1">
                          <p><strong>Peso Total Utilizado:</strong> {item.quantidade_utilizada.toFixed(3)} kg</p>
                          <p><strong>Custo Unitário:</strong> R$ {item.custo_unitario.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Resumo de validação */}
                  <div className={`border rounded-lg p-4 ${validacaoPeso ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <h3 className={`font-medium mb-2 ${validacaoPeso ? 'text-green-900' : 'text-red-900'}`}>
                      Validação de Peso
                    </h3>
                    <p><strong>Peso Líquido Disponível:</strong> {quantidadeLiquida.toFixed(3)} kg</p>
                    <p><strong>Peso Total Utilizado:</strong> {totalQuantidadeUtilizada.toFixed(3)} kg</p>
                    <p><strong>Diferença:</strong> {(quantidadeLiquida - totalQuantidadeUtilizada).toFixed(3)} kg</p>
                    {!validacaoPeso && (
                      <p className="text-red-600 text-sm mt-2">
                        ⚠️ O peso total das porções excede o peso líquido disponível!
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#5F6B6D]/60">
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma porção definida ainda</p>
                  <button
                    onClick={adicionarItem}
                    className="mt-4 bg-[#3599B8] text-white px-4 py-2 rounded-lg hover:bg-[#3599B8]/90 transition-colors"
                  >
                    Adicionar Primeira Porção
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ETAPA 3: Confirmação */}
          {etapaAtual === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#5F6B6D] flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Confirmar Transformação
              </h2>

              {/* Resumo completo */}
              <div className="space-y-6">
                {/* Produto base */}
                <div className="border border-[#E8E8E8] rounded-lg p-4">
                  <h3 className="font-medium text-[#5F6B6D] mb-3">Produto Base</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Produto:</strong> {dadosTransformacao.produto_bruto_nome}</p>
                    <p><strong>Código:</strong> {dadosTransformacao.produto_bruto_codigo}</p>
                    <p><strong>Quantidade:</strong> {dadosTransformacao.quantidade_inicial} {dadosTransformacao.unidade_inicial}</p>
                    <p><strong>Quebra:</strong> {dadosTransformacao.percentual_quebra} {dadosTransformacao.unidade_inicial} ({dadosTransformacao.quantidade_inicial > 0 ? ((dadosTransformacao.percentual_quebra / dadosTransformacao.quantidade_inicial) * 100).toFixed(1) : 0}%)</p>
                    <p><strong>Data:</strong> {new Date(dadosTransformacao.data_transformacao).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Validade:</strong> {dadosTransformacao.dias_validade} dias</p>
                  </div>
                </div>

                {/* Porções */}
                <div className="border border-[#E8E8E8] rounded-lg p-4">
                  <h3 className="font-medium text-[#5F6B6D] mb-3">Porções ({itensTransformacao.length})</h3>
                  <div className="space-y-3">
                    {itensTransformacao.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <p><strong>Nome:</strong> {item.produto_porcao_nome}</p>
                          <p><strong>Código:</strong> {item.produto_porcao_codigo}</p>
                          <p><strong>Quantidade:</strong> {item.quantidade_porcoes} porções</p>
                          <p><strong>Peso Médio:</strong> {(item.peso_medio_porcao * 1000).toFixed(0)}g cada</p>
                          <p><strong>Peso Total:</strong> {item.quantidade_utilizada.toFixed(3)} kg</p>
                          <p><strong>Custo Unit.:</strong> R$ {item.custo_unitario.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumo final */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3">Resumo Final</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Total de Porções:</strong> {itensTransformacao.reduce((acc, item) => acc + item.quantidade_porcoes, 0)}</p>
                    <p><strong>Peso Utilizado:</strong> {totalQuantidadeUtilizada.toFixed(3)} kg</p>
                    <p><strong>Peso Disponível:</strong> {quantidadeLiquida.toFixed(3)} kg</p>
                    <p><strong>Aproveitamento:</strong> {((totalQuantidadeUtilizada / quantidadeLiquida) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {!validacaoPeso && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">
                    ⚠️ <strong>Atenção:</strong> O peso das porções excede o peso disponível. 
                    Volte à etapa anterior para ajustar.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botões de navegação */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#E8E8E8]">
            <button
              onClick={etapaAnterior}
              disabled={etapaAtual === 1}
              className="flex items-center gap-2 px-4 py-2 text-[#5F6B6D] border border-[#E8E8E8] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>

            <div className="text-sm text-[#5F6B6D]/70">
              Etapa {etapaAtual} de 3
            </div>

            {etapaAtual < 3 ? (
              <button
                onClick={proximaEtapa}
                disabled={etapaAtual === 1 ? !validarEtapa1() : !validarEtapa2()}
                className="flex items-center gap-2 bg-[#3599B8] text-white px-4 py-2 rounded-lg hover:bg-[#3599B8]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={salvarTransformacao}
                disabled={loading || !validacaoPeso}
                className="flex items-center gap-2 bg-[#4AC5BB] text-white px-6 py-2 rounded-lg hover:bg-[#4AC5BB]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Criar Transformação'}
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}