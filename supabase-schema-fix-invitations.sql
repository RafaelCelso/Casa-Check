-- Script para corrigir a constraint de convites duplicados
-- Permite múltiplos convites para a mesma lista e usuário

-- Remover a constraint única existente
ALTER TABLE public.list_invitations DROP CONSTRAINT IF EXISTS list_invitations_list_id_invitee_id_key;

-- Criar uma constraint única apenas para convites pendentes e aceitos
-- Isso permite múltiplos convites recusados ou expirados, mas apenas um ativo
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS list_invitations_active_unique 
ON public.list_invitations (list_id, invitee_id) 
WHERE status IN ('pending', 'accepted');

-- Comentário explicativo
COMMENT ON INDEX list_invitations_active_unique IS 'Permite apenas um convite ativo (pending ou accepted) por lista e usuário, mas múltiplos convites recusados/expirados';
