-- Atualizar tabelas para suporte multi-loja

-- Adicionar tabela de lojas
CREATE TABLE IF NOT EXISTS lojas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  endereco TEXT,
  telefone VARCHAR(20),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atualizar tabela de usuários para incluir loja
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE; -- ID do Supabase Auth

-- Atualizar tabela de inventários para incluir loja
ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);

-- Atualizar tabela de produtos para incluir loja (produtos podem ser específicos por loja)
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_loja_id ON usuarios(loja_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id ON usuarios(auth_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_loja_id ON inventarios(loja_id);
CREATE INDEX IF NOT EXISTS idx_produtos_loja_id ON produtos(loja_id);

-- Trigger para atualizar updated_at na tabela lojas
CREATE TRIGGER update_lojas_updated_at BEFORE UPDATE ON lojas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir lojas de exemplo
INSERT INTO lojas (nome, codigo, endereco, telefone) VALUES
('OX Grill - Curitiba', 'CWB', 'Rua das Flores, 123 - Centro, Curitiba - PR', '(41) 1234-5678'),
('OX Grill - Balneário Camboriú', 'BC', 'Av. Atlântica, 456 - Centro, Balneário Camboriú - SC', '(47) 8765-4321')
ON CONFLICT (codigo) DO NOTHING;
