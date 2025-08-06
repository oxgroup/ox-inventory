-- Remover trigger problemático e função
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verificar se há usuários órfãos no auth sem correspondência na tabela usuarios
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  u.id as user_id,
  u.email as user_email,
  u.auth_id
FROM auth.users au
LEFT JOIN usuarios u ON u.auth_id = au.id OR u.email = au.email
ORDER BY au.created_at DESC;

-- Limpar usuários órfãos no auth se necessário
-- DELETE FROM auth.users WHERE email NOT IN (SELECT email FROM usuarios);
