-- Script para adicionar suporte a ingredientes compostos
-- Permite que fichas técnicas sejam usadas como ingredientes de outras fichas

-- Adicionar coluna para referenciar outras fichas técnicas como ingredientes
ALTER TABLE fichas_tecnicas 
ADD COLUMN IF NOT EXISTS ficha_tecnica_ref_id UUID REFERENCES pratos(id) ON DELETE SET NULL;

-- Adicionar coluna para indicar se um prato pode ser usado como insumo
ALTER TABLE pratos 
ADD COLUMN IF NOT EXISTS pode_ser_insumo BOOLEAN DEFAULT false;

-- Adicionar comentário para campo de referência
COMMENT ON COLUMN fichas_tecnicas.ficha_tecnica_ref_id IS 
'Referência para outro prato quando este ingrediente é uma ficha técnica composta. NULL para ingredientes simples.';

COMMENT ON COLUMN pratos.pode_ser_insumo IS 
'Indica se este prato pode ser usado como ingrediente em outras fichas técnicas.';

-- Criar índice para melhor performance em consultas de ingredientes compostos
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_ref 
ON fichas_tecnicas(ficha_tecnica_ref_id) 
WHERE ficha_tecnica_ref_id IS NOT NULL;

-- Criar view para calcular custos de ingredientes compostos recursivamente
CREATE OR REPLACE VIEW v_custo_ingredientes_compostos AS
WITH RECURSIVE custo_ingredientes AS (
  -- Caso base: ingredientes simples (sem referência para ficha técnica)
  SELECT 
    ft.id,
    ft.prato_id,
    ft.insumo,
    ft.qtd,
    ft.unidade,
    ft.ficha_tecnica_ref_id,
    CASE 
      WHEN ft.ficha_tecnica_ref_id IS NULL THEN 0.0 -- Custo de produtos básicos seria calculado via produtos
      ELSE 0.0 
    END as custo_unitario,
    ft.qtd * CASE 
      WHEN ft.ficha_tecnica_ref_id IS NULL THEN 0.0
      ELSE 0.0 
    END as custo_total,
    1 as nivel
  FROM fichas_tecnicas ft
  WHERE ft.ficha_tecnica_ref_id IS NULL
  
  UNION ALL
  
  -- Caso recursivo: ingredientes compostos (com referência para ficha técnica)
  SELECT 
    ft.id,
    ft.prato_id,
    ft.insumo,
    ft.qtd,
    ft.unidade,
    ft.ficha_tecnica_ref_id,
    -- Para ingredientes compostos, o custo seria a soma dos ingredientes da ficha referenciada
    0.0 as custo_unitario,
    ft.qtd * 0.0 as custo_total,
    ci.nivel + 1 as nivel
  FROM fichas_tecnicas ft
  INNER JOIN custo_ingredientes ci ON ft.ficha_tecnica_ref_id = ci.prato_id
  WHERE ft.ficha_tecnica_ref_id IS NOT NULL
  AND ci.nivel < 10 -- Limite para evitar recursão infinita
)
SELECT * FROM custo_ingredientes;

-- Função para verificar dependências circulares
CREATE OR REPLACE FUNCTION verificar_dependencia_circular(
  prato_origem UUID,
  prato_destino UUID
) RETURNS BOOLEAN AS $$
DECLARE
  tem_ciclo BOOLEAN := FALSE;
BEGIN
  -- Usar CTE recursiva para verificar se há ciclo
  WITH RECURSIVE dependencias AS (
    SELECT prato_destino as prato_id, 1 as nivel
    
    UNION ALL
    
    SELECT ft.ficha_tecnica_ref_id, d.nivel + 1
    FROM dependencias d
    INNER JOIN fichas_tecnicas ft ON ft.prato_id = d.prato_id
    WHERE ft.ficha_tecnica_ref_id IS NOT NULL 
    AND d.nivel < 10
    AND ft.ficha_tecnica_ref_id != prato_origem -- Verificar se chegamos de volta ao início
  )
  SELECT EXISTS(
    SELECT 1 FROM dependencias WHERE prato_id = prato_origem
  ) INTO tem_ciclo;
  
  RETURN tem_ciclo;
END;
$$ LANGUAGE plpgsql;

-- Trigger para prevenir dependências circulares
CREATE OR REPLACE FUNCTION trigger_verificar_dependencia_circular()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ficha_tecnica_ref_id IS NOT NULL THEN
    IF verificar_dependencia_circular(NEW.prato_id, NEW.ficha_tecnica_ref_id) THEN
      RAISE EXCEPTION 'Dependência circular detectada: o prato % não pode usar o prato % como ingrediente pois criaria um ciclo.', 
        NEW.prato_id, NEW.ficha_tecnica_ref_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS tg_verificar_dependencia_circular ON fichas_tecnicas;
CREATE TRIGGER tg_verificar_dependencia_circular
  BEFORE INSERT OR UPDATE ON fichas_tecnicas
  FOR EACH ROW
  WHEN (NEW.ficha_tecnica_ref_id IS NOT NULL)
  EXECUTE FUNCTION trigger_verificar_dependencia_circular();

-- Dados de exemplo: marcar alguns pratos como insumos
-- UPDATE pratos SET pode_ser_insumo = true WHERE nome IN ('Molho de Tomate', 'Massa de Pizza', 'Tempero da Casa');