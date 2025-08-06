-- Atualizar dados de exemplo com códigos de item para as duas lojas

-- Atualizar produtos da loja CWB com códigos
UPDATE produtos SET cod_item = 'CWB-CARNE001' WHERE nome = 'Carne Bovina - Alcatra' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CWB-CARNE002' WHERE nome = 'Carne Bovina - Picanha' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CWB-FRANGO001' WHERE nome = 'Frango - Peito' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CWB-PEIXE001' WHERE nome = 'Salmão - Filé' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CWB-LEG001' WHERE nome = 'Batata Inglesa' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CWB-LEG003' WHERE nome = 'Cebola Roxa' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CWB-OLEO001' WHERE nome = 'Azeite Extra Virgem' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CWB-TEMP001' WHERE nome = 'Sal Grosso' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CWB-VINHO001' WHERE nome = 'Vinho Tinto Reserva' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CWB-CERV001' WHERE nome = 'Cerveja Artesanal IPA' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CWB-LIMP001' WHERE nome = 'Detergente Neutro' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'CWB-GRAO001' WHERE nome = 'Arroz Branco' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'CWB') AND cod_item IS NULL;

-- Atualizar produtos da loja BC com códigos
UPDATE produtos SET cod_item = 'BC-CARNE001' WHERE nome = 'Carne Bovina - Alcatra' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'BC-CARNE003' WHERE nome = 'Carne Bovina - Contrafilé' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'BC-FRANGO002' WHERE nome = 'Frango - Coxa e Sobrecoxa' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'BC-FRUTOS001' WHERE nome = 'Camarão - Médio' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'BC-LEG002' WHERE nome = 'Batata Doce' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'BC-LEG004' WHERE nome = 'Cebola Branca' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'BC-OLEO002' WHERE nome = 'Óleo de Girassol' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'BC-TEMP002' WHERE nome = 'Pimenta do Reino Preta' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'BC-VINHO002' WHERE nome = 'Vinho Branco Seco' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'BC-CERV002' WHERE nome = 'Cerveja Pilsen' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'BC-LIMP002' WHERE nome = 'Álcool 70%' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;
UPDATE produtos SET cod_item = 'BC-GRAO002' WHERE nome = 'Feijão Preto' AND loja_id = (SELECT id FROM lojas WHERE codigo = 'BC') AND cod_item IS NULL;

-- Verificar produtos atualizados por loja
SELECT 
  l.codigo as loja,
  p.nome,
  p.categoria,
  p.cod_item
FROM produtos p
JOIN lojas l ON p.loja_id = l.id
WHERE p.cod_item IS NOT NULL
ORDER BY l.codigo, p.categoria, p.nome;

-- Contar produtos com código por loja
SELECT 
  l.codigo as loja,
  COUNT(*) as total_produtos_com_codigo
FROM produtos p
JOIN lojas l ON p.loja_id = l.id
WHERE p.cod_item IS NOT NULL
GROUP BY l.codigo
ORDER BY l.codigo;
