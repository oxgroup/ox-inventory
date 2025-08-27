-- Correção da estrutura do módulo de fichas técnicas
-- Remover estrutura anterior e criar nova estrutura correta

-- Remover tabelas anteriores (se existirem)
DROP TABLE IF EXISTS itens_ficha_tecnica CASCADE;
DROP TABLE IF EXISTS fichas_tecnicas CASCADE;

-- Criar tabela de pratos (produtos que possuem fichas técnicas)
CREATE TABLE IF NOT EXISTS pratos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    loja_id UUID NOT NULL REFERENCES lojas(id),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela principal de fichas técnicas (cada linha é um ingrediente)
CREATE TABLE IF NOT EXISTS fichas_tecnicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prato_id UUID NOT NULL REFERENCES pratos(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL, -- Nome do prato/produto final
    insumo VARCHAR(255) NOT NULL, -- Nome do ingrediente
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
    -- Campos adicionais úteis
    produto_id UUID REFERENCES produtos(id), -- Vinculação opcional com catálogo de produtos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_pratos_fichas()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de updated_at
CREATE TRIGGER update_pratos_updated_at
    BEFORE UPDATE ON pratos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_pratos_fichas();

CREATE TRIGGER update_fichas_tecnicas_updated_at
    BEFORE UPDATE ON fichas_tecnicas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_pratos_fichas();

-- Função para calcular quantidade total considerando quebra e fator de correção
CREATE OR REPLACE FUNCTION calcular_qtd_total_ficha(
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
CREATE INDEX IF NOT EXISTS idx_pratos_loja_id ON pratos(loja_id);
CREATE INDEX IF NOT EXISTS idx_pratos_usuario_id ON pratos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pratos_ativo ON pratos(ativo);
CREATE INDEX IF NOT EXISTS idx_pratos_nome ON pratos(nome);
CREATE INDEX IF NOT EXISTS idx_pratos_categoria ON pratos(categoria);

CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_prato_id ON fichas_tecnicas(prato_id);
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_item ON fichas_tecnicas(item);
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_insumo ON fichas_tecnicas(insumo);
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_id_grupo ON fichas_tecnicas(id_grupo);
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_seq ON fichas_tecnicas(seq);
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_codigo_empresa ON fichas_tecnicas(codigo_empresa);
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_produto_id ON fichas_tecnicas(produto_id);

-- RLS (Row Level Security) para multi-loja
ALTER TABLE pratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_tecnicas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pratos
CREATE POLICY "Users can view pratos from their store" ON pratos
    FOR SELECT USING (
        loja_id IN (
            SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert pratos in their store" ON pratos
    FOR INSERT WITH CHECK (
        loja_id IN (
            SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can update pratos in their store" ON pratos
    FOR UPDATE USING (
        loja_id IN (
            SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete pratos in their store" ON pratos
    FOR DELETE USING (
        loja_id IN (
            SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
        )
    );

-- Políticas RLS para fichas_tecnicas
CREATE POLICY "Users can view fichas_tecnicas from their store" ON fichas_tecnicas
    FOR SELECT USING (
        prato_id IN (
            SELECT id FROM pratos WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert fichas_tecnicas in their store" ON fichas_tecnicas
    FOR INSERT WITH CHECK (
        prato_id IN (
            SELECT id FROM pratos WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update fichas_tecnicas in their store" ON fichas_tecnicas
    FOR UPDATE USING (
        prato_id IN (
            SELECT id FROM pratos WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete fichas_tecnicas in their store" ON fichas_tecnicas
    FOR DELETE USING (
        prato_id IN (
            SELECT id FROM pratos WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE auth_id = auth.uid()
            )
        )
    );

-- Comentários para documentação
COMMENT ON TABLE pratos IS 'Tabela de pratos/produtos que possuem fichas técnicas';
COMMENT ON TABLE fichas_tecnicas IS 'Tabela principal de fichas técnicas - cada linha é um ingrediente de um prato';

COMMENT ON COLUMN pratos.nome IS 'Nome do prato/produto final';
COMMENT ON COLUMN pratos.categoria IS 'Categoria do prato (ex: Hambúrgueres, Sobremesas, Bebidas)';

COMMENT ON COLUMN fichas_tecnicas.item IS 'Nome do prato/produto final (duplicado para compatibilidade)';
COMMENT ON COLUMN fichas_tecnicas.insumo IS 'Nome do ingrediente/insumo';
COMMENT ON COLUMN fichas_tecnicas.qtd IS 'Quantidade base do ingrediente';
COMMENT ON COLUMN fichas_tecnicas.quebra IS 'Percentual de quebra/perda do ingrediente';
COMMENT ON COLUMN fichas_tecnicas.unidade IS 'Unidade de medida (Un, Kg, L, etc)';
COMMENT ON COLUMN fichas_tecnicas.codigo_empresa IS 'Código interno da empresa para o ingrediente';
COMMENT ON COLUMN fichas_tecnicas.qtd_receita IS 'Quantidade na receita original';
COMMENT ON COLUMN fichas_tecnicas.fator_correcao IS 'Fator de correção para cálculos';
COMMENT ON COLUMN fichas_tecnicas.obs_item_ft IS 'Observações específicas do ingrediente';
COMMENT ON COLUMN fichas_tecnicas.id_grupo IS 'Grupo/categoria do ingrediente (ex: Proteínas, Vegetais)';
COMMENT ON COLUMN fichas_tecnicas.seq IS 'Sequência/ordem do ingrediente na ficha';
COMMENT ON COLUMN fichas_tecnicas.qtd_lote IS 'Quantidade por lote de produção';
COMMENT ON COLUMN fichas_tecnicas.id_cliente_queops IS 'ID do cliente no sistema Queops';