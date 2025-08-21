-- Script 26: Adicionar coluna setor_1 à tabela produtos
-- Esta coluna define o setor principal onde o produto será usado

-- Adicionar coluna setor_1
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS setor_1 VARCHAR(50);

-- Definir valores padrão baseado nas categorias existentes
-- A maioria dos produtos será da Cozinha por padrão
UPDATE produtos SET setor_1 = 'Cozinha' WHERE setor_1 IS NULL;

-- Atualizar produtos específicos para outros setores baseado em categorias típicas
UPDATE produtos SET setor_1 = 'Bar' 
WHERE setor_1 = 'Cozinha' AND (
  categoria ILIKE '%bebida%' OR 
  categoria ILIKE '%cerveja%' OR 
  categoria ILIKE '%coquetel%' OR
  categoria ILIKE '%destilado%' OR
  categoria ILIKE '%licor%'
);

UPDATE produtos SET setor_1 = 'Vinhos' 
WHERE setor_1 = 'Cozinha' AND (
  categoria ILIKE '%vinho%' OR 
  categoria ILIKE '%espumante%' OR 
  categoria ILIKE '%champagne%'
);

-- Comentários para documentação
COMMENT ON COLUMN produtos.setor_1 IS 'Setor principal onde o produto é usado: Cozinha, Bar, ou Vinhos';

-- Criar índice para melhor performance nas consultas de filtragem
CREATE INDEX IF NOT EXISTS idx_produtos_setor_1 ON produtos(setor_1);