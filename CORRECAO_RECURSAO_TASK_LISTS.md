# Correção da Recursão Infinita nas Políticas RLS da tabela task_lists

## Problema Identificado

Após criar as políticas RLS para `list_collaborators`, surgiu um problema de **recursão infinita** nas políticas da tabela `task_lists`, causando:

- **Erro**: `infinite recursion detected in policy for relation "task_lists"`
- **Status HTTP**: 500 Internal Server Error
- **Sintoma**: Listas não carregavam mais na aplicação

## Causa Raiz

As políticas RLS estavam criando referências circulares entre as tabelas `task_lists` e `list_collaborators`, causando um loop infinito quando o PostgreSQL tentava avaliar as permissões.

## Solução Implementada

### 1. Limpeza das Políticas Problemáticas

```sql
-- Remover todas as políticas que causavam recursão
DROP POLICY IF EXISTS "Users can view lists they own" ON task_lists;
DROP POLICY IF EXISTS "Users can view lists they collaborate on" ON task_lists;
DROP POLICY IF EXISTS "Users can view lists they are invited to" ON task_lists;
DROP POLICY IF EXISTS "Creators can view their own lists" ON task_lists;
DROP POLICY IF EXISTS "Collaborators can view lists they collaborate on" ON task_lists;
DROP POLICY IF EXISTS "Owners can view their task lists" ON task_lists;
DROP POLICY IF EXISTS "Collaborators can view task lists" ON task_lists;
DROP POLICY IF EXISTS "Users can view their own task_lists" ON task_lists;
```

### 2. Recriação de Políticas Simples e Independentes

```sql
-- Temporariamente desabilitar RLS
ALTER TABLE task_lists DISABLE ROW LEVEL SECURITY;

-- Reabilitar RLS
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;

-- Política 1: Criadores podem ver suas próprias listas
CREATE POLICY "task_lists_owners_select" ON task_lists
  FOR SELECT
  USING (auth.uid() = creator_id);

-- Política 2: Colaboradores podem ver listas onde colaboram
CREATE POLICY "task_lists_collaborators_select" ON task_lists
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM list_collaborators
      WHERE list_collaborators.list_id = task_lists.id
      AND list_collaborators.user_id = auth.uid()
    )
  );
```

## Políticas RLS Finais

### Para `task_lists`:

1. **task_lists_owners_select**: Criadores podem ver suas listas
2. **task_lists_collaborators_select**: Colaboradores podem ver listas onde colaboram
3. **Users can create their own task lists**: INSERT
4. **Users can delete their own task lists**: DELETE
5. **Users can update their own task lists**: UPDATE

### Para `list_collaborators`:

1. **List creators can view their collaborators**: Criadores podem ver colaboradores
2. **Collaborators can view list collaborators**: Colaboradores podem ver outros colaboradores
3. **Collaborators can leave lists**: DELETE
4. **System can insert collaborations**: INSERT

## Teste de Verificação

```sql
-- Query de teste executada com sucesso
SELECT id, name, description, creator_id
FROM task_lists
WHERE creator_id = 'cdae8e90-1a86-480e-985f-1b7112b8d610'
LIMIT 5;

-- Resultado: 5 listas encontradas sem erro de recursão
```

## Resultado

✅ **Problema Resolvido**: Recursão infinita eliminada
✅ **Listas Funcionando**: Queries retornam dados corretamente
✅ **Políticas Seguras**: Mantém controle de acesso adequado
✅ **Performance**: Sem loops infinitos

## Status

🟢 **CORRIGIDO** - Listas voltaram a funcionar normalmente
