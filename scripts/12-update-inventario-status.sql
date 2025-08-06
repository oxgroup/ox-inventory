-- Atualizar a restrição CHECK da coluna status em inventarios
-- Execute depois de aplicar o script 10-fix-auth-trigger.sql

ALTER TABLE inventarios
  DROP CONSTRAINT IF EXISTS inventarios_status_check;

ALTER TABLE inventarios
  ADD CONSTRAINT inventarios_status_check
  CHECK (
    status IN (
      'rascunho',
      'em_contagem',
      'finalizado',
      'conciliado'
    )
  );
