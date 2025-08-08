-- Script 23: Desabilitar RLS para tabela requisicoes_sugestao
-- Remove todas as políticas RLS para permitir acesso completo

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view suggestions from their store" ON requisicoes_sugestao;
DROP POLICY IF EXISTS "Users can manage suggestions in their store" ON requisicoes_sugestao;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON requisicoes_sugestao;
DROP POLICY IF EXISTS "Enable write access for privileged users" ON requisicoes_sugestao;

-- Desabilitar RLS completamente na tabela
ALTER TABLE requisicoes_sugestao DISABLE ROW LEVEL SECURITY;

-- Comentário explicativo
COMMENT ON TABLE requisicoes_sugestao IS 'Tabela de sugestões sem RLS - acesso livre para funcionamento da feature';

-- Verificar que não há mais políticas
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'requisicoes_sugestao';

-- Verificar status do RLS
SELECT 
    schemaname, 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE tablename = 'requisicoes_sugestao';