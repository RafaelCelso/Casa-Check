import { supabase } from "./supabase";
import { TaskList, Task } from "@/types";

export const taskListsService = {
  // Buscar todas as listas do usuário logado (criadas ou onde é colaborador)
  async getUserTaskLists(userId: string): Promise<TaskList[]> {
    console.log("Buscando listas para usuário:", userId);

    // Buscar listas criadas pelo usuário
    const { data: createdLists, error: createdError } = await supabase
      .from("task_lists")
      .select(
        `
        *,
        tasks (
          id,
          title,
          status,
          priority,
          category,
          completed_at,
          completed_by,
          order_index
        ),
        service_provider:service_provider_id (
          id,
          name,
          email,
          phone,
          tipo
        )
      `
      )
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });

    if (createdError) {
      console.error("Erro ao buscar listas criadas:", createdError);
      throw createdError;
    }

    // Buscar IDs das listas onde o usuário é colaborador
    const { data: collaboratorData, error: collaboratorQueryError } =
      await supabase
        .from("list_collaborators")
        .select("list_id")
        .eq("user_id", userId);

    let collaboratorLists: TaskList[] = [];

    if (
      !collaboratorQueryError &&
      collaboratorData &&
      collaboratorData.length > 0
    ) {
      const collaboratorListIds = collaboratorData.map((c) => c.list_id);

      // Buscar as listas onde o usuário é colaborador usando RPC
      // Usar uma função que bypassa as políticas RLS para colaboradores
      const { data: collabLists, error: collaboratorError } =
        await supabase.rpc("get_collaborator_lists", {
          collaborator_user_id: userId,
          list_ids: collaboratorListIds,
        });

      if (collaboratorError) {
        console.error(
          "Erro ao buscar listas de colaboração:",
          collaboratorError
        );
      } else {
        collaboratorLists = collabLists || [];
      }
    }

    // Combinar as listas, removendo duplicatas
    const allLists = [...(createdLists || [])];

    if (collaboratorLists) {
      collaboratorLists.forEach((list) => {
        if (!allLists.find((existingList) => existingList.id === list.id)) {
          allLists.push(list);
        }
      });
    }

    // Ordenar por data de criação (mais recentes primeiro)
    allLists.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log("Listas retornadas:", allLists);
    return allLists;
  },

  // Buscar uma lista específica com suas tarefas
  // Se o usuário não for o criador e for colaborador, faz fallback via RPC e busca de tarefas direta
  async getTaskListById(
    listId: string,
    currentUserId?: string
  ): Promise<TaskList | null> {
    console.log("Buscando lista com ID:", listId, "Tamanho:", listId.length);

    try {
      if (listId.length < 36) {
        // ID parcial - tentar buscar todas as listas visíveis e filtrar no JS
        console.log("Usando busca parcial - buscando todas as listas");
        const { data: allLists, error: allListsError } = await supabase
          .from("task_lists")
          .select(
            `
            *,
            tasks (
              id,
              title,
              description,
              status,
              priority,
              category,
              assigned_to,
              completed_at,
              completed_by,
              order_index,
              images,
              created_at,
              updated_at
            ),
            service_provider:service_provider_id (
              id,
              name,
              email,
              phone,
              tipo
            )
          `
          );

        // Se não houver erro mas não encontrou (possível colaborador sem acesso a task_lists), fazer fallback
        if (!allListsError) {
          const matchingList = allLists?.find((list) =>
            list.id.startsWith(listId)
          );
          if (matchingList) {
            console.log("Lista encontrada com busca parcial:", matchingList);
            return matchingList as TaskList;
          }
        }

        // Fallback colaborador com ID parcial
        if (currentUserId) {
          console.warn(
            "Busca parcial não encontrou lista visível. Tentando fallback por colaboração..."
          );

          // Buscar IDs de listas em que o usuário colabora
          const { data: collabListsIds, error: collabIdsError } = await supabase
            .from("list_collaborators")
            .select("list_id")
            .eq("user_id", currentUserId);

          if (collabIdsError) {
            console.error(
              "Erro ao buscar listas de colaboração para fallback:",
              collabIdsError
            );
            return null;
          }

          const possible = (collabListsIds || []).find((row: any) =>
            String(row.list_id).startsWith(listId)
          );

          if (!possible) {
            console.warn("Nenhuma lista de colaboração bate com o ID parcial");
            return null;
          }

          const fullListId = possible.list_id as string;

          // Buscar base da lista via RPC
          const { data: rpcLists, error: rpcError } = await supabase.rpc(
            "get_collaborator_lists",
            {
              collaborator_user_id: currentUserId,
              list_ids: [fullListId],
            }
          );

          if (rpcError) {
            console.error("Erro no RPC get_collaborator_lists:", rpcError);
            return null;
          }

          const baseList = (rpcLists || []).find(
            (l: any) => l.id === fullListId
          );
          if (!baseList) {
            console.warn("RPC não retornou a lista requisitada (parcial)");
            return null;
          }

          // Buscar tarefas diretamente
          const { data: tasksData, error: tasksError } = await supabase
            .from("tasks")
            .select(
              `
              id,
              title,
              description,
              status,
              priority,
              category,
              assigned_to,
              completed_at,
              completed_by,
              order_index,
              images,
              created_at,
              updated_at
            `
            )
            .eq("list_id", fullListId)
            .order("order_index", { ascending: true });

          if (tasksError) {
            console.error(
              "Erro ao buscar tasks da lista via fallback (parcial):",
              tasksError
            );
            return null;
          }

          const listWithTasks: TaskList = {
            ...(baseList as TaskList),
            tasks: (tasksData || []) as unknown as Task[],
          } as TaskList;

          return listWithTasks;
        }

        if (allListsError) {
          console.error("Erro ao buscar todas as listas:", allListsError);
        }
        console.log("Nenhuma lista encontrada com ID parcial:", listId);
        return null;
      } else {
        // UUID completo - busca direta
        console.log("Usando busca exata com eq");
        const { data, error } = await supabase
          .from("task_lists")
          .select(
            `
            *,
            tasks (
              id,
              title,
              description,
              status,
              priority,
              category,
              assigned_to,
              completed_at,
              completed_by,
              order_index,
              images,
              created_at,
              updated_at
            ),
            service_provider:service_provider_id (
              id,
              name,
              email,
              phone,
              tipo
            )
          `
          )
          .eq("id", listId)
          .single();

        if (!error && data) {
          console.log("Lista encontrada:", data);
          return data;
        }

        // Fallback para colaborador: não conseguiu selecionar task_lists diretamente (RLS do owner)
        if (currentUserId) {
          console.warn(
            "Falha ao buscar lista diretamente. Tentando fallback para colaborador...",
            { error }
          );

          // Verificar se o usuário é colaborador da lista
          const { data: isCollabRows, error: collabCheckError } = await supabase
            .from("list_collaborators")
            .select("list_id")
            .eq("list_id", listId)
            .eq("user_id", currentUserId);

          if (collabCheckError) {
            console.error("Erro ao verificar colaboração:", collabCheckError);
            return null;
          }

          const isCollaborator = Boolean(
            isCollabRows && isCollabRows.length > 0
          );
          if (!isCollaborator) {
            console.warn("Usuário não é colaborador desta lista");
            return null;
          }

          // Buscar dados básicos da lista via RPC que bypassa RLS
          const { data: rpcLists, error: rpcError } = await supabase.rpc(
            "get_collaborator_lists",
            {
              collaborator_user_id: currentUserId,
              list_ids: [listId],
            }
          );

          if (rpcError) {
            console.error("Erro no RPC get_collaborator_lists:", rpcError);
            return null;
          }

          const baseList = (rpcLists || []).find((l: any) => l.id === listId);
          if (!baseList) {
            console.warn("RPC não retornou a lista requisitada");
            return null;
          }

          // Buscar tarefas diretamente (colaborador tem SELECT em tasks por RLS)
          const { data: tasksData, error: tasksError } = await supabase
            .from("tasks")
            .select(
              `
              id,
              title,
              description,
              status,
              priority,
              category,
              assigned_to,
              completed_at,
              completed_by,
              order_index,
              images,
              created_at,
              updated_at
            `
            )
            .eq("list_id", listId)
            .order("order_index", { ascending: true });

          if (tasksError) {
            console.error(
              "Erro ao buscar tasks da lista via fallback:",
              tasksError
            );
            return null;
          }

          const listWithTasks: TaskList = {
            ...(baseList as TaskList),
            tasks: (tasksData || []) as unknown as Task[],
          } as TaskList;

          return listWithTasks;
        }

        console.error("Erro ao buscar lista:", error);
        console.error("Detalhes do erro:", JSON.stringify(error, null, 2));
        return null;
      }
    } catch (error) {
      console.error("Erro inesperado ao buscar lista:", error);
      return null;
    }
  },

  // Criar uma nova lista
  async createTaskList(listData: {
    name: string;
    description?: string;
    creator_id: string;
    category?: string;
    service_provider_id?: string;
  }): Promise<TaskList> {
    const { data, error } = await supabase
      .from("task_lists")
      .insert([listData])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar lista:", error);
      throw error;
    }

    return data;
  },

  // Atualizar uma lista
  async updateTaskList(
    listId: string,
    updates: {
      name?: string;
      description?: string;
      is_favorite?: boolean;
      category?: string;
      service_provider_id?: string;
    }
  ): Promise<TaskList> {
    try {
      if (listId.length < 36) {
        // ID parcial - buscar todas as listas e encontrar o ID completo
        console.log(
          "Usando busca parcial para atualização - buscando todas as listas"
        );
        const { data: allLists, error: allListsError } = await supabase
          .from("task_lists")
          .select("id");

        if (allListsError) {
          console.error("Erro ao buscar todas as listas:", allListsError);
          throw allListsError;
        }

        // Filtrar no JavaScript para encontrar o ID completo
        const matchingList = allLists?.find((list) =>
          list.id.startsWith(listId)
        );

        if (!matchingList) {
          throw new Error("Lista não encontrada com ID parcial: " + listId);
        }

        const fullListId = matchingList.id;
        console.log("ID completo encontrado:", fullListId);

        // Atualizar usando o ID completo
        const { data, error } = await supabase
          .from("task_lists")
          .update(updates)
          .eq("id", fullListId)
          .select()
          .single();

        if (error) {
          console.error("Erro ao atualizar lista:", error);
          throw error;
        }

        return data;
      } else {
        // UUID completo - atualização direta
        console.log("Usando atualização direta com UUID completo");
        const { data, error } = await supabase
          .from("task_lists")
          .update(updates)
          .eq("id", listId)
          .select()
          .single();

        if (error) {
          console.error("Erro ao atualizar lista:", error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error("Erro inesperado ao atualizar lista:", error);
      throw error;
    }
  },

  // Deletar uma lista
  async deleteTaskList(listId: string): Promise<void> {
    const { error } = await supabase
      .from("task_lists")
      .delete()
      .eq("id", listId);

    if (error) {
      console.error("Erro ao deletar lista:", error);
      throw error;
    }
  },

  // Alternar favorito de uma lista
  async toggleFavorite(listId: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from("task_lists")
      .update({ is_favorite: isFavorite })
      .eq("id", listId);

    if (error) {
      console.error("Erro ao alternar favorito:", error);
      throw error;
    }
  },

  // Calcular progresso de uma lista
  calculateProgress(tasks: Task[]): number {
    if (!tasks || tasks.length === 0) return 0;

    const completedTasks = tasks.filter(
      (task) => task.status === "concluida"
    ).length;
    return Math.round((completedTasks / tasks.length) * 100);
  },

  // Buscar listas favoritas
  async getFavoriteTaskLists(userId: string): Promise<TaskList[]> {
    const { data, error } = await supabase
      .from("task_lists")
      .select(
        `
        *,
        tasks (
          id,
          title,
          status,
          priority,
          category,
          completed_at,
          completed_by,
          order_index
        )
      `
      )
      .eq("creator_id", userId)
      .eq("is_favorite", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar listas favoritas:", error);
      throw error;
    }

    return data || [];
  },
};
