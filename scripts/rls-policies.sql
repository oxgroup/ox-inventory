-- Políticas de Row Level Security (RLS) para multi-loja

-- Habilitar RLS nas tabelas
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Política para lojas - usuários só veem sua própria loja
CREATE POLICY "Usuários veem apenas sua loja" ON lojas
    FOR ALL USING (
        id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    );

-- Política para usuários - só veem usuários da mesma loja
CREATE POLICY "Usuários veem apenas colegas da mesma loja" ON usuarios
    FOR ALL USING (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    );

-- Política para inventários - só veem inventários da sua loja
CREATE POLICY "Usuários veem apenas inventários da sua loja" ON inventarios
    FOR ALL USING (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    );

-- Política para itens de inventário - só veem itens de inventários da sua loja
CREATE POLICY "Usuários veem apenas itens de inventários da sua loja" ON itens_inventario
    FOR ALL USING (
        inventario_id IN (
            SELECT i.id FROM inventarios i
            JOIN usuarios u ON u.loja_id = i.loja_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- Política para produtos - só veem produtos da sua loja
CREATE POLICY "Usuários veem apenas produtos da sua loja" ON produtos
    FOR ALL USING (
        loja_id IN (
            SELECT loja_id FROM usuarios 
            WHERE auth_id = auth.uid()
        )
    );

-- Função para criar usuário automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (auth_id, nome, email, permissoes)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    ARRAY['visualizar', 'criar']
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar usuário automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
