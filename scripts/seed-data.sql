-- Inserção de dados iniciais para o sistema OX Inventory

-- Inserir usuários de exemplo
INSERT INTO usuarios (nome, email, permissoes) VALUES
('Admin Sistema', 'admin@oxinventory.com', ARRAY['visualizar', 'criar', 'editar', 'excluir']),
('João Silva', 'joao@restaurante.com', ARRAY['visualizar', 'criar', 'editar']),
('Maria Santos', 'maria@restaurante.com', ARRAY['visualizar', 'criar']),
('Pedro Costa', 'pedro@restaurante.com', ARRAY['visualizar', 'criar', 'editar']),
('Ana Oliveira', 'ana@restaurante.com', ARRAY['visualizar'])
ON CONFLICT (email) DO NOTHING;

-- Inserir produtos de exemplo
INSERT INTO produtos (nome, categoria, unidade) VALUES
-- Carnes
('Carne Bovina - Alcatra', 'Carnes', 'kg'),
('Carne Bovina - Picanha', 'Carnes', 'kg'),
('Carne Bovina - Contrafilé', 'Carnes', 'kg'),
('Frango - Peito', 'Carnes', 'kg'),
('Frango - Coxa e Sobrecoxa', 'Carnes', 'kg'),
('Suíno - Lombo', 'Carnes', 'kg'),
('Cordeiro - Pernil', 'Carnes', 'kg'),

-- Peixes e Frutos do Mar
('Salmão - Filé', 'Peixes', 'kg'),
('Bacalhau - Porto', 'Peixes', 'kg'),
('Camarão - Médio', 'Frutos do Mar', 'kg'),
('Lula - Limpa', 'Frutos do Mar', 'kg'),
('Polvo - Cozido', 'Frutos do Mar', 'kg'),

-- Legumes e Verduras
('Batata Inglesa', 'Legumes', 'kg'),
('Batata Doce', 'Legumes', 'kg'),
('Cebola Roxa', 'Legumes', 'kg'),
('Cebola Branca', 'Legumes', 'kg'),
('Alho', 'Temperos', 'kg'),
('Tomate Italiano', 'Legumes', 'kg'),
('Pimentão Vermelho', 'Legumes', 'kg'),
('Abobrinha Italiana', 'Legumes', 'kg'),
('Berinjela', 'Legumes', 'kg'),
('Rúcula', 'Verduras', 'maço'),
('Alface Americana', 'Verduras', 'unidade'),
('Espinafre', 'Verduras', 'kg'),

-- Óleos e Temperos
('Azeite Extra Virgem', 'Óleos', 'litro'),
('Óleo de Girassol', 'Óleos', 'litro'),
('Vinagre Balsâmico', 'Condimentos', 'litro'),
('Sal Grosso', 'Temperos', 'kg'),
('Sal Refinado', 'Temperos', 'kg'),
('Pimenta do Reino Preta', 'Temperos', 'kg'),
('Orégano', 'Temperos', 'kg'),
('Manjericão Seco', 'Temperos', 'kg'),
('Alecrim', 'Temperos', 'kg'),

-- Laticínios
('Queijo Parmesão', 'Laticínios', 'kg'),
('Queijo Mussarela', 'Laticínios', 'kg'),
('Cream Cheese', 'Laticínios', 'kg'),
('Manteiga sem Sal', 'Laticínios', 'kg'),
('Creme de Leite', 'Laticínios', 'litro'),
('Leite Integral', 'Laticínios', 'litro'),

-- Bebidas Alcoólicas
('Vinho Tinto Reserva', 'Vinhos', 'garrafa'),
('Vinho Branco Seco', 'Vinhos', 'garrafa'),
('Champagne', 'Espumantes', 'garrafa'),
('Cerveja Artesanal IPA', 'Cervejas', 'garrafa'),
('Cerveja Pilsen', 'Cervejas', 'garrafa'),
('Whisky Premium', 'Destilados', 'garrafa'),
('Vodka Premium', 'Destilados', 'garrafa'),
('Gin London Dry', 'Destilados', 'garrafa'),

-- Bebidas Não Alcoólicas
('Água Mineral com Gás', 'Bebidas', 'garrafa'),
('Água Mineral sem Gás', 'Bebidas', 'garrafa'),
('Suco de Laranja Natural', 'Sucos', 'litro'),
('Refrigerante Cola', 'Refrigerantes', 'garrafa'),
('Refrigerante Guaraná', 'Refrigerantes', 'garrafa'),

-- Produtos de Limpeza
('Detergente Neutro', 'Limpeza', 'litro'),
('Desinfetante', 'Limpeza', 'litro'),
('Álcool 70%', 'Limpeza', 'litro'),
('Papel Toalha', 'Limpeza', 'rolo'),
('Luva Descartável', 'Limpeza', 'caixa'),
('Saco de Lixo 100L', 'Limpeza', 'rolo'),

-- Produtos Secos
('Arroz Branco', 'Grãos', 'kg'),
('Feijão Preto', 'Grãos', 'kg'),
('Macarrão Espaguete', 'Massas', 'kg'),
('Farinha de Trigo', 'Farinhas', 'kg'),
('Açúcar Cristal', 'Açúcares', 'kg'),
('Café em Grãos', 'Bebidas', 'kg')
ON CONFLICT DO NOTHING;
