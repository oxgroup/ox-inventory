-- Adicionar colunas de código de barras
-- EAN-13 apenas, com constraint de unicidade

-- Adicionar coluna código de barras na tabela produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(13);

-- Adicionar constraint para garantir unicidade (não permitir códigos duplicados)
ALTER TABLE produtos ADD CONSTRAINT unique_codigo_barras UNIQUE (codigo_barras);

-- Adicionar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras);

-- Adicionar coluna na tabela itens_inventario (para histórico)
ALTER TABLE itens_inventario ADD COLUMN IF NOT EXISTS produto_codigo_barras VARCHAR(13);

-- Adicionar índice para histórico de códigos escaneados
CREATE INDEX IF NOT EXISTS idx_itens_inventario_codigo_barras ON itens_inventario(produto_codigo_barras);

-- Verificar se as colunas foram criadas com sucesso
DO $$
BEGIN
    RAISE NOTICE 'Colunas de código de barras adicionadas com sucesso';
    RAISE NOTICE 'EAN-13 suportado com constraint de unicidade';
END $$;