# Como Aplicar a Correção do Banco de Dados

## Problema

O sistema estava impedindo o reenvio de convites recusados devido a uma constraint única que não permitia múltiplos convites para a mesma lista e usuário.

## Solução

Executar o script SQL que remove a constraint restritiva e cria uma nova constraint que permite múltiplos convites recusados/expirados, mas apenas um convite ativo (pending ou accepted) por vez.

## Passos para Aplicar

### 1. Acesse o Supabase Dashboard

- Vá para https://supabase.com/dashboard
- Selecione seu projeto Casa Check

### 2. Abra o SQL Editor

- No menu lateral, clique em "SQL Editor"

### 3. Execute o Script

Copie e cole o seguinte código SQL:

```sql
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
```

### 4. Clique em "Run" para executar

### 5. Verificar se funcionou

Após executar, você deve ver uma mensagem de sucesso. A partir de agora:

- ✅ Convites recusados podem ser reenviados
- ✅ Convites expirados podem ser reenviados
- ❌ Não é possível ter múltiplos convites pendentes
- ❌ Não é possível ter múltiplos convites aceitos

## Testando

Após aplicar a correção, teste:

1. Envie um convite para um prestador
2. Faça o prestador recusar o convite
3. Tente enviar um novo convite para o mesmo prestador na mesma lista
4. ✅ Deve funcionar sem erros!
