-- Script para adicionar setorização às fichas técnicas
-- Adiciona suporte para múltiplos setores por ficha técnica

-- Adicionar coluna de setores na tabela pratos
DO $$
BEGIN
    -- Verificar se a coluna setores já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pratos' 
        AND column_name = 'setores'
    ) THEN
        ALTER TABLE pratos 
        ADD COLUMN setores JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN pratos.setores IS 
        'Array JSON com os setores onde esta ficha técnica é utilizada. Ex: ["Cozinha", "Bar"]';
        
        RAISE NOTICE 'Coluna setores adicionada à tabela pratos';
    ELSE
        RAISE NOTICE 'Coluna setores já existe na tabela pratos';
    END IF;
END$$;

-- Criar índice para busca eficiente por setores
CREATE INDEX IF NOT EXISTS idx_pratos_setores 
ON pratos USING GIN (setores);

-- Função para adicionar setor a um prato
CREATE OR REPLACE FUNCTION adicionar_setor_prato(
    prato_id_param UUID,
    setor_nome TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    setores_atuais JSONB;
BEGIN
    -- Verificar se o prato existe
    IF NOT EXISTS (SELECT 1 FROM pratos WHERE id = prato_id_param) THEN
        RETURN FALSE;
    END IF;
    
    -- Buscar setores atuais
    SELECT setores INTO setores_atuais 
    FROM pratos 
    WHERE id = prato_id_param;
    
    -- Se setores for NULL, inicializar como array vazio
    IF setores_atuais IS NULL THEN
        setores_atuais := '[]'::jsonb;
    END IF;
    
    -- Verificar se o setor já existe
    IF setores_atuais ? setor_nome THEN
        RETURN TRUE; -- Setor já existe
    END IF;
    
    -- Adicionar o novo setor
    UPDATE pratos 
    SET setores = setores_atuais || jsonb_build_array(setor_nome)
    WHERE id = prato_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para remover setor de um prato
CREATE OR REPLACE FUNCTION remover_setor_prato(
    prato_id_param UUID,
    setor_nome TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    setores_atuais JSONB;
    setores_novos JSONB;
BEGIN
    -- Verificar se o prato existe
    IF NOT EXISTS (SELECT 1 FROM pratos WHERE id = prato_id_param) THEN
        RETURN FALSE;
    END IF;
    
    -- Buscar setores atuais
    SELECT setores INTO setores_atuais 
    FROM pratos 
    WHERE id = prato_id_param;
    
    -- Se não há setores, nada para remover
    IF setores_atuais IS NULL OR jsonb_array_length(setores_atuais) = 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Remover o setor
    SELECT jsonb_agg(elem)
    INTO setores_novos
    FROM jsonb_array_elements_text(setores_atuais) elem
    WHERE elem != setor_nome;
    
    -- Se resultado for NULL, usar array vazio
    IF setores_novos IS NULL THEN
        setores_novos := '[]'::jsonb;
    END IF;
    
    -- Atualizar na tabela
    UPDATE pratos 
    SET setores = setores_novos
    WHERE id = prato_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar pratos por setor
CREATE OR REPLACE FUNCTION buscar_pratos_por_setor(
    setor_nome TEXT,
    loja_id_param UUID DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    nome TEXT,
    categoria TEXT,
    setores JSONB,
    total_setores INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nome::TEXT,
        p.categoria::TEXT,
        p.setores,
        jsonb_array_length(COALESCE(p.setores, '[]'::jsonb))::INTEGER as total_setores
    FROM pratos p
    WHERE p.ativo = true
    AND (loja_id_param IS NULL OR p.loja_id = loja_id_param)
    AND (p.setores ? setor_nome OR jsonb_array_length(COALESCE(p.setores, '[]'::jsonb)) = 0)
    ORDER BY p.nome;
END;
$$ LANGUAGE plpgsql;

-- Migração: Popular setores baseado na categoria dos pratos existentes
DO $$
DECLARE
    prato_record RECORD;
    setores_sugeridos JSONB;
BEGIN
    FOR prato_record IN 
        SELECT id, categoria 
        FROM pratos 
        WHERE setores IS NULL OR jsonb_array_length(setores) = 0
    LOOP
        -- Sugerir setores baseado na categoria
        CASE 
            WHEN prato_record.categoria ILIKE '%drink%' OR 
                 prato_record.categoria ILIKE '%bebida%' OR
                 prato_record.categoria ILIKE '%coquetel%' THEN
                setores_sugeridos := '["Bar"]'::jsonb;
                
            WHEN prato_record.categoria ILIKE '%sobremesa%' OR
                 prato_record.categoria ILIKE '%doce%' THEN
                setores_sugeridos := '["Garde/Sobremesa"]'::jsonb;
                
            WHEN prato_record.categoria ILIKE '%entrada%' OR
                 prato_record.categoria ILIKE '%appetizer%' THEN
                setores_sugeridos := '["Prep"]'::jsonb;
                
            WHEN prato_record.categoria ILIKE '%principal%' OR
                 prato_record.categoria ILIKE '%carne%' OR
                 prato_record.categoria ILIKE '%peixe%' THEN
                setores_sugeridos := '["Fogão", "Parrilla"]'::jsonb;
                
            ELSE
                -- Por padrão, adicionar aos setores principais da cozinha
                setores_sugeridos := '["Prep", "Fogão"]'::jsonb;
        END CASE;
        
        -- Atualizar o prato
        UPDATE pratos 
        SET setores = setores_sugeridos
        WHERE id = prato_record.id;
    END LOOP;
    
    RAISE NOTICE 'Setores populados automaticamente para pratos existentes';
END$$;

-- Criar view para estatísticas de setores
CREATE OR REPLACE VIEW vw_fichas_tecnicas_setores AS
SELECT 
    setor_nome,
    COUNT(*) as total_fichas,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as fichas_mes_atual
FROM (
    SELECT 
        p.id,
        p.nome,
        p.created_at,
        jsonb_array_elements_text(COALESCE(p.setores, '[]'::jsonb)) as setor_nome
    FROM pratos p 
    WHERE p.ativo = true
) AS pratos_setores
GROUP BY setor_nome
ORDER BY total_fichas DESC;

-- RLS (Row Level Security) - Permitir acesso baseado na loja
ALTER TABLE pratos ENABLE ROW LEVEL SECURITY;

-- Política para leitura (usuários podem ver fichas da própria loja)
DROP POLICY IF EXISTS "Usuários podem ver pratos da própria loja" ON pratos;
CREATE POLICY "Usuários podem ver pratos da própria loja" ON pratos
    FOR SELECT USING (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    );

-- Política para inserção (usuários podem criar fichas na própria loja)
DROP POLICY IF EXISTS "Usuários podem criar pratos na própria loja" ON pratos;
CREATE POLICY "Usuários podem criar pratos na própria loja" ON pratos
    FOR INSERT WITH CHECK (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    );

-- Política para atualização (usuários podem editar fichas da própria loja)
DROP POLICY IF EXISTS "Usuários podem editar pratos da própria loja" ON pratos;
CREATE POLICY "Usuários podem editar pratos da própria loja" ON pratos
    FOR UPDATE USING (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    );

-- Verificar se tudo foi aplicado corretamente
SELECT 
  'pratos' as tabela,
  'setores' as coluna,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'pratos' 
      AND column_name = 'setores'
    ) THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as status
UNION ALL
SELECT 
  'Função' as tabela,
  'adicionar_setor_prato' as coluna,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'adicionar_setor_prato'
    ) THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as status
UNION ALL
SELECT 
  'View' as tabela,
  'vw_fichas_tecnicas_setores' as coluna,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_name = 'vw_fichas_tecnicas_setores'
    ) THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as status;

-- Mensagem final
SELECT 'Setorização de fichas técnicas implementada com sucesso!' as resultado;