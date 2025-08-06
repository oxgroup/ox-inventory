-- Adicionar coluna cod_item na tabela produtos

-- Adicionar a coluna cod_item
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cod_item VARCHAR(50);

-- Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_produtos_cod_item ON produtos(cod_item);

-- Adicionar alguns códigos de exemplo para os produtos existentes
UPDATE produtos SET cod_item = 'CARNE001' WHERE nome = 'Carne Bovina - Alcatra' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CARNE002' WHERE nome = 'Carne Bovina - Picanha' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CARNE003' WHERE nome = 'Carne Bovina - Contrafilé' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'FRANGO001' WHERE nome = 'Frango - Peito' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'FRANGO002' WHERE nome = 'Frango - Coxa e Sobrecoxa' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'PEIXE001' WHERE nome = 'Salmão - Filé' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'FRUTOS001' WHERE nome = 'Camarão - Médio' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'LEG001' WHERE nome = 'Batata Inglesa' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'LEG002' WHERE nome = 'Batata Doce' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'LEG003' WHERE nome = 'Cebola Roxa' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'LEG004' WHERE nome = 'Cebola Branca' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'OLEO001' WHERE nome = 'Azeite Extra Virgem' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'OLEO002' WHERE nome = 'Óleo de Girassol' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'TEMP001' WHERE nome = 'Sal Grosso' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'TEMP002' WHERE nome = 'Pimenta do Reino Preta' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'VINHO001' WHERE nome = 'Vinho Tinto Reserva' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'VINHO002' WHERE nome = 'Vinho Branco Seco' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CERV001' WHERE nome = 'Cerveja Artesanal IPA' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CERV002' WHERE nome = 'Cerveja Pilsen' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'LIMP001' WHERE nome = 'Detergente Neutro' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'LIMP002' WHERE nome = 'Álcool 70%' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'GRAO001' WHERE nome = 'Arroz Branco' AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'GRAO002' WHERE nome = 'Feijão Preto' AND cod_item IS NULL;

-- Verificar se a coluna foi adicionada corretamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'produtos' AND column_name = 'cod_item';

-- Verificar alguns produtos com códigos
SELECT id, nome, categoria, cod_item, loja_id 
FROM produtos 
WHERE cod_item IS NOT NULL 
LIMIT 10;
