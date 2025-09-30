-- Script para corrigir políticas RLS da tabela list_collaborators
-- Permite que criadores de listas vejam seus colaboradores

-- Primeiro, remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own collaborations" ON list_collaborators;
DROP POLICY IF EXISTS "List creators can view collaborators" ON list_collaborators;
DROP POLICY IF EXISTS "Collaborators can view list collaborators" ON list_collaborators;

-- Criar política para permitir que criadores de listas vejam seus colaboradores
CREATE POLICY "List creators can view their collaborators" ON list_collaborators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_lists 
      WHERE task_lists.id = list_collaborators.list_id 
      AND task_lists.creator_id = auth.uid()
    )
  );

-- Criar política para permitir que colaboradores vejam outros colaboradores da mesma lista
CREATE POLICY "Collaborators can view list collaborators" ON list_collaborators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM list_collaborators lc2
      WHERE lc2.list_id = list_collaborators.list_id
      AND lc2.user_id = auth.uid()
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
WHERE tablename = 'list_collaborators';
