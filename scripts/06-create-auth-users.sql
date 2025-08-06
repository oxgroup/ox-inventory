-- Script para criar usuários no Supabase Auth
-- IMPORTANTE: Este script deve ser executado no painel do Supabase ou via API

-- Primeiro, vamos verificar se os usuários já existem na tabela usuarios
SELECT 
  u.nome,
  u.email,
  u.auth_id,
  l.codigo as loja
FROM usuarios u
LEFT JOIN lojas l ON l.id = u.loja_id
ORDER BY l.codigo, u.nome;

-- Se não houver auth_id preenchido, significa que os usuários foram criados
-- mas não estão vinculados ao Supabase Auth

-- Para criar os usuários no Supabase Auth, você precisa:
-- 1. Ir ao painel do Supabase
-- 2. Authentication > Users
-- 3. Criar cada usuário manualmente OU
-- 4. Usar a API do Supabase Auth

-- Exemplo de como criar via API (JavaScript):
/*
const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin.cwb@oxgrill.com',
  password: '123456',
  email_confirm: true,
  user_metadata: {
    nome: 'Admin CWB'
  }
})
*/

-- Usuários que devem ser criados no Supabase Auth:
-- 1. admin.cwb@oxgrill.com / 123456
-- 2. admin.bc@oxgrill.com / 123456  
-- 3. joao.cwb@oxgrill.com / 123456
-- 4. maria.bc@oxgrill.com / 123456
-- 5. carlos.cwb@oxgrill.com / 123456
-- 6. ana.bc@oxgrill.com / 123456
