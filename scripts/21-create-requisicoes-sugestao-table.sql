-- Script 21: Criar tabela de sugestões de quantidade por dia da semana
-- Execute depois do script 20-requisicoes-rls-policies.sql

-- Criar tabela requisicoes_sugestao
CREATE TABLE IF NOT EXISTS requisicoes_sugestao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cod_item VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    qtd_media DECIMAL(10,2) NOT NULL CHECK (qtd_media > 0),
    dia_da_semana INTEGER NOT NULL CHECK (dia_da_semana >= 0 AND dia_da_semana <= 6),
    loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicatas
    UNIQUE(cod_item, dia_da_semana, loja_id)
);

-- Comentários para documentação
COMMENT ON TABLE requisicoes_sugestao IS 'Sugestões de quantidade para produtos baseado no dia da semana';
COMMENT ON COLUMN requisicoes_sugestao.dia_da_semana IS 'Dia da semana: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado';
COMMENT ON COLUMN requisicoes_sugestao.qtd_media IS 'Quantidade média sugerida para o produto no dia da semana especificado';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_requisicoes_sugestao_cod_item ON requisicoes_sugestao(cod_item);
CREATE INDEX IF NOT EXISTS idx_requisicoes_sugestao_loja_dia ON requisicoes_sugestao(loja_id, dia_da_semana);
CREATE INDEX IF NOT EXISTS idx_requisicoes_sugestao_lookup ON requisicoes_sugestao(cod_item, dia_da_semana, loja_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_requisicoes_sugestao_updated_at ON requisicoes_sugestao;
CREATE TRIGGER trigger_requisicoes_sugestao_updated_at
    BEFORE UPDATE ON requisicoes_sugestao
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Dados de exemplo (opcional - para testes)
-- Remova ou modifique conforme necessário
INSERT INTO requisicoes_sugestao (cod_item, nome, qtd_media, dia_da_semana, loja_id) 
SELECT 
    'CARNE001', 'Carne Bovina - Alcatra', 5.0, 1, l.id
FROM lojas l 
WHERE l.codigo = 'LOJA01'
ON CONFLICT (cod_item, dia_da_semana, loja_id) DO NOTHING;

INSERT INTO requisicoes_sugestao (cod_item, nome, qtd_media, dia_da_semana, loja_id) 
SELECT 
    'CARNE001', 'Carne Bovina - Alcatra', 8.0, 5, l.id
FROM lojas l 
WHERE l.codigo = 'LOJA01'
ON CONFLICT (cod_item, dia_da_semana, loja_id) DO NOTHING;

INSERT INTO requisicoes_sugestao (cod_item, nome, qtd_media, dia_da_semana, loja_id) 
SELECT 
    'FRANGO001', 'Frango - Peito', 3.5, 1, l.id
FROM lojas l 
WHERE l.codigo = 'LOJA01'
ON CONFLICT (cod_item, dia_da_semana, loja_id) DO NOTHING;

INSERT INTO requisicoes_sugestao (cod_item, nome, qtd_media, dia_da_semana, loja_id) 
SELECT 
    'FRANGO001', 'Frango - Peito', 6.0, 5, l.id
FROM lojas l 
WHERE l.codigo = 'LOJA01'
ON CONFLICT (cod_item, dia_da_semana, loja_id) DO NOTHING;

-- RLS (Row Level Security) para a nova tabela
ALTER TABLE requisicoes_sugestao ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem apenas dados da sua loja
CREATE POLICY "Users can view suggestions from their store" ON requisicoes_sugestao
    FOR SELECT USING (
        loja_id = (SELECT loja_id FROM usuarios WHERE auth_id = auth.uid())
    );

-- Policy para usuários com permissão de editar poderem inserir/atualizar sugestões
CREATE POLICY "Users can manage suggestions in their store" ON requisicoes_sugestao
    FOR ALL USING (
        loja_id = (SELECT loja_id FROM usuarios WHERE auth_id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM usuarios 
            WHERE auth_id = auth.uid() 
            AND (permissoes && ARRAY['editar'] OR permissoes && ARRAY['excluir'])
        )
    );

-- Grant de permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON requisicoes_sugestao TO authenticated;