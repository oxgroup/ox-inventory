import { supabase } from "./supabase"

// Types para fotos do preparo
export interface FotoPreparoEtapa {
  ordem: number
  etapa: string
  foto_url: string
  descricao?: string
}

// Types para a nova estrutura de fichas técnicas
export interface Prato {
  id: string
  nome: string
  descricao?: string
  categoria?: string
  modo_preparo?: string
  foto_prato_final?: string
  fotos_preparo?: FotoPreparoEtapa[]
  usuario_id: string
  loja_id: string
  ativo: boolean
  pode_ser_insumo?: boolean // Novo campo para ingredientes compostos
  setores?: string[] // Array de setores onde a ficha é utilizada
  created_at: string
  updated_at: string
  // Dados relacionais
  usuario?: {
    nome: string
    email: string
  }
  loja?: {
    nome: string
    codigo: string
  }
  fichas_tecnicas?: FichaTecnica[]
  // Contadores calculados
  total_ingredientes?: number
  custo_total?: number
}

export interface FichaTecnica {
  id: string
  prato_id: string
  item: string // Nome do prato (duplicado para compatibilidade)
  insumo: string
  qtd: number
  quebra: number
  unidade: string
  codigo_empresa?: string
  qtd_receita: number
  fator_correcao: number
  obs_item_ft?: string
  id_grupo?: string
  seq: number
  qtd_lote: number
  id_cliente_queops?: string
  produto_id?: string
  ficha_tecnica_ref_id?: string | null // Referência para outro prato quando ingrediente composto
  created_at: string
  updated_at: string
  // Dados do produto
  produto_nome?: string
  produto_categoria?: string
  produto_cod_item?: string
  produto_codigo_barras?: string
  // Dados do prato referenciado (quando ingrediente composto)
  prato_referenciado?: {
    id: string
    nome: string
    categoria?: string
    custo_unitario?: number
  }
  // Cálculos
  qtd_total_calculada?: number
  custo_unitario?: number
  custo_total?: number
}

export interface NovoPrato {
  nome: string
  descricao?: string
  categoria?: string
  modo_preparo?: string
  foto_prato_final?: string
  fotos_preparo?: FotoPreparoEtapa[]
  usuario_id: string
  loja_id: string
  pode_ser_insumo?: boolean // Permite que seja usado como ingrediente
  setores?: string[] // Array de setores onde a ficha é utilizada
  ingredientes: NovaFichaTecnica[]
}

export interface NovaFichaTecnica {
  insumo: string
  qtd: number
  quebra?: number
  unidade: string
  codigo_empresa?: string
  qtd_receita?: number
  fator_correcao?: number
  obs_item_ft?: string
  id_grupo?: string
  seq?: number
  qtd_lote?: number
  id_cliente_queops?: string
  produto_id?: string
  ficha_tecnica_ref_id?: string | null // Para ingredientes compostos
}

// Enum para tipos de ingredientes
export enum TipoIngrediente {
  PRODUTO = 'produto',
  FICHA_TECNICA = 'ficha_tecnica'
}

// Interface para selecionar tipo de ingrediente
export interface IngredienteComposto {
  tipo: TipoIngrediente
  produto_id?: string
  ficha_tecnica_ref_id?: string
  nome: string
  categoria?: string
  unidade_padrao?: string
}

// Função utilitária para retry de operações
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1)
        console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${waitTime}ms...`, error.message)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  throw lastError
}

// Serviço de pratos (produtos com fichas técnicas)
export const pratosService = {
  // Listar pratos da loja (com filtro opcional por setor)
  async listar(lojaId: string, filtroSetor?: string) {
    console.log('🔍 pratosService.listar iniciado para loja:', lojaId)
    
    return withRetry(async () => {
      console.log('📊 Executando query no Supabase...')
      
      // Query com suporte a setores
      let query = supabase
        .from("pratos")
        .select(`
          id, nome, descricao, categoria, modo_preparo, foto_prato_final, fotos_preparo,
          usuario_id, loja_id, ativo, setores, created_at, updated_at,
          usuarios!pratos_usuario_id_fkey (
            nome,
            email
          ),
          lojas!pratos_loja_id_fkey (
            nome,
            codigo
          ),
          fichas_tecnicas!fichas_tecnicas_prato_id_fkey (
            id, prato_id, insumo, qtd, quebra, unidade, codigo_empresa,
            qtd_receita, fator_correcao, obs_item_ft, id_grupo, seq,
            qtd_lote, id_cliente_queops, produto_id, item, created_at, updated_at
          )
        `)
        .eq("loja_id", lojaId)
        .eq("ativo", true)

      // Filtro por setor se especificado
      if (filtroSetor && filtroSetor !== 'Todos') {
        query = query.contains("setores", `["${filtroSetor}"]`)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      console.log('📊 Resposta do Supabase:', {
        dataLength: data?.length || 0,
        error: error ? {
          message: error.message,
          code: error.code,
          details: error.details
        } : null
      })

      if (error) {
        console.error('❌ Erro na query de listagem de pratos:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          lojaId
        })
        throw error
      }
      
      console.log('🔄 Processando dados dos pratos...')
      
      // Calcular estatísticas para cada prato
      const pratosComStats = data?.map(prato => ({
        ...prato,
        usuario: prato.usuarios,
        loja: prato.lojas,
        total_ingredientes: prato.fichas_tecnicas?.length || 0,
        custo_total: 0, // TODO: calcular baseado nos produtos
        pode_ser_insumo: false, // Campo padrão até que a coluna seja criada
        setores: prato.setores || [] // Array de setores
      })) || []

      console.log('✅ Pratos processados:', pratosComStats.length, 'itens')
      
      return pratosComStats as Prato[]
    })
  },

  // Criar novo prato com ingredientes
  async criar(novoPrato: NovoPrato) {
    return withRetry(async () => {
      // Tentar primeiro com os novos campos
      let { data: prato, error: pratoError } = await supabase
        .from("pratos")
        .insert({
          nome: novoPrato.nome,
          descricao: novoPrato.descricao,
          categoria: novoPrato.categoria,
          modo_preparo: novoPrato.modo_preparo,
          foto_prato_final: novoPrato.foto_prato_final,
          fotos_preparo: novoPrato.fotos_preparo || [],
          usuario_id: novoPrato.usuario_id,
          loja_id: novoPrato.loja_id,
          pode_ser_insumo: novoPrato.pode_ser_insumo || false,
          setores: novoPrato.setores || []
        })
        .select()
        .single()

      // Se deu erro por causa da coluna, tentar sem ela
      if (pratoError && pratoError.message?.includes('column') && pratoError.message?.includes('does not exist')) {
        console.warn('Tentando criar prato sem campo pode_ser_insumo:', pratoError.message)
        
        const result = await supabase
          .from("pratos")
          .insert({
            nome: novoPrato.nome,
            descricao: novoPrato.descricao,
            categoria: novoPrato.categoria,
            modo_preparo: novoPrato.modo_preparo,
            foto_prato_final: novoPrato.foto_prato_final,
            fotos_preparo: novoPrato.fotos_preparo || [],
            usuario_id: novoPrato.usuario_id,
            loja_id: novoPrato.loja_id
          })
          .select()
          .single()
        
        prato = result.data
        pratoError = result.error
      }

      if (pratoError) throw pratoError

      // Criar ingredientes (fichas técnicas)
      if (novoPrato.ingredientes.length > 0) {
        const ingredientesParaInserir = novoPrato.ingredientes.map((ingrediente, index) => ({
          prato_id: prato.id,
          item: novoPrato.nome, // Nome do prato
          insumo: ingrediente.insumo,
          qtd: ingrediente.qtd,
          quebra: ingrediente.quebra || 0,
          unidade: ingrediente.unidade,
          codigo_empresa: ingrediente.codigo_empresa,
          qtd_receita: ingrediente.qtd_receita || 0,
          fator_correcao: ingrediente.fator_correcao || 1,
          obs_item_ft: ingrediente.obs_item_ft,
          id_grupo: ingrediente.id_grupo,
          seq: ingrediente.seq || index + 1,
          qtd_lote: ingrediente.qtd_lote || 0,
          id_cliente_queops: ingrediente.id_cliente_queops,
          produto_id: ingrediente.produto_id
        }))

        const { error: ingredientesError } = await supabase
          .from("fichas_tecnicas")
          .insert(ingredientesParaInserir)

        if (ingredientesError) throw ingredientesError
      }

      return prato
    })
  },

  // Obter prato por ID com ingredientes
  async obter(id: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("pratos")
        .select(`
          *,
          usuarios!pratos_usuario_id_fkey (
            nome,
            email
          ),
          lojas!pratos_loja_id_fkey (
            nome,
            codigo
          ),
          fichas_tecnicas!fichas_tecnicas_prato_id_fkey (
            *,
            produtos (
              nome,
              categoria,
              cod_item,
              codigo_barras
            )
          )
        `)
        .eq("id", id)
        .single()

      if (error) throw error

      // Processar dados relacionais e calcular valores
      const pratoCompleto = {
        ...data,
        usuario: data.usuarios,
        loja: data.lojas,
        fichas_tecnicas: data.fichas_tecnicas?.map((ingrediente: any) => ({
          ...ingrediente,
          produto_nome: ingrediente.produtos?.nome,
          produto_categoria: ingrediente.produtos?.categoria,
          produto_cod_item: ingrediente.produtos?.cod_item,
          produto_codigo_barras: ingrediente.produtos?.codigo_barras,
          qtd_total_calculada: ingrediente.qtd * (1 + ingrediente.quebra / 100) * ingrediente.fator_correcao
        })).sort((a: any, b: any) => a.seq - b.seq) || []
      }

      return pratoCompleto as Prato & { fichas_tecnicas: FichaTecnica[] }
    })
  },

  // Atualizar prato
  async atualizar(id: string, updates: Partial<Prato>) {
    return withRetry(async () => {
      // Tentar primeiro com os novos campos
      let { data, error } = await supabase
        .from("pratos")
        .update({
          nome: updates.nome,
          descricao: updates.descricao,
          categoria: updates.categoria,
          modo_preparo: updates.modo_preparo,
          foto_prato_final: updates.foto_prato_final,
          fotos_preparo: updates.fotos_preparo,
          pode_ser_insumo: updates.pode_ser_insumo,
          setores: updates.setores
        })
        .eq("id", id)
        .select()
        .single()

      // Se deu erro por causa da coluna, tentar sem ela
      if (error && error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.warn('Tentando atualizar prato sem campo pode_ser_insumo:', error.message)
        
        const result = await supabase
          .from("pratos")
          .update({
            nome: updates.nome,
            descricao: updates.descricao,
            categoria: updates.categoria,
            modo_preparo: updates.modo_preparo,
            foto_prato_final: updates.foto_prato_final,
            fotos_preparo: updates.fotos_preparo
          })
          .eq("id", id)
          .select()
          .single()
        
        data = result.data
        error = result.error
      }

      if (error) throw error
      return data
    })
  },

  // Excluir prato (soft delete)
  async excluir(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from("pratos")
        .update({ ativo: false })
        .eq("id", id)

      if (error) throw error
    })
  },

  // Obter estatísticas
  async obterEstatisticas(lojaId: string, usuarioId?: string) {
    return withRetry(async () => {
      let query = supabase
        .from("pratos")
        .select("id, created_at, usuario_id")
        .eq("loja_id", lojaId)
        .eq("ativo", true)

      const { data, error } = await query

      if (error) throw error

      const total = data?.length || 0
      const minhas = usuarioId ? data?.filter(p => p.usuario_id === usuarioId).length || 0 : 0
      const esteMes = data?.filter(p => {
        const created = new Date(p.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length || 0

      return {
        total,
        minhas,
        este_mes: esteMes,
        crescimento_mensal: 0 // TODO: calcular crescimento comparado ao mês anterior
      }
    })
  }
}

// Serviço de fichas técnicas (ingredientes) - CRUD direto na tabela fichas_tecnicas
export const fichasTecnicasService = {
  // Listar ingredientes de um prato
  async listarPorPrato(pratoId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .select(`
          *,
          produtos (
            nome,
            categoria,
            cod_item,
            codigo_barras
          )
        `)
        .eq("prato_id", pratoId)
        .order("seq")

      if (error) throw error

      // Processar dados relacionais e cálculos
      const ingredientesProcessados = data?.map(ingrediente => ({
        ...ingrediente,
        produto_nome: ingrediente.produtos?.nome,
        produto_categoria: ingrediente.produtos?.categoria,
        produto_cod_item: ingrediente.produtos?.cod_item,
        produto_codigo_barras: ingrediente.produtos?.codigo_barras,
        qtd_total_calculada: ingrediente.qtd * (1 + ingrediente.quebra / 100) * ingrediente.fator_correcao
      })) || []

      return ingredientesProcessados as FichaTecnica[]
    })
  },

  // Adicionar ingrediente a um prato
  async adicionar(ingrediente: NovaFichaTecnica & { prato_id: string, item: string }) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .insert(ingrediente)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Atualizar ingrediente
  async atualizar(id: string, updates: Partial<FichaTecnica>) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    })
  },

  // Excluir ingrediente
  async excluir(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from("fichas_tecnicas")
        .delete()
        .eq("id", id)

      if (error) throw error
    })
  },

  // Reordenar ingredientes
  async reordenar(ingredientes: { id: string, seq: number }[]) {
    return withRetry(async () => {
      const updates = ingredientes.map(ingrediente => 
        supabase
          .from("fichas_tecnicas")
          .update({ seq: ingrediente.seq })
          .eq("id", ingrediente.id)
      )

      const results = await Promise.all(updates)
      
      for (const result of results) {
        if (result.error) throw result.error
      }
    })
  },

  // Buscar por ingrediente específico
  async buscarPorInsumo(insumo: string, lojaId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .select(`
          *,
          pratos!fichas_tecnicas_prato_id_fkey (
            nome,
            categoria
          )
        `)
        .ilike("insumo", `%${insumo}%`)
        .eq("pratos.loja_id", lojaId)

      if (error) throw error
      return data || []
    })
  },

  // Atualizar ingredientes de um prato (remover e recriar todos)
  async atualizarIngredientes(pratoId: string, ingredientes: NovaFichaTecnica[]) {
    return withRetry(async () => {
      // Primeiro, remover todos os ingredientes existentes
      const { error: deleteError } = await supabase
        .from("fichas_tecnicas")
        .delete()
        .eq("prato_id", pratoId)

      if (deleteError) throw deleteError

      // Depois, inserir os novos ingredientes se houver algum
      if (ingredientes.length > 0) {
        const ingredientesParaInserir = ingredientes.map((ingrediente, index) => ({
          prato_id: pratoId,
          insumo: ingrediente.insumo,
          qtd: ingrediente.qtd,
          quebra: ingrediente.quebra || 0,
          unidade: ingrediente.unidade,
          codigo_empresa: ingrediente.codigo_empresa || null,
          qtd_receita: ingrediente.qtd_receita || 0,
          fator_correcao: ingrediente.fator_correcao || 1,
          obs_item_ft: ingrediente.obs_item_ft || null,
          id_grupo: ingrediente.id_grupo || null,
          seq: ingrediente.seq || index + 1,
          qtd_lote: ingrediente.qtd_lote || 0,
          id_cliente_queops: ingrediente.id_cliente_queops || null,
          produto_id: ingrediente.produto_id || null,
          ficha_tecnica_ref_id: ingrediente.ficha_tecnica_ref_id || null, // Novo campo
          item: ingrediente.insumo // Campo necessário para compatibilidade
        }))

        // Tentar inserir com o campo novo primeiro
        let { error: insertError } = await supabase
          .from("fichas_tecnicas")
          .insert(ingredientesParaInserir)

        // Se deu erro por causa da coluna nova, tentar sem ela
        if (insertError && insertError.message?.includes('column') && insertError.message?.includes('does not exist')) {
          console.warn('Tentando inserir ingredientes sem campo ficha_tecnica_ref_id:', insertError.message)
          
          const ingredientesSemNovosCampos = ingredientes.map((ingrediente, index) => ({
            prato_id: pratoId,
            insumo: ingrediente.insumo,
            qtd: ingrediente.qtd,
            quebra: ingrediente.quebra || 0,
            unidade: ingrediente.unidade,
            codigo_empresa: ingrediente.codigo_empresa || null,
            qtd_receita: ingrediente.qtd_receita || 0,
            fator_correcao: ingrediente.fator_correcao || 1,
            obs_item_ft: ingrediente.obs_item_ft || null,
            id_grupo: ingrediente.id_grupo || null,
            seq: ingrediente.seq || index + 1,
            qtd_lote: ingrediente.qtd_lote || 0,
            id_cliente_queops: ingrediente.id_cliente_queops || null,
            produto_id: ingrediente.produto_id || null,
            item: ingrediente.insumo
          }))
          
          const result = await supabase
            .from("fichas_tecnicas")
            .insert(ingredientesSemNovosCampos)
          
          insertError = result.error
        }

        if (insertError) throw insertError
      }

      return true
    })
  },

  // Listar ingredientes com dados de prato referenciado
  async listarComReferencias(pratoId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("fichas_tecnicas")
        .select(`
          *,
          produtos (
            nome,
            categoria,
            cod_item,
            codigo_barras
          ),
          pratos!fichas_tecnicas_ficha_tecnica_ref_id_fkey (
            id,
            nome,
            categoria
          )
        `)
        .eq("prato_id", pratoId)
        .order("seq")

      if (error) throw error

      // Processar dados relacionais
      const ingredientesProcessados = data?.map(ingrediente => ({
        ...ingrediente,
        produto_nome: ingrediente.produtos?.nome,
        produto_categoria: ingrediente.produtos?.categoria,
        produto_cod_item: ingrediente.produtos?.cod_item,
        produto_codigo_barras: ingrediente.produtos?.codigo_barras,
        prato_referenciado: ingrediente.pratos ? {
          id: ingrediente.pratos.id,
          nome: ingrediente.pratos.nome,
          categoria: ingrediente.pratos.categoria
        } : null,
        qtd_total_calculada: ingrediente.qtd * (1 + ingrediente.quebra / 100) * ingrediente.fator_correcao
      })) || []

      return ingredientesProcessados as FichaTecnica[]
    })
  }
}

// Serviço para ingredientes compostos
export const ingredientesCompostosService = {
  // Listar pratos que podem ser usados como insumos
  async listarPratosDisponiveis(lojaId: string, pratoIdExcluir?: string) {
    return withRetry(async () => {
      let query = supabase
        .from("pratos")
        .select(`
          id,
          nome,
          categoria,
          descricao,
          usuario_id,
          created_at,
          usuario:usuarios(nome)
        `)
        .eq("loja_id", lojaId)
        .eq("ativo", true)
        .eq("pode_ser_insumo", true)

      // Excluir o prato atual para evitar auto-referência
      if (pratoIdExcluir) {
        query = query.neq("id", pratoIdExcluir)
      }

      const { data, error } = await query.order("nome")

      if (error) throw error
      return data || []
    })
  },

  // Verificar dependências circulares
  async verificarDependenciaCircular(pratoOrigemId: string, pratoDestinoId: string): Promise<boolean> {
    return withRetry(async () => {
      // Chamar a função SQL criada no script
      const { data, error } = await supabase
        .rpc('verificar_dependencia_circular', {
          prato_origem: pratoOrigemId,
          prato_destino: pratoDestinoId
        })

      if (error) {
        console.error('Erro ao verificar dependência circular:', error)
        return false // Em caso de erro, permitir para não bloquear o fluxo
      }

      return data || false
    })
  },

  // Marcar/desmarcar prato como insumo
  async alternarStatusInsumo(pratoId: string, podeSerInsumo: boolean) {
    return withRetry(async () => {
      const { error } = await supabase
        .from("pratos")
        .update({ pode_ser_insumo: podeSerInsumo })
        .eq("id", pratoId)

      if (error) throw error
      return true
    })
  },

  // Calcular custo de um ingrediente composto
  async calcularCustoIngredienteComposto(fichaReferenciaId: string, quantidade: number): Promise<number> {
    return withRetry(async () => {
      // Buscar todos os ingredientes do prato referenciado
      const ingredientes = await fichasTecnicasService.listarComReferencias(fichaReferenciaId)
      
      let custoTotal = 0
      
      for (const ingrediente of ingredientes) {
        if (ingrediente.ficha_tecnica_ref_id) {
          // Ingrediente composto - recursão
          const custoRecursivo = await this.calcularCustoIngredienteComposto(
            ingrediente.ficha_tecnica_ref_id,
            ingrediente.qtd_total_calculada || ingrediente.qtd
          )
          custoTotal += custoRecursivo
        } else {
          // Ingrediente simples - aqui integraria com preços de produtos
          // Por enquanto, usar custo zero
          custoTotal += 0
        }
      }
      
      return custoTotal * quantidade
    })
  }
}

// Serviço para gerenciar setorização das fichas técnicas
export const setoresFichasService = {
  // Listar pratos por setor
  async listarPorSetor(lojaId: string, setor: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .rpc('buscar_pratos_por_setor', {
          setor_nome: setor,
          loja_id_param: lojaId
        })

      if (error) throw error
      return data || []
    })
  },

  // Adicionar setor a um prato
  async adicionarSetor(pratoId: string, setor: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .rpc('adicionar_setor_prato', {
          prato_id_param: pratoId,
          setor_nome: setor
        })

      if (error) throw error
      return data
    })
  },

  // Remover setor de um prato
  async removerSetor(pratoId: string, setor: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .rpc('remover_setor_prato', {
          prato_id_param: pratoId,
          setor_nome: setor
        })

      if (error) throw error
      return data
    })
  },

  // Obter estatísticas de fichas por setor
  async obterEstatisticasSetores(lojaId: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('vw_fichas_tecnicas_setores')
        .select('*')

      if (error) throw error
      return data || []
    })
  },

  // Atualizar setores de um prato diretamente
  async atualizarSetores(pratoId: string, setores: string[]) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('pratos')
        .update({ setores: setores })
        .eq('id', pratoId)
        .select()
        .single()

      if (error) throw error
      return data
    })
  }
}