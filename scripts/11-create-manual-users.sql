-- Script para criar usuários manualmente no Supabase Auth
-- Como não temos acesso direto ao auth.users, vamos verificar o que temos

-- 1. Verificar usuários existentes na nossa tabela
SELECT 
  u.id,
  u.nome,
  u.email,
  u.auth_id,
  l.codigo as loja
FROM usuarios u
LEFT JOIN lojas l ON l.id = u.loja_id
ORDER BY l.codigo, u.nome;

-- 2. Verificar se há dados órfãos
SELECT 
  'Usuários sem auth_id' as tipo,
  count(*) as total
FROM usuarios 
WHERE auth_id IS NULL

UNION ALL

SELECT 
  'Usuários com auth_id' as tipo,
  count(*) as total
FROM usuarios 
WHERE auth_id IS NOT NULL;

-- 3. Resetar auth_ids para permitir recriar
UPDATE usuarios SET auth_id = NULL WHERE auth_id IS NOT NULL;

-- Após executar este script, teste o login novamente
-- O sistema tentará criar os usuários automaticamente
