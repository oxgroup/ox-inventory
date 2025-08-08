-- Script 22: Corrigir RLS para tabela requisicoes_sugestao
-- Execute depois do script 21-create-requisicoes-sugestao-table.sql

-- Remover políticas existentes que podem estar com problemas
DROP POLICY IF EXISTS "Users can view suggestions from their store" ON requisicoes_sugestao;
DROP POLICY IF EXISTS "Users can manage suggestions in their store" ON requisicoes_sugestao;

-- Criar políticas RLS mais simples e eficazes
-- Política para leitura - permite que todos os usuários autenticados vejam as sugestões
CREATE POLICY "Enable read access for authenticated users" ON requisicoes_sugestao
    FOR SELECT 
    TO authenticated
    USING (true);

-- Política para inserção/atualização/exclusão - apenas usuários com permissões especiais
CREATE POLICY "Enable write access for privileged users" ON requisicoes_sugestao
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE auth_id = auth.uid() 
            AND (
                permissoes && ARRAY['editar'] 
                OR permissoes && ARRAY['excluir']
                OR permissoes && ARRAY['admin']
            )
        )
    );

-- Comentário explicativo
COMMENT ON POLICY "Enable read access for authenticated users" ON requisicoes_sugestao IS 
'Permite que todos os usuários autenticados vejam sugestões - necessário para o funcionamento da feature';

COMMENT ON POLICY "Enable write access for privileged users" ON requisicoes_sugestao IS 
'Permite que apenas usuários com permissões especiais modifiquem as sugestões';

-- Verificar se as políticas foram criadas corretamente
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