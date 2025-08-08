-- Script 24: Adicionar dados de teste para sugestões
-- Cria dados de sugestão para os produtos e loja atuais

-- Primeiro, verificar quais produtos e lojas existem
SELECT 'Produtos existentes:' as info;
SELECT cod_item, nome, loja_id FROM produtos WHERE cod_item IS NOT NULL LIMIT 10;

SELECT 'Lojas existentes:' as info;
SELECT id, nome, codigo FROM lojas LIMIT 5;

-- Criar sugestões para os produtos que realmente existem no sistema
-- Usando a loja atual do usuário de teste
DO $$
DECLARE
    loja_atual UUID := 'e9e3b92e-dfe6-420a-8957-f2101695e3b0';
    produto_cod TEXT;
    produto_nome TEXT;
BEGIN
    -- Buscar alguns produtos reais para criar sugestões
    FOR produto_cod, produto_nome IN 
        SELECT p.cod_item, p.nome 
        FROM produtos p 
        WHERE p.cod_item IS NOT NULL 
        AND p.loja_id = loja_atual
        LIMIT 5
    LOOP
        -- Inserir sugestões para Segunda (1) e Sexta (5) para cada produto
        INSERT INTO requisicoes_sugestao (cod_item, nome, qtd_media, dia_da_semana, loja_id) 
        VALUES 
            (produto_cod, produto_nome, 3.0, 1, loja_atual), -- Segunda-feira
            (produto_cod, produto_nome, 5.0, 5, loja_atual)  -- Sexta-feira
        ON CONFLICT (cod_item, dia_da_semana, loja_id) DO NOTHING;
        
        RAISE NOTICE 'Criadas sugestões para produto: % (%)', produto_nome, produto_cod;
    END LOOP;
END $$;

-- Criar sugestão específica para o produto 6326 que apareceu nos logs
INSERT INTO requisicoes_sugestao (cod_item, nome, qtd_media, dia_da_semana, loja_id) 
VALUES 
    ('6326', 'Produto Teste 6326', 2.5, 6, 'e9e3b92e-dfe6-420a-8957-f2101695e3b0'), -- Sábado
    ('6326', 'Produto Teste 6326', 4.0, 1, 'e9e3b92e-dfe6-420a-8957-f2101695e3b0'), -- Segunda
    ('6326', 'Produto Teste 6326', 6.0, 5, 'e9e3b92e-dfe6-420a-8957-f2101695e3b0')  -- Sexta
ON CONFLICT (cod_item, dia_da_semana, loja_id) DO UPDATE SET
    qtd_media = EXCLUDED.qtd_media,
    nome = EXCLUDED.nome,
    updated_at = NOW();

-- Verificar dados inseridos
SELECT 'Sugestões criadas:' as info;
SELECT 
    cod_item, 
    nome, 
    qtd_media, 
    CASE dia_da_semana 
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Segunda'
        WHEN 2 THEN 'Terça'
        WHEN 3 THEN 'Quarta'
        WHEN 4 THEN 'Quinta'
        WHEN 5 THEN 'Sexta'
        WHEN 6 THEN 'Sábado'
    END as dia_nome,
    loja_id
FROM requisicoes_sugestao 
WHERE loja_id = 'e9e3b92e-dfe6-420a-8957-f2101695e3b0'
ORDER BY cod_item, dia_da_semana;