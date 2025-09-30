# Correção das Políticas RLS para list_collaborators

## Problema Identificado

O usuário contratante não conseguia visualizar os colaboradores de suas próprias listas devido a políticas RLS (Row Level Security) inadequadas na tabela `list_collaborators`.

## Erro Encontrado

- **Erro**: `invalid input syntax for type uuid` (corrigido anteriormente)
- **Problema Principal**: Políticas RLS não permitiam que criadores de listas visualizassem seus colaboradores
- **Sintoma**: Query retornava array vazio `[]` mesmo com colaboradores existentes no banco

## Solução Implementada

### Script SQL Aplicado

```sql
-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own collaborations" ON list_collaborators;
DROP POLICY IF EXISTS "List creators can view collaborators" ON list_collaborators;
DROP POLICY IF EXISTS "Collaborators can view list collaborators" ON list_collaborators;

-- Política para criadores de listas
CREATE POLICY "List creators can view their collaborators" ON list_collaborators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_lists
      WHERE task_lists.id = list_collaborators.list_id
      AND task_lists.creator_id = auth.uid()
    )
  );

-- Política para colaboradores
CREATE POLICY "Collaborators can view list collaborators" ON list_collaborators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM list_collaborators lc2
      WHERE lc2.list_id = list_collaborators.list_id
      AND lc2.user_id = auth.uid()
    )
  );
```

### Políticas RLS Criadas

#### 1. **List creators can view their collaborators**

- **Permissão**: SELECT
- **Condição**: Usuário é criador da lista
- **Lógica**: Verifica se `task_lists.creator_id = auth.uid()`

#### 2. **Collaborators can view list collaborators**

- **Permissão**: SELECT
- **Condição**: Usuário é colaborador da lista
- **Lógica**: Verifica se existe colaboração em `list_collaborators`

## Resultado

✅ **Problema Resolvido**: Agora os contratantes podem visualizar os colaboradores de suas listas
✅ **Query Funcionando**: Teste confirmou retorno de dados do colaborador
✅ **Políticas Seguras**: Mantém segurança com permissões adequadas

## Teste de Verificação

```sql
-- Query de teste executada com sucesso
SELECT
  lc.user_id,
  lc.created_at,
  u.name,
  u.email,
  u.phone,
  u.avatar_url
FROM list_collaborators lc
JOIN "user" u ON u.id = lc.user_id
WHERE lc.list_id = '06791bb5-3563-47eb-8bf2-af9e7e735ac8';

-- Resultado: 1 colaborador encontrado
-- user_id: c723857a-3a50-45ba-8187-38a2b6f73ab5
-- name: Prestador
-- email: teste1@email.com
```

## Status

🟢 **CORRIGIDO** - Colaboradores agora aparecem para contratantes
