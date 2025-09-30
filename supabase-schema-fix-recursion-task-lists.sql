-- Script para corrigir recursão infinita nas políticas RLS da tabela task_lists
-- O problema é que as políticas estão referenciando uma à outra criando um loop

-- Primeiro, remover todas as políticas problemáticas da tabela task_lists
DROP POLICY IF EXISTS "Users can view lists they own" ON task_lists;
DROP POLICY IF EXISTS "Users can view lists they collaborate on" ON task_lists;
DROP POLICY IF EXISTS "Users can view lists they are invited to" ON task_lists;
DROP POLICY IF EXISTS "Creators can view their own lists" ON task_lists;
DROP POLICY IF EXISTS "Collaborators can view lists they collaborate on" ON task_lists;
DROP POLICY IF EXISTS "Owners can view their task lists" ON task_lists;
DROP POLICY IF EXISTS "Collaborators can view task lists" ON task_lists;

-- Temporariamente desabilitar RLS para recriar as políticas
ALTER TABLE task_lists DISABLE ROW LEVEL SECURITY;

-- Recriar políticas simples e independentes
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;

-- Política 1: Criadores podem ver suas próprias listas
CREATE POLICY "task_lists_owners_select" ON task_lists
  FOR SELECT
  USING (auth.uid() = creator_id);

-- Política 2: Colaboradores podem ver listas onde colaboram
-- Usar uma abordagem mais simples para evitar recursão
CREATE POLICY "task_lists_collaborators_select" ON task_lists
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM list_collaborators 
      WHERE list_collaborators.list_id = task_lists.id 
      AND list_collaborators.user_id = auth.uid()
    )
  );

-- Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'task_lists'
ORDER BY policyname;
