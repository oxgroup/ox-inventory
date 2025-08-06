-- Configurar RLS mínimo e simples

-- Habilitar RLS apenas nas tabelas principais
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Manter lojas e itens_inventario sem RLS por enquanto
ALTER TABLE lojas DISABLE ROW LEVEL SECURITY;
ALTER TABLE itens_inventario DISABLE ROW LEVEL SECURITY;

-- Política super simples para usuários - permite tudo para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver tudo" ON usuarios
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política super simples para inventários - permite tudo para usuários autenticados
CREATE POLICY "Inventários para usuários autenticados" ON inventarios
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política super simples para produtos - permite tudo para usuários autenticados
CREATE POLICY "Produtos para usuários autenticados" ON produtos
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('usuarios', 'inventarios', 'produtos');
