-- Script para corrigir acesso aos produtos
-- Remove políticas RLS conflitantes e implementa acesso global

-- Remove todas as políticas existentes de produtos
DROP POLICY IF EXISTS "Usuários veem apenas produtos da sua loja" ON produtos;
DROP POLICY IF EXISTS "Produtos para usuários autenticados" ON produtos;
DROP POLICY IF EXISTS "Produtos visíveis para todos" ON produtos;
DROP POLICY IF EXISTS "Produtos modificáveis apenas da própria loja" ON produtos;
DROP POLICY IF EXISTS "Produtos modificáveis por usuários autenticados" ON produtos;

-- Cria política única para visualização global de produtos ativos
CREATE POLICY "Todos produtos ativos visíveis" ON produtos
    FOR SELECT 
    TO authenticated
    USING (ativo = true);

-- Política para INSERT
CREATE POLICY "Produtos podem ser criados" ON produtos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para UPDATE
CREATE POLICY "Produtos podem ser atualizados" ON produtos
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política para DELETE
CREATE POLICY "Produtos podem ser removidos" ON produtos
    FOR DELETE
    TO authenticated
    USING (true);

-- Verificar políticas ativas após aplicação
DO $$
BEGIN
    RAISE NOTICE 'Políticas de produtos atualizadas com sucesso';
    RAISE NOTICE 'Produtos agora são visíveis globalmente para usuários autenticados';
END $$;

-- Log das políticas ativas (para debug)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'produtos'
ORDER BY policyname;