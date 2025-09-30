# Funcionalidade: Sair da Lista

## Resumo

Implementada funcionalidade para permitir que usuários do tipo 'prestador' saiam de listas de tarefas onde são colaboradores, com notificação automática para o dono da lista.

## Funcionalidades Implementadas

### 1. ✅ Menu Contextual Diferenciado

- **Para Criadores da Lista**: Menu mostra "Editar Lista" e "Excluir"
- **Para Colaboradores**: Menu mostra apenas "Sair da Lista"
- **Identificação**: Baseada na comparação `currentUserId === taskList.creator_id`

### 2. ✅ Modal de Confirmação

- **Design**: Modal elegante com ícone de LogOut em laranja
- **Mensagem**: Confirma a ação e informa que o criador será notificado
- **Botões**: "Cancelar" e "Sair da Lista"
- **Estado de Loading**: Mostra "Saindo..." durante o processo

### 3. ✅ Funcionalidade Backend

- **Função**: `invitationsService.leaveList(listId, userId)`
- **Ações Executadas**:
  1. Busca informações da lista (nome, creator_id)
  2. Busca informações do usuário (nome, email)
  3. Remove registro da tabela `list_collaborators`
  4. Cria notificação para o criador da lista
  5. Retorna sucesso/erro

### 4. ✅ Sistema de Notificações

- **Destinatário**: Criador da lista
- **Título**: "Colaborador saiu da lista"
- **Mensagem**: "{Nome do Prestador} saiu da lista '{Nome da Lista}'"
- **Tipo**: "list_shared"
- **Dados**: Inclui informações do usuário e ação realizada

### 5. ✅ Integração com Interface

- **Atualização Automática**: Lista removida da interface do prestador
- **Props Adicionais**: `onLeaveList` e `currentUserId` no TaskListCard
- **Recarregamento**: Chama `refetch()` após sair da lista

## Arquivos Modificados

### 1. `src/components/task/task-list-card.tsx`

- **Novos Props**: `onLeaveList?`, `currentUserId?`
- **Menu Condicional**: Diferentes opções para criador vs colaborador
- **Modal de Confirmação**: Para sair da lista
- **Ícones**: Adicionado `LogOut` do lucide-react

### 2. `src/app/inicio/page.tsx`

- **Nova Função**: `handleLeaveList(listId: string)`
- **Props Passados**: `onLeaveList={handleLeaveList}`, `currentUserId={user?.id}`
- **Integração**: Com serviço de convites e recarregamento de listas

### 3. `src/lib/invitations.ts`

- **Nova Função**: `leaveList(listId: string, userId: string)`
- **Operações**: Remoção do colaborador e criação de notificação
- **Error Handling**: Tratamento completo de erros

## Fluxo de Funcionamento

### Para Prestador:

1. **Visualiza Lista**: Vê listas onde é colaborador
2. **Clica no Menu**: Vê apenas opção "Sair da Lista"
3. **Confirma Ação**: Modal de confirmação aparece
4. **Processa Saída**: Sistema remove da tabela `list_collaborators`
5. **Atualiza Interface**: Lista desaparece da sua visualização

### Para Criador da Lista:

1. **Recebe Notificação**: Automática quando prestador sai
2. **Visualiza Detalhes**: Nome do prestador e lista afetada
3. **Mantém Acesso**: Lista permanece no seu painel

## Tabelas Afetadas

### `list_collaborators`

- **Operação**: DELETE
- **Condições**: `list_id = ? AND user_id = ?`
- **Resultado**: Remove associação entre usuário e lista

### `notifications`

- **Operação**: INSERT
- **Dados**: Notificação para o criador da lista
- **Tipo**: "list_shared" com action "left"

## Segurança e Validações

### ✅ Validações Implementadas:

- Verificação de autenticação do usuário
- Validação de existência da lista
- Validação de existência do usuário
- Verificação de permissões (apenas colaboradores podem sair)

### ✅ Error Handling:

- Tratamento de erros de banco de dados
- Logs detalhados para debug
- Mensagens de erro informativas
- Rollback automático em caso de falha

## Testes Recomendados

### Cenário 1: Prestador Sai da Lista

1. Login como prestador
2. Visualizar lista onde é colaborador
3. Clicar no menu → "Sair da Lista"
4. Confirmar no modal
5. ✅ Lista deve desaparecer
6. ✅ Criador deve receber notificação

### Cenário 2: Criador Visualiza Menu

1. Login como criador da lista
2. Visualizar suas listas
3. Clicar no menu
4. ✅ Deve ver "Editar Lista" e "Excluir"

### Cenário 3: Notificação do Criador

1. Prestador sai de uma lista
2. Login como criador da lista
3. Verificar notificações
4. ✅ Deve aparecer notificação de saída

## Status: ✅ IMPLEMENTADO E FUNCIONAL

Todas as funcionalidades foram implementadas e estão prontas para uso em produção.
