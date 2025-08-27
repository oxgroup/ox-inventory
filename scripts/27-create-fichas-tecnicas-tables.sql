-- Módulo de Fichas Técnicas
-- Script de criação das tabelas de fichas técnicas

-- Tabela principal de fichas técnicas
CREATE TABLE IF NOT EXISTS fichas_tecnicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    loja_id UUID NOT NULL REFERENCES lojas(id),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens das fichas técnicas
CREATE TABLE IF NOT EXISTS itens_ficha_tecnica (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ficha_tecnica_id UUID NOT NULL REFERENCES fichas_tecnicas(id) ON DELETE CASCADE,
    insumo VARCHAR(255) NOT NULL,
    produto_id UUID REFERENCES produtos(id),
    qtd DECIMAL(10,3) NOT NULL DEFAULT 0,
    quebra DECIMAL(10,3) DEFAULT 0,
    unidade VARCHAR(50) NOT NULL,
    codigo_empresa VARCHAR(100),
    qtd_receita DECIMAL(10,3) DEFAULT 0,
    fator_correcao DECIMAL(10,3) DEFAULT 1,
    obs_item_ft TEXT,
    id_grupo VARCHAR(100),
    seq INTEGER DEFAULT 1,
    qtd_lote DECIMAL(10,3) DEFAULT 0,
    id_cliente_queops VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_fichas_tecnicas()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de updated_at
CREATE TRIGGER update_fichas_tecnicas_updated_at
    BEFORE UPDATE ON fichas_tecnicas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_fichas_tecnicas();

CREATE TRIGGER update_itens_ficha_tecnica_updated_at
    BEFORE UPDATE ON itens_ficha_tecnica
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_fichas_tecnicas();

-- Função para calcular quantidade total considerando quebra e fator de correção
CREATE OR REPLACE FUNCTION calcular_qtd_total_item_ft(
    qtd_base DECIMAL(10,3),
    quebra_percent DECIMAL(10,3),
    fator_correcao DECIMAL(10,3)
)
RETURNS DECIMAL(10,3) AS $$
BEGIN
    -- Aplicar quebra e fator de correção
    -- Fórmula: (qtd_base * (1 + quebra/100)) * fator_correcao
    RETURN (qtd_base * (1 + COALESCE(quebra_percent, 0) / 100)) * COALESCE(fator_correcao, 1);
END;
$$ LANGUAGE plpgsql;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_loja_id ON fichas_tecnicas(loja_id);
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_usuario_id ON fichas_tecnicas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_ativo ON fichas_tecnicas(ativo);
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_item ON fichas_tecnicas(item);
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_created_at ON fichas_tecnicas(created_at);

CREATE INDEX IF NOT EXISTS idx_itens_ficha_tecnica_ficha_id ON itens_ficha_tecnica(ficha_tecnica_id);
CREATE INDEX IF NOT EXISTS idx_itens_ficha_tecnica_produto_id ON itens_ficha_tecnica(produto_id);
CREATE INDEX IF NOT EXISTS idx_itens_ficha_tecnica_insumo ON itens_ficha_tecnica(insumo);
CREATE INDEX IF NOT EXISTS idx_itens_ficha_tecnica_id_grupo ON itens_ficha_tecnica(id_grupo);
CREATE INDEX IF NOT EXISTS idx_itens_ficha_tecnica_seq ON itens_ficha_tecnica(seq);
CREATE INDEX IF NOT EXISTS idx_itens_ficha_tecnica_codigo_empresa ON itens_ficha_tecnica(codigo_empresa);

-- RLS (Row Level Security) para multi-loja
ALTER TABLE fichas_tecnicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_ficha_tecnica ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fichas_tecnicas
CREATE POLICY "Users can view fichas_tecnicas from their store" ON fichas_tecnicas
    FOR SELECT USING (
        loja_id IN (
            SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert fichas_tecnicas in their store" ON fichas_tecnicas
    FOR INSERT WITH CHECK (
        loja_id IN (
            SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can update fichas_tecnicas in their store" ON fichas_tecnicas
    FOR UPDATE USING (
        loja_id IN (
            SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete fichas_tecnicas in their store" ON fichas_tecnicas
    FOR DELETE USING (
        loja_id IN (
            SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
        )
    );

-- Políticas RLS para itens_ficha_tecnica
CREATE POLICY "Users can view itens_ficha_tecnica from their store" ON itens_ficha_tecnica
    FOR SELECT USING (
        ficha_tecnica_id IN (
            SELECT id FROM fichas_tecnicas WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert itens_ficha_tecnica in their store" ON itens_ficha_tecnica
    FOR INSERT WITH CHECK (
        ficha_tecnica_id IN (
            SELECT id FROM fichas_tecnicas WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update itens_ficha_tecnica in their store" ON itens_ficha_tecnica
    FOR UPDATE USING (
        ficha_tecnica_id IN (
            SELECT id FROM fichas_tecnicas WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete itens_ficha_tecnica in their store" ON itens_ficha_tecnica
    FOR DELETE USING (
        ficha_tecnica_id IN (
            SELECT id FROM fichas_tecnicas WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
            )
        )
    );

-- Comentários para documentação
COMMENT ON TABLE fichas_tecnicas IS 'Tabela principal de fichas técnicas de produção';
COMMENT ON TABLE itens_ficha_tecnica IS 'Itens/insumos de cada ficha técnica com detalhes de quantidade e cálculos';
COMMENT ON COLUMN fichas_tecnicas.item IS 'Nome/título da ficha técnica';
COMMENT ON COLUMN itens_ficha_tecnica.insumo IS 'Nome do insumo/ingrediente';
COMMENT ON COLUMN itens_ficha_tecnica.qtd IS 'Quantidade base do insumo';
COMMENT ON COLUMN itens_ficha_tecnica.quebra IS 'Percentual de quebra/perda';
COMMENT ON COLUMN itens_ficha_tecnica.fator_correcao IS 'Fator de correção para cálculos';
COMMENT ON COLUMN itens_ficha_tecnica.seq IS 'Sequência/ordem do item na ficha';
COMMENT ON COLUMN itens_ficha_tecnica.id_grupo IS 'Agrupamento de itens (ex: proteínas, vegetais)';