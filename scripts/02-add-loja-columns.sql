-- Adicionar colunas de loja nas tabelas existentes

-- Adicionar coluna loja_id na tabela usuarios
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'loja_id') THEN
        ALTER TABLE usuarios ADD COLUMN loja_id UUID REFERENCES lojas(id);
    END IF;
END $$;

-- Adicionar coluna auth_id na tabela usuarios
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'auth_id') THEN
        ALTER TABLE usuarios ADD COLUMN auth_id UUID UNIQUE;
    END IF;
END $$;

-- Adicionar coluna loja_id na tabela inventarios
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventarios' AND column_name = 'loja_id') THEN
        ALTER TABLE inventarios ADD COLUMN loja_id UUID REFERENCES lojas(id);
    END IF;
END $$;

-- Adicionar coluna loja_id na tabela produtos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produtos' AND column_name = 'loja_id') THEN
        ALTER TABLE produtos ADD COLUMN loja_id UUID REFERENCES lojas(id);
    END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_usuarios_loja_id ON usuarios(loja_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id ON usuarios(auth_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_loja_id ON inventarios(loja_id);
CREATE INDEX IF NOT EXISTS idx_produtos_loja_id ON produtos(loja_id);
