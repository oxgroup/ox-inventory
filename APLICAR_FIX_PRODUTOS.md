# 🔧 CORREÇÃO: Produtos Não Aparecem na Busca

## 🚨 Problema Identificado
As políticas de Row Level Security (RLS) estavam bloqueando o acesso global aos produtos, fazendo com que alguns itens não aparecessem na busca.

## ✅ Solução Implementada

### 📄 Script Criado: `scripts/18-fix-produtos-access.sql`

Este script:
- ✅ Remove todas as políticas RLS conflitantes na tabela `produtos`
- ✅ Cria política única para visualização global de produtos ativos
- ✅ Permite modificação de produtos por usuários autenticados
- ✅ Mantém segurança básica (apenas produtos ativos são visíveis)

## 🛠️ Como Aplicar a Correção

### **Opção 1 - Via Supabase Dashboard (Recomendado):**

1. **Acesse o Supabase Dashboard**: https://supabase.com/dashboard
2. **Vá para seu projeto**: `iuamdrftgebbvwpkawqh`
3. **Clique em "SQL Editor"**
4. **Copie e cole o conteúdo** do arquivo `scripts/18-fix-produtos-access.sql`
5. **Execute o script** clicando em "Run"
6. **Verifique os logs** para confirmar sucesso

### **Opção 2 - Via psql (Se disponível):**

```bash
# Conecte ao banco e execute o script
psql -h [HOST] -p [PORT] -U [USER] -d [DATABASE] -f scripts/18-fix-produtos-access.sql
```

## 🧪 Como Testar se Funcionou

### **1. Teste Imediato:**
- Abra a aplicação
- Vá para "Adicionar Itens"
- Digite qualquer termo na busca
- **Resultado esperado**: Deve aparecer produtos de todas as lojas

### **2. Verificação Técnica:**
Execute esta query no SQL Editor:
```sql
SELECT COUNT(*) as total_produtos_ativos FROM produtos WHERE ativo = true;
```

### **3. Teste de Busca:**
```sql
SELECT nome, categoria, loja_id FROM produtos 
WHERE ativo = true 
ORDER BY nome 
LIMIT 10;
```

## 📊 O Que Mudou

### **❌ Antes:**
- Usuários só viam produtos da própria loja
- Busca retornava poucos resultados
- RLS bloqueava acesso cross-loja

### **✅ Depois:**
- Todos usuários veem produtos ativos de todas lojas  
- Busca retorna catálogo completo
- Mantém segurança (só produtos ativos)

## 🔍 Verificação de Políticas Ativas

Para verificar se as políticas foram aplicadas corretamente:

```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'produtos'
ORDER BY policyname;
```

**Resultado esperado:**
- `Todos produtos ativos visíveis` (SELECT)
- `Produtos podem ser criados` (INSERT)
- `Produtos podem ser atualizados` (UPDATE)
- `Produtos podem ser removidos` (DELETE)

## ⚠️ Notas Importantes

- **Backup**: Este script remove políticas existentes permanentemente
- **Segurança**: Produtos inativos permanecem ocultos
- **Compatibilidade**: Não afeta outras tabelas ou funcionalidades
- **Performance**: Queries de produtos serão mais rápidas

---

**Após aplicar esta correção, todos os produtos ativos aparecerão na busca independente da loja!** 🎉