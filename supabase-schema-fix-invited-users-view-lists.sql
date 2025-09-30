-- Script para permitir que usuários com convites pendentes vejam os dados das listas
-- O problema é que usuários convidados (não colaboradores ainda) não conseguem ver os dados das listas

-- Adicionar política para usuários com convites pendentes
CREATE POLICY "task_lists_invited_users_view" ON task_lists
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM list_invitations li
      WHERE li.list_id = task_lists.id
      AND li.invitee_id = auth.uid()
      AND li.status = 'pending'
      AND li.expires_at > NOW()
    )
  );

-- Verificar se a política foi criada
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
