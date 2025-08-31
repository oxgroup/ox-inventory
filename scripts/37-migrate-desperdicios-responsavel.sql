-- Script de migração para alterar responsavel_id para responsavel_nome
-- Versão: 1.1 
-- Data: 2024-01-XX

-- 1. Primeiro, dropar as views que dependem da coluna
DROP VIEW IF EXISTS vw_desperdicios_completo CASCADE;
DROP VIEW IF EXISTS vw_desperdicios_por_setor CASCADE;

-- 2. Remover índice da coluna antiga se existir
DROP INDEX IF EXISTS idx_desperdicios_responsavel;

-- 3. Adicionar a nova coluna primeiro
ALTER TABLE desperdicios 
ADD COLUMN IF NOT EXISTS responsavel_nome VARCHAR(100);

-- 4. Migrar dados existentes (se houver)
-- Tentar buscar o nome do usuário baseado no ID, ou usar um valor padrão
UPDATE desperdicios 
SET responsavel_nome = COALESCE(
    (SELECT nome FROM usuarios WHERE id = desperdicios.responsavel_id LIMIT 1),
    'Usuário não encontrado'
)
WHERE responsavel_nome IS NULL;

-- 5. Tornar a nova coluna NOT NULL após migrar dados
ALTER TABLE desperdicios 
ALTER COLUMN responsavel_nome SET NOT NULL;

-- 6. Agora dropar a coluna antiga
ALTER TABLE desperdicios 
DROP COLUMN IF EXISTS responsavel_id;

-- 7. Recriar o índice para a nova coluna
CREATE INDEX IF NOT EXISTS idx_desperdicios_responsavel ON desperdicios(responsavel_nome);

-- 8. Recriar as views com a nova estrutura
CREATE OR REPLACE VIEW vw_desperdicios_completo AS
SELECT 
    d.id,
    d.loja_id,
    d.data_desperdicio,
    d.setor,
    d.responsavel_nome,
    d.comentario,
    d.valor_total,
    d.fotos,
    d.status,
    d.created_at,
    d.updated_at,
    l.nome as loja_nome,
    l.codigo as loja_codigo,
    criador.nome as criado_por_nome,
    COUNT(di.id) as total_itens,
    COALESCE(SUM(di.quantidade), 0) as quantidade_total_itens
FROM desperdicios d
LEFT JOIN lojas l ON d.loja_id = l.id
LEFT JOIN usuarios criador ON d.created_by = criador.id
LEFT JOIN desperdicios_itens di ON d.id = di.desperdicio_id
GROUP BY d.id, l.nome, l.codigo, criador.nome;

-- 9. Recriar view de relatórios por setor
CREATE OR REPLACE VIEW vw_desperdicios_por_setor AS
SELECT 
    d.loja_id,
    d.setor,
    DATE_TRUNC('month', d.data_desperdicio) as mes,
    COUNT(d.id) as total_desperdicios,
    COALESCE(SUM(d.valor_total), 0) as valor_total_desperdicios,
    COALESCE(SUM(di.quantidade), 0) as quantidade_total_desperdicios
FROM desperdicios d
LEFT JOIN desperdicios_itens di ON d.id = di.desperdicio_id
WHERE d.status = 'ativo'
GROUP BY d.loja_id, d.setor, DATE_TRUNC('month', d.data_desperdicio);

-- 10. Verificar se a migração funcionou
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'desperdicios' 
        AND column_name = 'responsavel_nome'
    ) THEN
        RAISE NOTICE 'Migração concluída com sucesso! Coluna responsavel_nome criada.';
    ELSE
        RAISE EXCEPTION 'Erro na migração: Coluna responsavel_nome não foi criada.';
    END IF;
END $$;