-- Inserir dados de teste

-- Inserir usuários para a loja CWB
INSERT INTO usuarios (nome, email, permissoes, loja_id) 
SELECT 
  'Admin CWB', 
  'admin.cwb@oxgrill.com', 
  ARRAY['visualizar', 'criar', 'editar', 'excluir'], 
  l.id
FROM lojas l WHERE l.codigo = 'CWB'
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuarios (nome, email, permissoes, loja_id) 
SELECT 
  'João Silva', 
  'joao.cwb@oxgrill.com', 
  ARRAY['visualizar', 'criar', 'editar'], 
  l.id
FROM lojas l WHERE l.codigo = 'CWB'
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuarios (nome, email, permissoes, loja_id) 
SELECT 
  'Carlos Lima', 
  'carlos.cwb@oxgrill.com', 
  ARRAY['visualizar', 'criar'], 
  l.id
FROM lojas l WHERE l.codigo = 'CWB'
ON CONFLICT (email) DO NOTHING;

-- Inserir usuários para a loja BC
INSERT INTO usuarios (nome, email, permissoes, loja_id) 
SELECT 
  'Admin BC', 
  'admin.bc@oxgrill.com', 
  ARRAY['visualizar', 'criar', 'editar', 'excluir'], 
  l.id
FROM lojas l WHERE l.codigo = 'BC'
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuarios (nome, email, permissoes, loja_id) 
SELECT 
  'Maria Santos', 
  'maria.bc@oxgrill.com', 
  ARRAY['visualizar', 'criar', 'editar'], 
  l.id
FROM lojas l WHERE l.codigo = 'BC'
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuarios (nome, email, permissoes, loja_id) 
SELECT 
  'Ana Oliveira', 
  'ana.bc@oxgrill.com', 
  ARRAY['visualizar', 'criar'], 
  l.id
FROM lojas l WHERE l.codigo = 'BC'
ON CONFLICT (email) DO NOTHING;

-- Inserir produtos para a loja CWB
INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Carne Bovina - Alcatra', 'Carnes', 'kg', l.id
FROM lojas l WHERE l.codigo = 'CWB';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Carne Bovina - Picanha', 'Carnes', 'kg', l.id
FROM lojas l WHERE l.codigo = 'CWB';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Frango - Peito', 'Carnes', 'kg', l.id
FROM lojas l WHERE l.codigo = 'CWB';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Salmão - Filé', 'Peixes', 'kg', l.id
FROM lojas l WHERE l.codigo = 'CWB';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Batata Inglesa', 'Legumes', 'kg', l.id
FROM lojas l WHERE l.codigo = 'CWB';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Cebola Roxa', 'Legumes', 'kg', l.id
FROM lojas l WHERE l.codigo = 'CWB';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Azeite Extra Virgem', 'Óleos', 'litro', l.id
FROM lojas l WHERE l.codigo = 'CWB';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Sal Grosso', 'Temperos', 'kg', l.id
FROM lojas l WHERE l.codigo = 'CWB';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Vinho Tinto Reserva', 'Vinhos', 'garrafa', l.id
FROM lojas l WHERE l.codigo = 'CWB';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Cerveja Artesanal IPA', 'Cervejas', 'garrafa', l.id
FROM lojas l WHERE l.codigo = 'CWB';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Detergente Neutro', 'Limpeza', 'litro', l.id
FROM lojas l WHERE l.codigo = 'CWB';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Arroz Branco', 'Grãos', 'kg', l.id
FROM lojas l WHERE l.codigo = 'CWB';

-- Inserir produtos para a loja BC
INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Carne Bovina - Alcatra', 'Carnes', 'kg', l.id
FROM lojas l WHERE l.codigo = 'BC';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Carne Bovina - Contrafilé', 'Carnes', 'kg', l.id
FROM lojas l WHERE l.codigo = 'BC';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Frango - Coxa e Sobrecoxa', 'Carnes', 'kg', l.id
FROM lojas l WHERE l.codigo = 'BC';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Camarão - Médio', 'Frutos do Mar', 'kg', l.id
FROM lojas l WHERE l.codigo = 'BC';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Batata Doce', 'Legumes', 'kg', l.id
FROM lojas l WHERE l.codigo = 'BC';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Cebola Branca', 'Legumes', 'kg', l.id
FROM lojas l WHERE l.codigo = 'BC';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Óleo de Girassol', 'Óleos', 'litro', l.id
FROM lojas l WHERE l.codigo = 'BC';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Pimenta do Reino Preta', 'Temperos', 'kg', l.id
FROM lojas l WHERE l.codigo = 'BC';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Vinho Branco Seco', 'Vinhos', 'garrafa', l.id
FROM lojas l WHERE l.codigo = 'BC';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Cerveja Pilsen', 'Cervejas', 'garrafa', l.id
FROM lojas l WHERE l.codigo = 'BC';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Álcool 70%', 'Limpeza', 'litro', l.id
FROM lojas l WHERE l.codigo = 'BC';

INSERT INTO produtos (nome, categoria, unidade, loja_id) 
SELECT 'Feijão Preto', 'Grãos', 'kg', l.id
FROM lojas l WHERE l.codigo = 'BC';
