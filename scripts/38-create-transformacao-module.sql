-- Script 38: Criar módulo de Transformação de Proteínas
-- Módulo para transformação de produtos brutos em porções etiquetadas

-- Tabela principal de transformações
CREATE TABLE IF NOT EXISTS transformacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_lote TEXT NOT NULL UNIQUE, -- Numeração automática sequencial
    loja_id UUID NOT NULL,
    
    -- Produto bruto (entrada)
    produto_bruto_codigo TEXT NOT NULL,
    produto_bruto_nome TEXT NOT NULL,
    quantidade_inicial DECIMAL(10,3) NOT NULL,
    unidade_inicial TEXT NOT NULL DEFAULT 'kg',
    custo_medio DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Quebra e custos
    percentual_quebra DECIMAL(5,2) NOT NULL DEFAULT 0,
    quantidade_liquida DECIMAL(10,3) NOT NULL DEFAULT 0,
    custo_liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Datas e metadados
    data_transformacao DATE NOT NULL DEFAULT CURRENT_DATE,
    dias_validade INTEGER NOT NULL DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado', 'cancelado')),
    observacoes TEXT,
    
    -- Auditoria
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_transformacao_loja 
        FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE RESTRICT
);

-- Tabela de itens/porções resultantes da transformação
CREATE TABLE IF NOT EXISTS transformacao_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transformacao_id UUID NOT NULL,
    
    -- Produto porção (saída)
    produto_porcao_codigo TEXT NOT NULL,
    produto_porcao_nome TEXT NOT NULL,
    quantidade_porcoes INTEGER NOT NULL DEFAULT 0,
    peso_medio_porcao DECIMAL(8,3) NOT NULL,
    unidade_porcao TEXT NOT NULL DEFAULT 'peça',
    
    -- Custos e preços
    quantidade_utilizada DECIMAL(10,3) NOT NULL, -- Peso total usado para esta porção
    custo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
    preco_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Controle de estoque
    ponto_reposicao INTEGER DEFAULT 10,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_transformacao_item_transformacao 
        FOREIGN KEY (transformacao_id) REFERENCES transformacoes(id) ON DELETE CASCADE,
    CONSTRAINT check_quantidade_positiva 
        CHECK (quantidade_porcoes > 0 AND peso_medio_porcao > 0)
);

-- Tabela de etiquetas individuais geradas
CREATE TABLE IF NOT EXISTS etiquetas_transformacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transformacao_id UUID NOT NULL,
    item_id UUID NOT NULL,
    
    -- Identificação da etiqueta
    numero_lote TEXT NOT NULL, -- Mesmo do cabeçalho
    numero_peca INTEGER NOT NULL, -- Sequencial por item
    codigo_barras TEXT NOT NULL,
    
    -- Dados do produto
    codigo_produto TEXT NOT NULL,
    nome_produto TEXT NOT NULL,
    peso_real DECIMAL(8,3) NOT NULL,
    unidade TEXT NOT NULL DEFAULT 'g',
    
    -- Validade
    data_producao DATE NOT NULL,
    data_validade DATE NOT NULL,
    dias_validade INTEGER NOT NULL,
    
    -- QR Code
    qr_code_data JSONB NOT NULL, -- Dados completos em JSON
    qr_code_hash TEXT NOT NULL, -- Hash para identificação única
    
    -- Status e controle
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'usado', 'vencido', 'cancelado')),
    impresso BOOLEAN DEFAULT FALSE,
    data_impressao TIMESTAMP WITH TIME ZONE,
    reimpressoes INTEGER DEFAULT 0,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_etiqueta_transformacao 
        FOREIGN KEY (transformacao_id) REFERENCES transformacoes(id) ON DELETE CASCADE,
    CONSTRAINT fk_etiqueta_item 
        FOREIGN KEY (item_id) REFERENCES transformacao_itens(id) ON DELETE CASCADE,
    CONSTRAINT uk_etiqueta_lote_peca 
        UNIQUE (numero_lote, numero_peca, item_id)
);

-- Tabela de sequência para numeração de lotes
CREATE TABLE IF NOT EXISTS transformacao_sequencia_lotes (
    loja_id UUID PRIMARY KEY,
    ultimo_numero INTEGER NOT NULL DEFAULT 0,
    prefixo TEXT NOT NULL DEFAULT 'L',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_sequencia_loja 
        FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transformacoes_loja_data 
    ON transformacoes(loja_id, data_transformacao DESC);

CREATE INDEX IF NOT EXISTS idx_transformacoes_numero_lote 
    ON transformacoes(numero_lote);

CREATE INDEX IF NOT EXISTS idx_transformacao_itens_transformacao 
    ON transformacao_itens(transformacao_id);

CREATE INDEX IF NOT EXISTS idx_etiquetas_transformacao_lote 
    ON etiquetas_transformacao(numero_lote);

CREATE INDEX IF NOT EXISTS idx_etiquetas_qr_hash 
    ON etiquetas_transformacao(qr_code_hash);

CREATE INDEX IF NOT EXISTS idx_etiquetas_status_validade 
    ON etiquetas_transformacao(status, data_validade);

-- Função para gerar número de lote automático
CREATE OR REPLACE FUNCTION gerar_numero_lote(p_loja_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_prefixo TEXT := 'L';
    v_ano TEXT := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    v_mes TEXT := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
    v_dia TEXT := LPAD(EXTRACT(DAY FROM CURRENT_DATE)::TEXT, 2, '0');
    v_numero INTEGER;
    v_lote TEXT;
BEGIN
    -- Inserir ou atualizar sequência para a loja
    INSERT INTO transformacao_sequencia_lotes (loja_id, ultimo_numero)
    VALUES (p_loja_id, 1)
    ON CONFLICT (loja_id) DO UPDATE SET
        ultimo_numero = transformacao_sequencia_lotes.ultimo_numero + 1,
        updated_at = NOW()
    RETURNING ultimo_numero INTO v_numero;
    
    -- Formato: L20240829001 (L + YYYYMMDD + 3 dígitos)
    v_lote := v_prefixo || v_ano || v_mes || v_dia || LPAD(v_numero::TEXT, 3, '0');
    
    RETURN v_lote;
END;
$$;

-- Função para calcular data de validade
CREATE OR REPLACE FUNCTION calcular_data_validade(p_data_producao DATE, p_dias_validade INTEGER)
RETURNS DATE
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN p_data_producao + INTERVAL '1 day' * p_dias_validade;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Aplicar trigger nas tabelas
CREATE TRIGGER trigger_transformacoes_updated_at
    BEFORE UPDATE ON transformacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_etiquetas_updated_at
    BEFORE UPDATE ON etiquetas_transformacao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE transformacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformacao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas_transformacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformacao_sequencia_lotes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver transformações da sua loja"
    ON transformacoes FOR SELECT
    USING (loja_id = (
        SELECT loja_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "Usuários podem inserir transformações na sua loja"
    ON transformacoes FOR INSERT
    WITH CHECK (loja_id = (
        SELECT loja_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "Usuários podem atualizar transformações da sua loja"
    ON transformacoes FOR UPDATE
    USING (loja_id = (
        SELECT loja_id FROM usuarios WHERE id = auth.uid()
    ));

-- Políticas para itens
CREATE POLICY "Usuários podem ver itens das transformações da sua loja"
    ON transformacao_itens FOR SELECT
    USING (transformacao_id IN (
        SELECT id FROM transformacoes 
        WHERE loja_id = (SELECT loja_id FROM usuarios WHERE id = auth.uid())
    ));

CREATE POLICY "Usuários podem inserir itens nas transformações da sua loja"
    ON transformacao_itens FOR INSERT
    WITH CHECK (transformacao_id IN (
        SELECT id FROM transformacoes 
        WHERE loja_id = (SELECT loja_id FROM usuarios WHERE id = auth.uid())
    ));

-- Políticas para etiquetas
CREATE POLICY "Usuários podem ver etiquetas da sua loja"
    ON etiquetas_transformacao FOR SELECT
    USING (transformacao_id IN (
        SELECT id FROM transformacoes 
        WHERE loja_id = (SELECT loja_id FROM usuarios WHERE id = auth.uid())
    ));

CREATE POLICY "Usuários podem inserir etiquetas na sua loja"
    ON etiquetas_transformacao FOR INSERT
    WITH CHECK (transformacao_id IN (
        SELECT id FROM transformacoes 
        WHERE loja_id = (SELECT loja_id FROM usuarios WHERE id = auth.uid())
    ));

CREATE POLICY "Usuários podem atualizar etiquetas da sua loja"
    ON etiquetas_transformacao FOR UPDATE
    USING (transformacao_id IN (
        SELECT id FROM transformacoes 
        WHERE loja_id = (SELECT loja_id FROM usuarios WHERE id = auth.uid())
    ));

-- Política para sequência de lotes
CREATE POLICY "Usuários podem acessar sequência da sua loja"
    ON transformacao_sequencia_lotes FOR ALL
    USING (loja_id = (
        SELECT loja_id FROM usuarios WHERE id = auth.uid()
    ));

-- Comentários nas tabelas
COMMENT ON TABLE transformacoes IS 'Registro de transformações de produtos brutos em porções';
COMMENT ON TABLE transformacao_itens IS 'Itens/porções resultantes de cada transformação';
COMMENT ON TABLE etiquetas_transformacao IS 'Etiquetas individuais com QR code para cada peça';
COMMENT ON TABLE transformacao_sequencia_lotes IS 'Controle de numeração sequencial de lotes por loja';

-- Dados iniciais de exemplo (opcional)
-- INSERT INTO transformacao_sequencia_lotes (loja_id, ultimo_numero)
-- SELECT id, 0 FROM lojas ON CONFLICT (loja_id) DO NOTHING;

COMMIT;