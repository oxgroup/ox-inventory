-- Corrigir estrutura das tabelas para multi-loja

-- Primeiro, verificar se as colunas existem antes de adicionar
DO $$ 
BEGIN
    -- Adicionar coluna loja_id na tabela usuarios se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'loja_id') THEN
        ALTER TABLE usuarios ADD COLUMN loja_id UUID REFERENCES lojas(id);
    END IF;
    
    -- Adicionar coluna auth_id na tabela usuarios se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'auth_id') THEN
        ALTER TABLE usuarios ADD COLUMN auth_id UUID UNIQUE;
    END IF;
    
    -- Adicionar coluna loja_id na tabela inventarios se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventarios' AND column_name = 'loja_id') THEN
        ALTER TABLE inventarios ADD COLUMN loja_id UUID REFERENCES lojas(id);
    END IF;
    
    -- Adicionar coluna loja_id na tabela produtos se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produtos' AND column_name = 'loja_id') THEN
        ALTER TABLE produtos ADD COLUMN loja_id UUID REFERENCES lojas(id);
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_usuarios_loja_id ON usuarios(loja_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id ON usuarios(auth_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_loja_id ON inventarios(loja_id);
CREATE INDEX IF NOT EXISTS idx_produtos_loja_id ON produtos(loja_id);

-- Inserir lojas se não existirem
INSERT INTO lojas (nome, codigo, endereco, telefone) VALUES
('OX Grill - Curitiba', 'CWB', 'Rua das Flores, 123 - Centro, Curitiba - PR', '(41) 1234-5678'),
('OX Grill - Balneário Camboriú', 'BC', 'Av. Atlântica, 456 - Centro, Balneário Camboriú - SC', '(47) 8765-4321')
ON CONFLICT (codigo) DO NOTHING;
