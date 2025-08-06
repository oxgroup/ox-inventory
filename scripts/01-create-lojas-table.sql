-- Criar tabela de lojas primeiro
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

-- Trigger para atualizar updated_at na tabela lojas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lojas_updated_at BEFORE UPDATE ON lojas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir as duas lojas
INSERT INTO lojas (nome, codigo, endereco, telefone) VALUES
('OX Grill - Curitiba', 'CWB', 'Rua das Flores, 123 - Centro, Curitiba - PR', '(41) 1234-5678'),
('OX Grill - Balneário Camboriú', 'BC', 'Av. Atlântica, 456 - Centro, Balneário Camboriú - SC', '(47) 8765-4321')
ON CONFLICT (codigo) DO NOTHING;
