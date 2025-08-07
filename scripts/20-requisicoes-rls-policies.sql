-- Políticas RLS para módulo de Requisições
-- Garante que usuários só vejam requisições de sua loja

-- Habilitar RLS nas tabelas
ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_requisicao ENABLE ROW LEVEL SECURITY;

-- ============= POLÍTICAS PARA REQUISICOES =============

-- Política para SELECT - usuários veem apenas requisições de sua loja
CREATE POLICY "select_requisicoes_by_loja" ON requisicoes
    FOR SELECT
    USING (
        loja_id IN (
            SELECT u.loja_id 
            FROM usuarios u 
            WHERE u.auth_id = auth.uid()
        )
    );

-- Política para INSERT - usuários podem criar requisições apenas para sua loja
CREATE POLICY "insert_requisicoes_by_loja" ON requisicoes
    FOR INSERT
    WITH CHECK (
        loja_id IN (
            SELECT u.loja_id 
            FROM usuarios u 
            WHERE u.auth_id = auth.uid()
        )
        AND usuario_solicitante_id IN (
            SELECT u.id 
            FROM usuarios u 
            WHERE u.auth_id = auth.uid()
        )
    );

-- Política para UPDATE - apenas estoque central pode atualizar (usuários com permissão editar)
CREATE POLICY "update_requisicoes_estoque" ON requisicoes
    FOR UPDATE
    USING (
        loja_id IN (
            SELECT u.loja_id 
            FROM usuarios u 
            WHERE u.auth_id = auth.uid()
            AND ('editar' = ANY(u.permissoes) OR 'excluir' = ANY(u.permissoes))
        )
    );

-- Política para DELETE - apenas admins podem deletar
CREATE POLICY "delete_requisicoes_admin" ON requisicoes
    FOR DELETE
    USING (
        loja_id IN (
            SELECT u.loja_id 
            FROM usuarios u 
            WHERE u.auth_id = auth.uid()
            AND 'excluir' = ANY(u.permissoes)
        )
    );

-- ============= POLÍTICAS PARA ITENS_REQUISICAO =============

-- Política para SELECT - baseada na requisição pai
CREATE POLICY "select_itens_requisicao_by_loja" ON itens_requisicao
    FOR SELECT
    USING (
        requisicao_id IN (
            SELECT r.id 
            FROM requisicoes r
            JOIN usuarios u ON u.loja_id = r.loja_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- Política para INSERT - usuários podem adicionar itens às suas requisições
CREATE POLICY "insert_itens_requisicao_by_user" ON itens_requisicao
    FOR INSERT
    WITH CHECK (
        requisicao_id IN (
            SELECT r.id 
            FROM requisicoes r
            JOIN usuarios u ON u.loja_id = r.loja_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- Política para UPDATE - estoque central pode atualizar itens
CREATE POLICY "update_itens_requisicao_estoque" ON itens_requisicao
    FOR UPDATE
    USING (
        requisicao_id IN (
            SELECT r.id 
            FROM requisicoes r
            JOIN usuarios u ON u.loja_id = r.loja_id
            WHERE u.auth_id = auth.uid()
            AND ('editar' = ANY(u.permissoes) OR 'excluir' = ANY(u.permissoes))
        )
    );

-- Política para DELETE - apenas admins podem deletar itens
CREATE POLICY "delete_itens_requisicao_admin" ON itens_requisicao
    FOR DELETE
    USING (
        requisicao_id IN (
            SELECT r.id 
            FROM requisicoes r
            JOIN usuarios u ON u.loja_id = r.loja_id
            WHERE u.auth_id = auth.uid()
            AND 'excluir' = ANY(u.permissoes)
        )
    );

-- ============= FUNÇÕES AUXILIARES PARA RLS =============

-- Função para verificar se usuário pode gerenciar requisições (estoque central)
CREATE OR REPLACE FUNCTION usuario_pode_gerenciar_requisicoes()
RETURNS BOOLEAN AS $$
DECLARE
    pode_gerenciar BOOLEAN := FALSE;
BEGIN
    SELECT 
        ('editar' = ANY(u.permissoes) OR 'excluir' = ANY(u.permissoes))
    INTO pode_gerenciar
    FROM usuarios u
    WHERE u.auth_id = auth.uid()
    AND u.ativo = TRUE;
    
    RETURN COALESCE(pode_gerenciar, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION usuario_e_admin()
RETURNS BOOLEAN AS $$
DECLARE
    e_admin BOOLEAN := FALSE;
BEGIN
    SELECT 
        ('excluir' = ANY(u.permissoes))
    INTO e_admin
    FROM usuarios u
    WHERE u.auth_id = auth.uid()
    AND u.ativo = TRUE;
    
    RETURN COALESCE(e_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants para as funções
GRANT EXECUTE ON FUNCTION usuario_pode_gerenciar_requisicoes() TO authenticated;
GRANT EXECUTE ON FUNCTION usuario_e_admin() TO authenticated;

-- Comentários para documentação
COMMENT ON POLICY "select_requisicoes_by_loja" ON requisicoes IS 'Usuários visualizam apenas requisições de sua loja';
COMMENT ON POLICY "insert_requisicoes_by_loja" ON requisicoes IS 'Usuários criam requisições apenas para sua loja';
COMMENT ON POLICY "update_requisicoes_estoque" ON requisicoes IS 'Apenas estoque central (editar/excluir) pode atualizar requisições';
COMMENT ON POLICY "delete_requisicoes_admin" ON requisicoes IS 'Apenas admins podem deletar requisições';