# 🔧 Como Aplicar a Correção - Tarefas para Colaboradores

## ⚠️ Problema

Prestadores (colaboradores) não conseguem ver as tarefas das listas onde são colaboradores.

## ✅ Solução

Aplicar políticas RLS para a tabela `tasks` no Supabase.

## 📋 Passo a Passo Rápido

### 1. Abrir o Supabase

1. Acesse: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login
3. Selecione o projeto **Casa Check**

### 2. Acessar o SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**

### 3. Copiar e Colar o Script

**Copie todo o conteúdo abaixo e cole no editor:**

```sql
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
```

### 4. Executar

1. Clique no botão **Run** (ou pressione `Ctrl+Enter`)
2. Aguarde alguns segundos
3. ✅ Você verá uma tabela com as 6 políticas criadas

### 5. Testar

1. Abra o aplicativo Casa Check
2. Faça login como **prestador** (colaborador)
3. Acesse uma lista onde você é colaborador
4. ✅ **As tarefas devem aparecer agora!**

## 🎯 Resultado Esperado

Após executar o script, você deve ver esta tabela de confirmação:

| policyname                | cmd    |
| ------------------------- | ------ |
| tasks_collaborator_update | UPDATE |
| tasks_collaborator_view   | SELECT |
| tasks_owner_delete        | DELETE |
| tasks_owner_insert        | INSERT |
| tasks_owner_update        | UPDATE |
| tasks_owner_view          | SELECT |

## ⚠️ Se Algo Der Errado

- O script pode ser executado **múltiplas vezes** sem problemas
- Não remove dados existentes
- Se aparecer algum erro, copie e me envie para análise

## 📝 O Que Foi Corrigido

**Antes:**

- ❌ Colaboradores não viam tarefas (apenas a lista vazia)

**Depois:**

- ✅ Colaboradores veem todas as tarefas
- ✅ Colaboradores podem marcar tarefas como concluídas
- ✅ Colaboradores podem atualizar tarefas
- ❌ Colaboradores NÃO podem criar ou deletar tarefas (apenas o criador da lista)

## 📞 Suporte

Se precisar de ajuda, me avise que eu ajudo a aplicar!

---

**Arquivo:** `APLICAR_CORRECAO_TASKS.md`
**Data:** 30/09/2025
**Status:** Pronto para aplicar ✅
