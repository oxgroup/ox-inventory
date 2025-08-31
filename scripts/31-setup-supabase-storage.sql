-- Configurar Supabase Storage para fotos das fichas técnicas

-- Criar bucket para fotos das fichas técnicas (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fichas-tecnicas-fotos',
  'fichas-tecnicas-fotos', 
  true, 
  10485760, -- 10MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- IMPORTANTE: As políticas RLS devem ser configuradas via Supabase Dashboard
-- Este script cria apenas o bucket, as políticas devem ser criadas manualmente

-- INSTRUÇÕES PARA CRIAR POLÍTICAS NO DASHBOARD:
-- 1. Acesse Storage > Policies no Supabase Dashboard
-- 2. Crie as seguintes políticas para storage.objects:

-- POLÍTICA 1: "Fotos fichas-tecnicas públicas"
-- Operation: SELECT
-- Definition: bucket_id = 'fichas-tecnicas-fotos'

-- POLÍTICA 2: "Upload fichas-tecnicas autenticados"
-- Operation: INSERT  
-- Definition: bucket_id = 'fichas-tecnicas-fotos' AND auth.role() = 'authenticated'

-- POLÍTICA 3: "Update próprios arquivos fichas-tecnicas"
-- Operation: UPDATE
-- Definition: bucket_id = 'fichas-tecnicas-fotos' AND auth.uid()::text = (storage.foldername(name))[2]

-- POLÍTICA 4: "Delete próprios arquivos fichas-tecnicas"  
-- Operation: DELETE
-- Definition: bucket_id = 'fichas-tecnicas-fotos' AND auth.uid()::text = (storage.foldername(name))[2]

-- Comentários sobre a estrutura de pastas
COMMENT ON TABLE storage.objects IS 
'Estrutura de pastas no bucket fichas-tecnicas-fotos:
- fichas-tecnicas/pratos/{usuario_id}/prato_{prato_id}_{timestamp}.{ext}
- fichas-tecnicas/etapas/{usuario_id}/{prato_id}/etapa_{numero}_{timestamp}.{ext}';

-- Função helper para extrair informações do path
CREATE OR REPLACE FUNCTION storage.get_folder_info(file_path TEXT)
RETURNS TABLE(
  pasta_tipo TEXT,
  usuario_id TEXT,
  prato_id TEXT
) AS $$
BEGIN
  -- Exemplo de path: fichas-tecnicas/pratos/uuid/arquivo.jpg
  -- ou: fichas-tecnicas/etapas/uuid/prato_uuid/arquivo.jpg
  
  RETURN QUERY
  SELECT 
    split_part(file_path, '/', 2) as pasta_tipo,  -- 'pratos' ou 'etapas'
    split_part(file_path, '/', 3) as usuario_id,  -- UUID do usuário
    CASE 
      WHEN split_part(file_path, '/', 2) = 'etapas' 
      THEN split_part(file_path, '/', 4)  -- Para etapas, prato_id está na 4ª posição
      ELSE NULL  -- Para fotos de pratos, não há prato_id específico no path
    END as prato_id;
END;
$$ LANGUAGE plpgsql;