-- Script seguro para adicionar suporte a ingredientes compostos
-- Verifica se as colunas já existem antes de adicioná-las

-- Verificar e adicionar coluna ficha_tecnica_ref_id se não existir
DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fichas_tecnicas' 
        AND column_name = 'ficha_tecnica_ref_id'
    ) THEN
        ALTER TABLE fichas_tecnicas 
        ADD COLUMN ficha_tecnica_ref_id UUID REFERENCES pratos(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN fichas_tecnicas.ficha_tecnica_ref_id IS 
        'Referência para outro prato quando este ingrediente é uma ficha técnica composta. NULL para ingredientes simples.';
        
        RAISE NOTICE 'Coluna ficha_tecnica_ref_id adicionada à tabela fichas_tecnicas';
    ELSE
        RAISE NOTICE 'Coluna ficha_tecnica_ref_id já existe na tabela fichas_tecnicas';
    END IF;
END$$;

-- Verificar e adicionar coluna pode_ser_insumo se não existir
DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pratos' 
        AND column_name = 'pode_ser_insumo'
    ) THEN
        ALTER TABLE pratos 
        ADD COLUMN pode_ser_insumo BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN pratos.pode_ser_insumo IS 
        'Indica se este prato pode ser usado como ingrediente em outras fichas técnicas.';
        
        RAISE NOTICE 'Coluna pode_ser_insumo adicionada à tabela pratos';
    ELSE
        RAISE NOTICE 'Coluna pode_ser_insumo já existe na tabela pratos';
    END IF;
END$$;

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_ref 
ON fichas_tecnicas(ficha_tecnica_ref_id) 
WHERE ficha_tecnica_ref_id IS NOT NULL;

-- Função para verificar dependências circulares (recriar sempre para garantir que está atualizada)
CREATE OR REPLACE FUNCTION verificar_dependencia_circular(
  prato_origem UUID,
  prato_destino UUID
) RETURNS BOOLEAN AS $$
DECLARE
  tem_ciclo BOOLEAN := FALSE;
BEGIN
  -- Verificar se ambos os parâmetros são válidos
  IF prato_origem IS NULL OR prato_destino IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Se origem e destino são iguais, é dependência circular
  IF prato_origem = prato_destino THEN
    RETURN TRUE;
  END IF;
  
  -- Usar CTE recursiva para verificar se há ciclo
  WITH RECURSIVE dependencias AS (
    -- Caso base: começar com o prato destino
    SELECT prato_destino as prato_id, 1 as nivel
    
    UNION ALL
    
    -- Caso recursivo: seguir as referências
    SELECT ft.ficha_tecnica_ref_id, d.nivel + 1
    FROM dependencias d
    INNER JOIN fichas_tecnicas ft ON ft.prato_id = d.prato_id
    WHERE ft.ficha_tecnica_ref_id IS NOT NULL 
    AND d.nivel < 10 -- Limite para evitar loops infinitos
  )
  SELECT EXISTS(
    SELECT 1 FROM dependencias WHERE prato_id = prato_origem
  ) INTO tem_ciclo;
  
  RETURN tem_ciclo;
END;
$$ LANGUAGE plpgsql;

-- Trigger para prevenir dependências circulares (recriar sempre)
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

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS tg_verificar_dependencia_circular ON fichas_tecnicas;

-- Aplicar trigger
CREATE TRIGGER tg_verificar_dependencia_circular
  BEFORE INSERT OR UPDATE ON fichas_tecnicas
  FOR EACH ROW
  WHEN (NEW.ficha_tecnica_ref_id IS NOT NULL)
  EXECUTE FUNCTION trigger_verificar_dependencia_circular();

-- Verificar se tudo foi aplicado corretamente
SELECT 
  'fichas_tecnicas' as tabela,
  'ficha_tecnica_ref_id' as coluna,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'fichas_tecnicas' 
      AND column_name = 'ficha_tecnica_ref_id'
    ) THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as status
UNION ALL
SELECT 
  'pratos' as tabela,
  'pode_ser_insumo' as coluna,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'pratos' 
      AND column_name = 'pode_ser_insumo'
    ) THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as status;

-- Mensagem final
SELECT 'Ingredientes compostos configurados com sucesso!' as resultado;