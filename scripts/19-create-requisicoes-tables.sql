-- Módulo de Requisições de Estoque
-- Script de criação das tabelas de requisições

-- Criar enum para status das requisições
DO $$ BEGIN
    CREATE TYPE status_requisicao AS ENUM ('pendente', 'separado', 'entregue', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar enum para status dos itens
DO $$ BEGIN
    CREATE TYPE status_item_requisicao AS ENUM ('pendente', 'separado', 'entregue', 'cancelado', 'em_falta');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela principal de requisições
CREATE TABLE IF NOT EXISTS requisicoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_requisicao VARCHAR(50) UNIQUE NOT NULL,
    setor_solicitante VARCHAR(100) NOT NULL,
    usuario_solicitante_id UUID NOT NULL REFERENCES usuarios(id),
    loja_id UUID NOT NULL REFERENCES lojas(id),
    status status_requisicao DEFAULT 'pendente',
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_separacao TIMESTAMP WITH TIME ZONE,
    data_entrega TIMESTAMP WITH TIME ZONE,
    data_confirmacao TIMESTAMP WITH TIME ZONE,
    usuario_separacao_id UUID REFERENCES usuarios(id),
    usuario_entrega_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens das requisições
CREATE TABLE IF NOT EXISTS itens_requisicao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requisicao_id UUID NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos(id),
    quantidade_solicitada DECIMAL(10,3) NOT NULL DEFAULT 0,
    quantidade_separada DECIMAL(10,3) DEFAULT 0,
    quantidade_entregue DECIMAL(10,3) DEFAULT 0,
    status status_item_requisicao DEFAULT 'pendente',
    observacoes_item TEXT,
    data_separacao_item TIMESTAMP WITH TIME ZONE,
    data_entrega_item TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para gerar número de requisição
CREATE OR REPLACE FUNCTION gerar_numero_requisicao()
RETURNS TEXT AS $$
DECLARE
    ano_atual TEXT;
    contador INTEGER;
    numero_formatado TEXT;
BEGIN
    -- Obter ano atual
    ano_atual := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Contar requisições do ano atual
    SELECT COUNT(*) + 1 INTO contador
    FROM requisicoes 
    WHERE EXTRACT(YEAR FROM data_criacao) = EXTRACT(YEAR FROM NOW());
    
    -- Formatar número: REQ-2024-001
    numero_formatado := 'REQ-' || ano_atual || '-' || LPAD(contador::TEXT, 3, '0');
    
    RETURN numero_formatado;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar número de requisição automaticamente
CREATE OR REPLACE FUNCTION set_numero_requisicao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_requisicao IS NULL OR NEW.numero_requisicao = '' THEN
        NEW.numero_requisicao := gerar_numero_requisicao();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_numero_requisicao ON requisicoes;
CREATE TRIGGER trigger_numero_requisicao
    BEFORE INSERT ON requisicoes
    FOR EACH ROW
    EXECUTE FUNCTION set_numero_requisicao();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_requisicoes()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de updated_at
DROP TRIGGER IF EXISTS update_requisicoes_updated_at ON requisicoes;
CREATE TRIGGER update_requisicoes_updated_at
    BEFORE UPDATE ON requisicoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_requisicoes();

DROP TRIGGER IF EXISTS update_itens_requisicao_updated_at ON itens_requisicao;
CREATE TRIGGER update_itens_requisicao_updated_at
    BEFORE UPDATE ON itens_requisicao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_requisicoes();

-- Função para atualizar status da requisição baseado nos itens
CREATE OR REPLACE FUNCTION atualizar_status_requisicao(requisicao_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total_itens INTEGER;
    itens_separados INTEGER;
    itens_entregues INTEGER;
    itens_cancelados_ou_falta INTEGER;
    novo_status status_requisicao;
BEGIN
    -- Contar itens por status
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'separado' THEN 1 END) as separados,
        COUNT(CASE WHEN status = 'entregue' THEN 1 END) as entregues,
        COUNT(CASE WHEN status IN ('cancelado', 'em_falta') THEN 1 END) as cancelados_falta
    INTO 
        total_itens, itens_separados, itens_entregues, itens_cancelados_ou_falta
    FROM itens_requisicao 
    WHERE requisicao_id = requisicao_uuid;
    
    -- Determinar novo status
    IF itens_entregues = total_itens THEN
        novo_status := 'entregue';
    ELSIF itens_separados + itens_cancelados_ou_falta = total_itens AND itens_separados > 0 THEN
        novo_status := 'separado';
    ELSE
        novo_status := 'pendente';
    END IF;
    
    -- Atualizar requisição
    UPDATE requisicoes 
    SET 
        status = novo_status,
        data_separacao = CASE WHEN novo_status = 'separado' AND data_separacao IS NULL THEN NOW() ELSE data_separacao END,
        data_entrega = CASE WHEN novo_status = 'entregue' AND data_entrega IS NULL THEN NOW() ELSE data_entrega END
    WHERE id = requisicao_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status da requisição quando itens mudam
CREATE OR REPLACE FUNCTION trigger_atualizar_status_requisicao()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar status da requisição pai
    IF TG_OP = 'DELETE' THEN
        PERFORM atualizar_status_requisicao(OLD.requisicao_id);
        RETURN OLD;
    ELSE
        PERFORM atualizar_status_requisicao(NEW.requisicao_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nos itens
DROP TRIGGER IF EXISTS trigger_status_requisicao_items ON itens_requisicao;
CREATE TRIGGER trigger_status_requisicao_items
    AFTER INSERT OR UPDATE OR DELETE ON itens_requisicao
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_status_requisicao();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_requisicoes_loja_id ON requisicoes(loja_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_usuario_solicitante ON requisicoes(usuario_solicitante_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_status ON requisicoes(status);
CREATE INDEX IF NOT EXISTS idx_requisicoes_data_criacao ON requisicoes(data_criacao);
CREATE INDEX IF NOT EXISTS idx_requisicoes_numero ON requisicoes(numero_requisicao);

CREATE INDEX IF NOT EXISTS idx_itens_requisicao_requisicao_id ON itens_requisicao(requisicao_id);
CREATE INDEX IF NOT EXISTS idx_itens_requisicao_produto_id ON itens_requisicao(produto_id);
CREATE INDEX IF NOT EXISTS idx_itens_requisicao_status ON itens_requisicao(status);

-- Comentários para documentação
COMMENT ON TABLE requisicoes IS 'Tabela principal de requisições de estoque entre setores';
COMMENT ON TABLE itens_requisicao IS 'Itens individuais de cada requisição com controle granular de status';
COMMENT ON COLUMN requisicoes.numero_requisicao IS 'Número único da requisição no formato REQ-YYYY-NNN';
COMMENT ON COLUMN requisicoes.setor_solicitante IS 'Setor que está solicitando os produtos';
COMMENT ON COLUMN itens_requisicao.status IS 'Status individual do item: pendente, separado, entregue, cancelado, em_falta';