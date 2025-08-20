-- Script para remover produtos com cod_item duplicados
-- Mantém apenas o produto mais ANTIGO (menor created_at) para cada cod_item

-- IMPORTANTE: Faça backup antes de executar este script!

-- 1. Primeiro, vamos analisar os duplicados
SELECT 
  cod_item,
  COUNT(*) as quantidade,
  STRING_AGG(nome, ' | ' ORDER BY created_at) as nomes_produtos,
  STRING_AGG(id::text, ', ' ORDER BY created_at) as ids,
  STRING_AGG(created_at::text, ' | ' ORDER BY created_at) as datas_criacao
FROM produtos 
WHERE cod_item IS NOT NULL 
  AND cod_item != ''
GROUP BY cod_item 
HAVING COUNT(*) > 1
ORDER BY quantidade DESC, cod_item;

-- 2. Mostrar total de produtos que serão removidos
SELECT 
  COUNT(*) as produtos_que_serao_removidos
FROM produtos p1
WHERE cod_item IS NOT NULL 
  AND cod_item != ''
  AND EXISTS (
    SELECT 1 
    FROM produtos p2 
    WHERE p2.cod_item = p1.cod_item 
      AND p2.created_at < p1.created_at
  );

-- 3. Remover os duplicados (mantém apenas o mais ANTIGO por cod_item)
DELETE FROM produtos 
WHERE id IN (
  SELECT p1.id
  FROM produtos p1
  WHERE p1.cod_item IS NOT NULL 
    AND p1.cod_item != ''
    AND EXISTS (
      SELECT 1 
      FROM produtos p2 
      WHERE p2.cod_item = p1.cod_item 
        AND p2.created_at < p1.created_at
    )
);

-- 4. Verificar se ainda existem duplicados
SELECT 
  cod_item,
  COUNT(*) as quantidade
FROM produtos 
WHERE cod_item IS NOT NULL 
  AND cod_item != ''
GROUP BY cod_item 
HAVING COUNT(*) > 1;

-- 5. Adicionar constraint única para evitar futuros duplicados (opcional)
-- ALTER TABLE produtos ADD CONSTRAINT unique_cod_item UNIQUE (cod_item);

-- 6. Estatísticas finais
SELECT 
  COUNT(*) as total_produtos_restantes,
  COUNT(DISTINCT cod_item) as total_cod_items_unicos
FROM produtos 
WHERE cod_item IS NOT NULL 
  AND cod_item != '';