const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do cliente admin
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeDuplicates() {
  console.log('🔍 Analisando produtos com cod_item duplicados...\n')

  const { data, error } = await supabase.rpc('analyze_duplicate_cod_items')
  
  if (error) {
    // Se a function não existir, usar query direta
    const { data: directData, error: directError } = await supabase
      .from('produtos')
      .select('cod_item, id, nome, created_at')
      .not('cod_item', 'is', null)
      .neq('cod_item', '')
      .order('cod_item, created_at')

    if (directError) {
      console.error('❌ Erro ao buscar produtos:', directError)
      return null
    }

    // Agrupar manualmente
    const grouped = {}
    directData.forEach(produto => {
      if (!grouped[produto.cod_item]) {
        grouped[produto.cod_item] = []
      }
      grouped[produto.cod_item].push(produto)
    })

    // Filtrar apenas duplicados
    const duplicates = Object.entries(grouped)
      .filter(([_, produtos]) => produtos.length > 1)
      .map(([cod_item, produtos]) => ({
        cod_item,
        quantidade: produtos.length,
        produtos: produtos.map(p => `${p.nome} (ID: ${p.id}, ${new Date(p.created_at).toLocaleDateString()})`).join(' | ')
      }))

    return duplicates
  }

  return data
}

async function removeDuplicates(dryRun = true) {
  console.log('🧹 Removendo produtos duplicados...\n')

  if (dryRun) {
    console.log('🔍 MODO SIMULAÇÃO - Nenhum produto será removido\n')
  }

  // Query para encontrar IDs dos produtos duplicados (mantém o mais antigo)
  const query = `
    SELECT p1.id, p1.nome, p1.cod_item, p1.created_at
    FROM produtos p1
    WHERE p1.cod_item IS NOT NULL 
      AND p1.cod_item != ''
      AND EXISTS (
        SELECT 1 
        FROM produtos p2 
        WHERE p2.cod_item = p1.cod_item 
          AND p2.created_at < p1.created_at
      )
    ORDER BY p1.cod_item, p1.created_at
  `

  const { data: toRemove, error: queryError } = await supabase.rpc('execute_sql', { query })
  
  if (queryError) {
    // Fallback para query direta
    const { data: allProducts, error } = await supabase
      .from('produtos')
      .select('id, nome, cod_item, created_at')
      .not('cod_item', 'is', null)
      .neq('cod_item', '')
      .order('cod_item, created_at')

    if (error) {
      console.error('❌ Erro ao buscar produtos:', error)
      return
    }

    // Identificar duplicados manualmente
    const grouped = {}
    allProducts.forEach(produto => {
      if (!grouped[produto.cod_item]) {
        grouped[produto.cod_item] = []
      }
      grouped[produto.cod_item].push(produto)
    })

    const toRemoveIds = []
    Object.values(grouped).forEach(produtos => {
      if (produtos.length > 1) {
        // Remove todos exceto o mais ANTIGO (menor created_at)
        const sorted = produtos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        toRemoveIds.push(...sorted.slice(1).map(p => p.id)) // Mantém apenas o primeiro (mais antigo)
      }
    })

    const toRemoveData = allProducts.filter(p => toRemoveIds.includes(p.id))

    console.log(`📊 Produtos que serão removidos: ${toRemoveData.length}`)
    toRemoveData.forEach(produto => {
      console.log(`   - ${produto.nome} (ID: ${produto.id}, cod_item: ${produto.cod_item}, criado: ${produto.created_at})`)
    })

    if (!dryRun && toRemoveData.length > 0) {
      console.log('\n🗑️  Removendo produtos...')
      
      const { error: deleteError } = await supabase
        .from('produtos')
        .delete()
        .in('id', toRemoveIds)

      if (deleteError) {
        console.error('❌ Erro ao remover produtos:', deleteError)
      } else {
        console.log(`✅ ${toRemoveData.length} produtos removidos com sucesso!`)
      }
    }

    return toRemoveData.length
  }

  return 0
}

async function addUniqueConstraint() {
  console.log('🔒 Adicionando constraint única para cod_item...')

  const { error } = await supabase.rpc('execute_sql', {
    query: 'ALTER TABLE produtos ADD CONSTRAINT unique_cod_item UNIQUE (cod_item)'
  })

  if (error) {
    console.log('⚠️  Não foi possível adicionar constraint única:', error.message)
  } else {
    console.log('✅ Constraint única adicionada com sucesso!')
  }
}

async function main() {
  console.log('🚀 Script de Remoção de Produtos Duplicados\n')

  try {
    // 1. Analisar duplicados
    const duplicates = await analyzeDuplicates()
    
    if (!duplicates || duplicates.length === 0) {
      console.log('✅ Nenhum produto com cod_item duplicado encontrado!')
      return
    }

    console.log(`📋 Encontrados ${duplicates.length} cod_items duplicados:\n`)
    duplicates.forEach(dup => {
      console.log(`   cod_item: ${dup.cod_item} (${dup.quantidade} produtos)`)
      console.log(`   produtos: ${dup.produtos}\n`)
    })

    // 2. Executar simulação
    console.log('=' .repeat(60))
    const toRemoveCount = await removeDuplicates(true)

    if (toRemoveCount === 0) {
      console.log('✅ Nenhum produto precisa ser removido!')
      return
    }

    // 3. Confirmar execução
    console.log('=' .repeat(60))
    console.log('⚠️  ATENÇÃO: Esta operação IRÁ REMOVER produtos permanentemente!')
    console.log('💡 Certifique-se de ter um backup do banco de dados antes de continuar.\n')

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise(resolve => {
      readline.question('Deseja prosseguir com a remoção? (digite "CONFIRMAR" para continuar): ', resolve)
    })

    readline.close()

    if (answer === 'CONFIRMAR') {
      await removeDuplicates(false)
      
      // 4. Opcional: Adicionar constraint única
      const addConstraint = await new Promise(resolve => {
        const rl = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        })
        rl.question('Deseja adicionar uma constraint única para evitar futuros duplicados? (s/n): ', resolve)
        rl.close()
      })

      if (addConstraint.toLowerCase() === 's' || addConstraint.toLowerCase() === 'sim') {
        await addUniqueConstraint()
      }

      console.log('\n✅ Processo concluído com sucesso!')
    } else {
      console.log('❌ Operação cancelada pelo usuário.')
    }

  } catch (error) {
    console.error('💥 Erro durante a execução:', error)
  }
}

// Executar script
main().catch(console.error)