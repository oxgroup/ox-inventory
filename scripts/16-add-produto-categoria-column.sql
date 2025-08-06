-- Adiciona a coluna produto_categoria na tabela itens_inventario
-- (necessária para evitar o erro de schema cache)

ALTER TABLE itens_inventario
  ADD COLUMN IF NOT EXISTS produto_categoria VARCHAR(100);

-- Índice para buscas por categoria dentro do inventário
CREATE INDEX IF NOT EXISTS idx_itens_inventario_produto_categoria
  ON itens_inventario (produto_categoria);

-- Preenche a nova coluna usando a categoria do produto original
UPDATE itens_inventario ii
SET    produto_categoria = p.categoria
FROM   produtos p
WHERE  ii.produto_id = p.id
  AND  ii.produto_categoria IS NULL;
