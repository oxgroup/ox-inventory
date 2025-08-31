-- Script alternativo para configurar Supabase Storage
-- Este script deve ser executado no SQL Editor do Supabase Dashboard

-- Primeiro, criar apenas o bucket (isso geralmente funciona)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fichas-tecnicas-fotos',
  'fichas-tecnicas-fotos', 
  true, 
  10485760, -- 10MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Instruções para configurar as políticas via Dashboard:
/*
IMPORTANT: As políticas de RLS devem ser configuradas manualmente no Supabase Dashboard:

1. Acesse: Storage > Policies > storage.objects
2. Crie as seguintes políticas:

POLÍTICA 1: "Fotos fichas-tecnicas visíveis para todos"
- Operation: SELECT
- Policy definition: bucket_id = 'fichas-tecnicas-fotos'

POLÍTICA 2: "Upload fichas-tecnicas para usuários autenticados"  
- Operation: INSERT
- Policy definition: bucket_id = 'fichas-tecnicas-fotos' AND auth.role() = 'authenticated'

POLÍTICA 3: "Update próprios arquivos fichas-tecnicas"
- Operation: UPDATE  
- Policy definition: bucket_id = 'fichas-tecnicas-fotos' AND auth.uid()::text = (storage.foldername(name))[2]

POLÍTICA 4: "Delete próprios arquivos fichas-tecnicas"
- Operation: DELETE
- Policy definition: bucket_id = 'fichas-tecnicas-fotos' AND auth.uid()::text = (storage.foldername(name))[2]

Estrutura de pastas:
- fichas-tecnicas/pratos/{usuario_id}/prato_{prato_id}_{timestamp}.{ext}
- fichas-tecnicas/etapas/{usuario_id}/{prato_id}/etapa_{numero}_{timestamp}.{ext}
*/