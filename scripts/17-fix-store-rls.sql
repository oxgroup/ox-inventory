-- Drop existing policies
DROP POLICY IF EXISTS "Usuários autenticados podem ver tudo" ON usuarios;
DROP POLICY IF EXISTS "Inventários para usuários autenticados" ON inventarios;
DROP POLICY IF EXISTS "Produtos para usuários autenticados" ON produtos;

-- Política para usuários - só podem ver usuários da mesma loja
CREATE POLICY "Usuários podem ver apenas sua loja" ON usuarios
    FOR ALL 
    TO authenticated
    USING (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    );

-- Política para inventários - só podem ver inventários da sua loja
CREATE POLICY "Inventários por loja" ON inventarios
    FOR ALL 
    TO authenticated
    USING (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    );

-- Política para produtos - podem ver produtos de todas as lojas
CREATE POLICY "Produtos visíveis para todos" ON produtos
    FOR SELECT 
    TO authenticated
    USING (true);

-- Política para produtos - só podem modificar produtos da sua loja
CREATE POLICY "Produtos modificáveis apenas da própria loja" ON produtos
    FOR INSERT UPDATE DELETE
    TO authenticated
    USING (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    );
