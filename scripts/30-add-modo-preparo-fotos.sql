-- Adicionar modo de preparo e fotos na tabela pratos

-- Adicionar coluna modo_preparo na tabela pratos
ALTER TABLE pratos 
ADD COLUMN IF NOT EXISTS modo_preparo TEXT;

-- Adicionar colunas para fotos (URLs das imagens)
ALTER TABLE pratos 
ADD COLUMN IF NOT EXISTS foto_prato_final TEXT, -- Foto do prato finalizado
ADD COLUMN IF NOT EXISTS fotos_preparo JSONB DEFAULT '[]'; -- Array de fotos do processo

-- Comentários para documentação
COMMENT ON COLUMN pratos.modo_preparo IS 'Instruções detalhadas de como preparar o prato';
COMMENT ON COLUMN pratos.foto_prato_final IS 'URL da foto principal do prato finalizado';
COMMENT ON COLUMN pratos.fotos_preparo IS 'Array JSON com URLs das fotos do processo de preparo, formato: [{"etapa": "Texto da etapa", "foto_url": "URL", "ordem": 1}]';

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pratos_fotos_preparo ON pratos USING GIN (fotos_preparo);

-- Exemplo de estrutura do JSONB fotos_preparo:
-- [
--   {
--     "ordem": 1,
--     "etapa": "Preparar os ingredientes", 
--     "foto_url": "https://storage.url/foto1.jpg",
--     "descricao": "Cortar a carne em cubos de 2cm"
--   },
--   {
--     "ordem": 2,
--     "etapa": "Temperar a carne",
--     "foto_url": "https://storage.url/foto2.jpg", 
--     "descricao": "Adicionar sal, pimenta e alho"
--   }
-- ]