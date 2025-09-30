-- Tabela para convites de lista
CREATE TABLE public.list_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.task_lists(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES public.user(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES public.user(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(list_id, invitee_id)
);

-- Tabela para notificações
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('invitation', 'task_assigned', 'task_completed', 'task_updated', 'list_shared')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  related_id UUID, -- ID relacionado (ex: list_id, task_id, invitation_id)
  related_type TEXT -- Tipo do relacionamento (ex: 'list', 'task', 'invitation')
);

-- Habilitar RLS
ALTER TABLE public.list_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para list_invitations
CREATE POLICY "Users can view invitations sent to them" ON public.list_invitations
  FOR SELECT USING (auth.uid() = invitee_id);

CREATE POLICY "Users can view invitations they sent" ON public.list_invitations
  FOR SELECT USING (auth.uid() = inviter_id);

CREATE POLICY "Users can create invitations" ON public.list_invitations
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitees can update their invitations" ON public.list_invitations
  FOR UPDATE USING (auth.uid() = invitee_id AND status = 'pending');

-- Políticas para notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_list_invitations_invitee_id ON public.list_invitations(invitee_id);
CREATE INDEX idx_list_invitations_status ON public.list_invitations(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Função para criar notificação quando convite é enviado
CREATE OR REPLACE FUNCTION create_invitation_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, data)
  VALUES (
    NEW.invitee_id,
    'invitation',
    'Novo convite para lista',
    'Você foi convidado para colaborar em uma lista de tarefas',
    NEW.id,
    'invitation',
    jsonb_build_object(
      'list_id', NEW.list_id,
      'inviter_id', NEW.inviter_id,
      'list_name', (SELECT name FROM public.task_lists WHERE id = NEW.list_id)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar notificação automaticamente
CREATE TRIGGER trigger_create_invitation_notification
  AFTER INSERT ON public.list_invitations
  FOR EACH ROW
  EXECUTE FUNCTION create_invitation_notification();

-- Função para atualizar convites expirados
CREATE OR REPLACE FUNCTION update_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.list_invitations 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para aceitar convite
CREATE OR REPLACE FUNCTION accept_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Buscar o convite
  SELECT * INTO invitation_record 
  FROM public.list_invitations 
  WHERE id = invitation_id AND status = 'pending' AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Atualizar status do convite
  UPDATE public.list_invitations 
  SET status = 'accepted', updated_at = NOW()
  WHERE id = invitation_id;
  
  -- Adicionar como colaborador
  INSERT INTO public.list_collaborators (list_id, user_id, role)
  VALUES (invitation_record.list_id, invitation_record.invitee_id, 'collaborator')
  ON CONFLICT (list_id, user_id) DO NOTHING;
  
  -- Criar notificação para o convidante
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, data)
  VALUES (
    invitation_record.inviter_id,
    'invitation',
    'Convite aceito',
    'Seu convite foi aceito',
    invitation_id,
    'invitation',
    jsonb_build_object(
      'list_id', invitation_record.list_id,
      'invitee_id', invitation_record.invitee_id
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para recusar convite
CREATE OR REPLACE FUNCTION decline_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Buscar o convite
  SELECT * INTO invitation_record 
  FROM public.list_invitations 
  WHERE id = invitation_id AND status = 'pending' AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Atualizar status do convite
  UPDATE public.list_invitations 
  SET status = 'declined', updated_at = NOW()
  WHERE id = invitation_id;
  
  -- Criar notificação para o convidante
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, data)
  VALUES (
    invitation_record.inviter_id,
    'invitation',
    'Convite recusado',
    'Seu convite foi recusado',
    invitation_id,
    'invitation',
    jsonb_build_object(
      'list_id', invitation_record.list_id,
      'invitee_id', invitation_record.invitee_id
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
