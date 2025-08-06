-- Criação das tabelas para o sistema OX Inventory

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  permissoes TEXT[] DEFAULT ARRAY['visualizar'],
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  unidade VARCHAR(50) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de inventários
CREATE TABLE IF NOT EXISTS inventarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setor VARCHAR(100) NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'rascunho'
    CHECK (
      status IN (
        'rascunho',      -- inventário ainda não iniciado
        'em_contagem',   -- contagem em andamento
        'finalizado',    -- contagem encerrada; aguardando conciliação
        'conciliado'     -- inventário fechado/conciliado
      )
    ),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_nome VARCHAR(255),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens do inventário
CREATE TABLE IF NOT EXISTS itens_inventario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventario_id UUID REFERENCES inventarios(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  produto_nome VARCHAR(255) NOT NULL,
  produto_unidade VARCHAR(50) NOT NULL,
  quantidade_fechada DECIMAL(10,3) NOT NULL DEFAULT 0,
  quantidade_em_uso DECIMAL(10,3) NOT NULL DEFAULT 0,
  data_contagem TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_inventarios_setor ON inventarios(setor);
CREATE INDEX IF NOT EXISTS idx_inventarios_data_criacao ON inventarios(data_criacao);
CREATE INDEX IF NOT EXISTS idx_inventarios_status ON inventarios(status);
CREATE INDEX IF NOT EXISTS idx_inventarios_usuario_id ON inventarios(usuario_id);

CREATE INDEX IF NOT EXISTS idx_itens_inventario_inventario_id ON itens_inventario(inventario_id);
CREATE INDEX IF NOT EXISTS idx_itens_inventario_produto_id ON itens_inventario(produto_id);
CREATE INDEX IF NOT EXISTS idx_itens_inventario_data_contagem ON itens_inventario(data_contagem);

CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventarios_updated_at BEFORE UPDATE ON inventarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itens_inventario_updated_at BEFORE UPDATE ON itens_inventario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
