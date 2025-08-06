-- Desabilitar RLS temporariamente para testar
ALTER TABLE lojas DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE itens_inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Usuários veem apenas sua loja" ON lojas;
DROP POLICY IF EXISTS "Usuários veem apenas colegas da mesma loja" ON usuarios;
DROP POLICY IF EXISTS "Usuários veem apenas inventários da sua loja" ON inventarios;
DROP POLICY IF EXISTS "Usuários veem apenas itens de inventários da sua loja" ON itens_inventario;
DROP POLICY IF EXISTS "Usuários veem apenas produtos da sua loja" ON produtos;

-- Verificar se há outras políticas
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('lojas', 'usuarios', 'inventarios', 'itens_inventario', 'produtos');
