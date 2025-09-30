-- Script para corrigir políticas RLS da tabela tasks
-- Permite que colaboradores vejam as tarefas das listas onde colaboram

-- Primeiro, verificar se RLS está habilitado
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver conflitos
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Creators can view tasks" ON tasks;
DROP POLICY IF EXISTS "Collaborators can view tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_owner_view" ON tasks;
DROP POLICY IF EXISTS "tasks_collaborator_view" ON tasks;

-- Política 1: Criadores de listas podem ver as tarefas de suas listas
CREATE POLICY "tasks_owner_view" ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
      AND tl.creator_id = auth.uid()
    )
  );

-- Política 2: Colaboradores podem ver as tarefas das listas onde colaboram
CREATE POLICY "tasks_collaborator_view" ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM list_collaborators lc
      WHERE lc.list_id = tasks.list_id
      AND lc.user_id = auth.uid()
    )
  );

-- Política 3: Criadores podem criar tarefas em suas listas
CREATE POLICY "tasks_owner_insert" ON tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
      AND tl.creator_id = auth.uid()
    )
  );

-- Política 4: Criadores podem atualizar tarefas de suas listas
CREATE POLICY "tasks_owner_update" ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
      AND tl.creator_id = auth.uid()
    )
  );

-- Política 5: Colaboradores podem atualizar tarefas (completar, marcar status)
CREATE POLICY "tasks_collaborator_update" ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM list_collaborators lc
      WHERE lc.list_id = tasks.list_id
      AND lc.user_id = auth.uid()
    )
  );

-- Política 6: Apenas criadores podem deletar tarefas
CREATE POLICY "tasks_owner_delete" ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
      AND tl.creator_id = auth.uid()
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
WHERE tablename = 'tasks'
ORDER BY policyname;
