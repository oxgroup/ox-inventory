-- Script para criar módulo de gestão de desperdícios
-- Versão: 1.0
-- Data: 2024-01-XX

-- Criar tabela principal de desperdícios
CREATE TABLE IF NOT EXISTS desperdicios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loja_id UUID NOT NULL REFERENCES lojas(id),
    data_desperdicio DATE NOT NULL,
    setor VARCHAR(100) NOT NULL,
    responsavel_id UUID NOT NULL REFERENCES usuarios(id),
    comentario TEXT,
    valor_total DECIMAL(10,2) DEFAULT 0,
    fotos JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
);

-- Criar tabela de itens do desperdício
CREATE TABLE IF NOT EXISTS desperdicios_itens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    desperdicio_id UUID NOT NULL REFERENCES desperdicios(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos(id),
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
CREATE INDEX IF NOT EXISTS idx_desperdicios_responsavel ON desperdicios(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_desperdicios_status ON desperdicios(status);
CREATE INDEX IF NOT EXISTS idx_desperdicios_itens_desperdicio ON desperdicios_itens(desperdicio_id);
CREATE INDEX IF NOT EXISTS idx_desperdicios_itens_produto ON desperdicios_itens(produto_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_desperdicios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_update_desperdicios_updated_at
    BEFORE UPDATE ON desperdicios
    FOR EACH ROW
    EXECUTE FUNCTION update_desperdicios_updated_at();

-- Função para calcular valor total do desperdício
CREATE OR REPLACE FUNCTION calcular_valor_total_desperdicio(desperdicio_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
    total DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(SUM(valor_total), 0)
    INTO total
    FROM desperdicios_itens
    WHERE desperdicio_id = desperdicio_id_param;
    
    UPDATE desperdicios
    SET valor_total = total
    WHERE id = desperdicio_id_param;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular valor total quando itens são alterados
CREATE OR REPLACE FUNCTION trigger_recalcular_valor_desperdicio()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calcular_valor_total_desperdicio(OLD.desperdicio_id);
        RETURN OLD;
    ELSE
        PERFORM calcular_valor_total_desperdicio(NEW.desperdicio_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_desperdicios_itens_valor
    AFTER INSERT OR UPDATE OR DELETE ON desperdicios_itens
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalcular_valor_desperdicio();

-- RLS (Row Level Security)
ALTER TABLE desperdicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE desperdicios_itens ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para desperdicios
CREATE POLICY "Usuários podem ver desperdícios de sua loja" ON desperdicios
    FOR SELECT USING (
        loja_id IN (
            SELECT loja_id FROM usuarios WHERE id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem inserir desperdícios em sua loja" ON desperdicios
    FOR INSERT WITH CHECK (
        loja_id IN (
            SELECT loja_id FROM usuarios WHERE id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar desperdícios de sua loja" ON desperdicios
    FOR UPDATE USING (
        loja_id IN (
            SELECT loja_id FROM usuarios WHERE id = auth.uid()
        )
    );

-- Políticas de segurança para desperdicios_itens
CREATE POLICY "Usuários podem ver itens de desperdícios de sua loja" ON desperdicios_itens
    FOR SELECT USING (
        desperdicio_id IN (
            SELECT id FROM desperdicios 
            WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Usuários podem inserir itens de desperdícios de sua loja" ON desperdicios_itens
    FOR INSERT WITH CHECK (
        desperdicio_id IN (
            SELECT id FROM desperdicios 
            WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Usuários podem atualizar itens de desperdícios de sua loja" ON desperdicios_itens
    FOR UPDATE USING (
        desperdicio_id IN (
            SELECT id FROM desperdicios 
            WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Usuários podem deletar itens de desperdícios de sua loja" ON desperdicios_itens
    FOR DELETE USING (
        desperdicio_id IN (
            SELECT id FROM desperdicios 
            WHERE loja_id IN (
                SELECT loja_id FROM usuarios WHERE id = auth.uid()
            )
        )
    );

-- View para relatórios de desperdícios com dados relacionados
CREATE OR REPLACE VIEW vw_desperdicios_completo AS
SELECT 
    d.id,
    d.loja_id,
    d.data_desperdicio,
    d.setor,
    d.responsavel_id,
    d.comentario,
    d.valor_total,
    d.fotos,
    d.status,
    d.created_at,
    d.updated_at,
    l.nome as loja_nome,
    l.codigo as loja_codigo,
    u.nome as responsavel_nome,
    u.email as responsavel_email,
    criador.nome as criado_por_nome,
    COUNT(di.id) as total_itens,
    COALESCE(SUM(di.quantidade), 0) as quantidade_total_itens
FROM desperdicios d
LEFT JOIN lojas l ON d.loja_id = l.id
LEFT JOIN usuarios u ON d.responsavel_id = u.id
LEFT JOIN usuarios criador ON d.created_by = criador.id
LEFT JOIN desperdicios_itens di ON d.id = di.desperdicio_id
GROUP BY d.id, l.nome, l.codigo, u.nome, u.email, criador.nome;

-- View para relatórios por setor
CREATE OR REPLACE VIEW vw_desperdicios_por_setor AS
SELECT 
    d.loja_id,
    d.setor,
    DATE_TRUNC('month', d.data_desperdicio) as mes,
    COUNT(d.id) as total_desperdicios,
    COALESCE(SUM(d.valor_total), 0) as valor_total_desperdicios,
    COALESCE(SUM(di.quantidade), 0) as quantidade_total_desperdicios
FROM desperdicios d
LEFT JOIN desperdicios_itens di ON d.id = di.desperdicio_id
WHERE d.status = 'ativo'
GROUP BY d.loja_id, d.setor, DATE_TRUNC('month', d.data_desperdicio);

-- Função para obter estatísticas de desperdícios
CREATE OR REPLACE FUNCTION obter_estatisticas_desperdicios(
    loja_id_param UUID,
    data_inicio DATE DEFAULT NULL,
    data_fim DATE DEFAULT NULL
)
RETURNS TABLE (
    total_desperdicios BIGINT,
    valor_total DECIMAL,
    media_valor_por_desperdicio DECIMAL,
    setor_maior_desperdicio TEXT,
    produto_mais_desperdicado TEXT,
    desperdicios_mes_atual BIGINT,
    tendencia_mensal TEXT
) AS $$
BEGIN
    -- Definir datas padrão se não fornecidas
    IF data_inicio IS NULL THEN
        data_inicio := DATE_TRUNC('month', CURRENT_DATE);
    END IF;
    
    IF data_fim IS NULL THEN
        data_fim := CURRENT_DATE;
    END IF;
    
    RETURN QUERY
    WITH stats_gerais AS (
        SELECT 
            COUNT(d.id)::BIGINT as total,
            COALESCE(SUM(d.valor_total), 0) as valor,
            CASE 
                WHEN COUNT(d.id) > 0 THEN COALESCE(SUM(d.valor_total), 0) / COUNT(d.id)
                ELSE 0
            END as media
        FROM desperdicios d
        WHERE d.loja_id = loja_id_param 
        AND d.data_desperdicio BETWEEN data_inicio AND data_fim
        AND d.status = 'ativo'
    ),
    setor_top AS (
        SELECT d.setor
        FROM desperdicios d
        WHERE d.loja_id = loja_id_param 
        AND d.data_desperdicio BETWEEN data_inicio AND data_fim
        AND d.status = 'ativo'
        GROUP BY d.setor
        ORDER BY SUM(d.valor_total) DESC
        LIMIT 1
    ),
    produto_top AS (
        SELECT p.nome
        FROM desperdicios_itens di
        JOIN desperdicios d ON di.desperdicio_id = d.id
        JOIN produtos p ON di.produto_id = p.id
        WHERE d.loja_id = loja_id_param 
        AND d.data_desperdicio BETWEEN data_inicio AND data_fim
        AND d.status = 'ativo'
        GROUP BY p.nome
        ORDER BY SUM(di.quantidade) DESC
        LIMIT 1
    ),
    mes_atual AS (
        SELECT COUNT(d.id)::BIGINT as total_mes
        FROM desperdicios d
        WHERE d.loja_id = loja_id_param 
        AND DATE_TRUNC('month', d.data_desperdicio) = DATE_TRUNC('month', CURRENT_DATE)
        AND d.status = 'ativo'
    )
    SELECT 
        sg.total,
        sg.valor,
        sg.media,
        COALESCE(st.setor, 'N/A'),
        COALESCE(pt.nome, 'N/A'),
        ma.total_mes,
        'estável'::TEXT -- Placeholder para tendência
    FROM stats_gerais sg
    CROSS JOIN setor_top st
    CROSS JOIN produto_top pt
    CROSS JOIN mes_atual ma;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE desperdicios IS 'Registros de desperdícios por loja e setor';
COMMENT ON TABLE desperdicios_itens IS 'Itens específicos de cada desperdício';
COMMENT ON COLUMN desperdicios.setor IS 'Setor onde ocorreu o desperdício (integrado com módulo setores)';
COMMENT ON COLUMN desperdicios.fotos IS 'Array JSON com URLs das fotos do desperdício';
COMMENT ON COLUMN desperdicios.valor_total IS 'Valor total calculado automaticamente dos itens';