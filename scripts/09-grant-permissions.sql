-- Garantir permissões básicas para usuários autenticados

-- Dar permissões completas para a role authenticated
GRANT ALL ON TABLE lojas TO authenticated;
GRANT ALL ON TABLE usuarios TO authenticated;
GRANT ALL ON TABLE inventarios TO authenticated;
GRANT ALL ON TABLE itens_inventario TO authenticated;
GRANT ALL ON TABLE produtos TO authenticated;

-- Dar permissões para sequências se existirem
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verificar permissões
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name IN ('lojas', 'usuarios', 'inventarios', 'itens_inventario', 'produtos')
AND grantee = 'authenticated';
