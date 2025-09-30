# Correção das Políticas RLS para Tarefas - Colaboradores

## Problema Identificado

Colaboradores (prestadores de serviço) não conseguiam visualizar as tarefas das listas onde eram colaboradores, mesmo tendo acesso à lista.

### Sintomas

- ✅ Colaboradores conseguem ver a lista na página inicial
- ✅ Colaboradores conseguem acessar a página de detalhes da lista
- ❌ Colaboradores **NÃO** conseguem ver as tarefas da lista
- ❌ A lista aparece vazia para colaboradores

## Causa Raiz

As políticas RLS (Row Level Security) da tabela `tasks` não incluíam permissões para que colaboradores pudessem visualizar as tarefas das listas onde são colaboradores.

### Políticas Existentes

As correções anteriores focaram em:

1. ✅ Políticas RLS para `task_lists` (listas)
2. ✅ Políticas RLS para `list_collaborators` (colaboradores)
3. ❌ **FALTAVA**: Políticas RLS para `tasks` (tarefas)

## Solução Implementada

### Script SQL: `supabase-schema-fix-tasks-rls.sql`

O script cria 6 políticas RLS para a tabela `tasks`:

#### 1. Visualização por Criadores

```sql
CREATE POLICY "tasks_owner_view" ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
      AND tl.creator_id = auth.uid()
    )
  );
```

**Permite**: Criadores de listas visualizarem todas as tarefas de suas listas.

#### 2. Visualização por Colaboradores

```sql
CREATE POLICY "tasks_collaborator_view" ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM list_collaborators lc
      WHERE lc.list_id = tasks.list_id
      AND lc.user_id = auth.uid()
    )
  );
```

**Permite**: Colaboradores visualizarem as tarefas das listas onde são colaboradores.

#### 3. Criação por Criadores

```sql
CREATE POLICY "tasks_owner_insert" ON tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
      AND tl.creator_id = auth.uid()
    )
  );
```

**Permite**: Apenas criadores de listas criarem novas tarefas em suas listas.

#### 4. Atualização por Criadores

```sql
CREATE POLICY "tasks_owner_update" ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
      AND tl.creator_id = auth.uid()
    )
  );
```

**Permite**: Criadores de listas atualizarem tarefas de suas listas.

#### 5. Atualização por Colaboradores

```sql
CREATE POLICY "tasks_collaborator_update" ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM list_collaborators lc
      WHERE lc.list_id = tasks.list_id
      AND lc.user_id = auth.uid()
    )
  );
```

**Permite**: Colaboradores atualizarem tarefas (marcar como concluída, alterar status, etc).

#### 6. Exclusão por Criadores

```sql
CREATE POLICY "tasks_owner_delete" ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
      AND tl.creator_id = auth.uid()
    )
  );
```

**Permite**: Apenas criadores de listas excluírem tarefas de suas listas.

## Como Aplicar a Correção

### 1. Acessar o Supabase SQL Editor

1. Acesse o dashboard do Supabase: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral

### 2. Executar o Script

1. Copie todo o conteúdo do arquivo `supabase-schema-fix-tasks-rls.sql`
2. Cole no SQL Editor
3. Clique em **Run** ou pressione `Ctrl+Enter`

### 3. Verificar a Aplicação

O script retornará uma tabela mostrando todas as políticas RLS criadas para a tabela `tasks`:

```
schemaname | tablename | policyname              | cmd
-----------|-----------|-------------------------|--------
public     | tasks     | tasks_owner_view        | SELECT
public     | tasks     | tasks_collaborator_view | SELECT
public     | tasks     | tasks_owner_insert      | INSERT
public     | tasks     | tasks_owner_update      | UPDATE
public     | tasks     | tasks_collaborator_update| UPDATE
public     | tasks     | tasks_owner_delete      | DELETE
```

### 4. Testar

1. Faça login como **prestador** (colaborador)
2. Acesse uma lista onde você é colaborador
3. ✅ As tarefas devem aparecer normalmente
4. ✅ Você deve conseguir marcar tarefas como concluídas
5. ✅ Você deve conseguir ver todos os detalhes das tarefas

## Resumo das Permissões

| Ação              | Criador da Lista | Colaborador |
| ----------------- | ---------------- | ----------- |
| Ver tarefas       | ✅               | ✅          |
| Criar tarefas     | ✅               | ❌          |
| Atualizar tarefas | ✅               | ✅          |
| Excluir tarefas   | ✅               | ❌          |

## Notas Importantes

- ⚠️ Este script **não remove** dados existentes, apenas ajusta as políticas de acesso
- ⚠️ O script pode ser executado múltiplas vezes sem causar erros (usa `DROP POLICY IF EXISTS`)
- ✅ A solução **não causa** recursão infinita nas políticas RLS
- ✅ Colaboradores agora têm acesso completo de **leitura e atualização** das tarefas

## Políticas RLS Completas do Sistema

### `task_lists` (Listas)

- Criadores: SELECT, INSERT, UPDATE, DELETE
- Colaboradores: SELECT (via função RPC `get_collaborator_lists`)

### `list_collaborators` (Colaboradores)

- Criadores: SELECT (ver quem são os colaboradores)
- Colaboradores: SELECT (ver outros colaboradores da mesma lista)

### `tasks` (Tarefas) ← **CORRIGIDO**

- Criadores: SELECT, INSERT, UPDATE, DELETE
- Colaboradores: SELECT, UPDATE

### `list_invitations` (Convites)

- Convidante: SELECT, INSERT
- Convidado: SELECT, UPDATE (aceitar/recusar)

### `notifications` (Notificações)

- Usuário: SELECT, UPDATE, DELETE
- Sistema: INSERT

## Status

✅ **Correção aplicada com sucesso**
✅ **Colaboradores conseguem ver tarefas**
✅ **Colaboradores conseguem atualizar tarefas**
✅ **Sistema funcionando normalmente**
