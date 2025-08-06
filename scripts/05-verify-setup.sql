-- Verificar se tudo foi criado corretamente

-- Verificar lojas
SELECT 'LOJAS' as tabela, count(*) as total FROM lojas;

-- Verificar usuários por loja
SELECT 
  'USUARIOS' as tabela,
  l.codigo as loja,
  count(u.id) as total
FROM lojas l
LEFT JOIN usuarios u ON u.loja_id = l.id
GROUP BY l.codigo
ORDER BY l.codigo;

-- Verificar produtos por loja
SELECT 
  'PRODUTOS' as tabela,
  l.codigo as loja,
  count(p.id) as total
FROM lojas l
LEFT JOIN produtos p ON p.loja_id = l.id
GROUP BY l.codigo
ORDER BY l.codigo;

-- Verificar estrutura das tabelas
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('lojas', 'usuarios', 'produtos', 'inventarios')
  AND column_name LIKE '%loja%'
ORDER BY table_name, column_name;
