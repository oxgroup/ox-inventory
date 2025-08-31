-- Script simplificado para criar módulo de desperdícios
-- Versão: 1.0 (Simplificada)
-- Data: 2024-01-XX

-- Criar tabela principal de desperdícios
CREATE TABLE IF NOT EXISTS desperdicios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loja_id UUID NOT NULL,
    data_desperdicio DATE NOT NULL,
    setor VARCHAR(100) NOT NULL,
    responsavel_nome VARCHAR(100) NOT NULL,
    comentario TEXT,
    valor_total DECIMAL(10,2) DEFAULT 0,
    fotos JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- Criar tabela de itens do desperdício
CREATE TABLE IF NOT EXISTS desperdicios_itens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    desperdicio_id UUID NOT NULL,
    produto_id UUID NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL,
    unidade VARCHAR(20) NOT NULL,
    valor_unitario DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_desperdicios_loja_data ON desperdicios(loja_id, data_desperdicio);
CREATE INDEX IF NOT EXISTS idx_desperdicios_setor ON desperdicios(setor);
CREATE INDEX IF NOT EXISTS idx_desperdicios_responsavel ON desperdicios(responsavel_nome);
CREATE INDEX IF NOT EXISTS idx_desperdicios_status ON desperdicios(status);
CREATE INDEX IF NOT EXISTS idx_desperdicios_itens_desperdicio ON desperdicios_itens(desperdicio_id);
CREATE INDEX IF NOT EXISTS idx_desperdicios_itens_produto ON desperdicios_itens(produto_id);

-- Comentários nas tabelas
COMMENT ON TABLE desperdicios IS 'Registros de desperdícios por loja e setor';
COMMENT ON TABLE desperdicios_itens IS 'Itens específicos de cada desperdício';
COMMENT ON COLUMN desperdicios.setor IS 'Setor onde ocorreu o desperdício';
COMMENT ON COLUMN desperdicios.fotos IS 'Array JSON com URLs das fotos do desperdício';
COMMENT ON COLUMN desperdicios.valor_total IS 'Valor total dos itens desperdiçados';

-- Inserir alguns dados de exemplo (opcional)
-- INSERT INTO desperdicios (loja_id, data_desperdicio, setor, responsavel_id, comentario, valor_total)
-- VALUES ('loja-uuid-exemplo', '2024-01-15', 'Cozinha', 'usuario-uuid-exemplo', 'Produto vencido', 25.50)
-- ON CONFLICT DO NOTHING;