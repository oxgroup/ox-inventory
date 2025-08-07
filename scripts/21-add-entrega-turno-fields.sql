-- Adicionar campos de data de entrega prevista e turno
-- Script para atualizar tabela requisicoes

-- Criar enum para turno
DO $$ BEGIN
    CREATE TYPE turno_entrega AS ENUM ('Manhã', 'Tarde');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar colunas na tabela requisicoes
ALTER TABLE requisicoes 
ADD COLUMN IF NOT EXISTS data_entrega_prevista DATE,
ADD COLUMN IF NOT EXISTS turno turno_entrega;

-- Comentários para documentação
COMMENT ON COLUMN requisicoes.data_entrega_prevista IS 'Data prevista para entrega da requisição';
COMMENT ON COLUMN requisicoes.turno IS 'Turno para entrega: Manhã ou Tarde';

-- Índice para consultas por data prevista
CREATE INDEX IF NOT EXISTS idx_requisicoes_data_entrega_prevista 
ON requisicoes(data_entrega_prevista);

-- Índice para consultas por turno
CREATE INDEX IF NOT EXISTS idx_requisicoes_turno 
ON requisicoes(turno);