-- Adicionar coluna produto_cod_item na tabela itens_inventario para armazenar o código do item

-- Adicionar a coluna produto_cod_item
ALTER TABLE itens_inventario ADD COLUMN IF NOT EXISTS produto_cod_item VARCHAR(50);

-- Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_itens_inventario_produto_cod_item ON itens_inventario(produto_cod_item);

-- Atualizar registros existentes com os códigos dos produtos
UPDATE itens_inventario 
SET produto_cod_item = p.cod_item
FROM produtos p
WHERE itens_inventario.produto_id = p.id
AND itens_inventario.produto_cod_item IS NULL;

-- Verificar se a coluna foi adicionada corretamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'itens_inventario' AND column_name = 'produto_cod_item';

-- Verificar alguns itens com códigos
SELECT 
  ii.id, 
  ii.produto_nome, 
  ii.produto_cod_item,
  p.cod_item as produto_original_cod_item
FROM itens_inventario ii
LEFT JOIN produtos p ON ii.produto_id = p.id
LIMIT 10;
