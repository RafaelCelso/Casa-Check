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
  async getTaskListById(listId: string): Promise<TaskList | null> {
    console.log("Buscando lista com ID:", listId, "Tamanho:", listId.length);

    try {
      // Primeiro, tentar busca direta (funciona para criadores)
      console.log("Tentando busca direta primeiro");
      const { data: directResult, error: directError } = await supabase
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

      if (!directError && directResult) {
        console.log("Lista encontrada com busca direta:", directResult);
        return directResult;
      }

      // Se não encontrou com busca direta, pode ser colaborador
      console.log("Busca direta falhou, tentando como colaborador");

      // Buscar IDs das listas onde o usuário é colaborador
      const { data: collaboratorData, error: collaboratorQueryError } =
        await supabase
          .from("list_collaborators")
          .select("list_id")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

      if (
        collaboratorQueryError ||
        !collaboratorData ||
        collaboratorData.length === 0
      ) {
        console.log("Usuário não é colaborador de nenhuma lista");
        return null;
      }

      const collaboratorListIds = collaboratorData.map((c) => c.list_id);

      // Se ID é parcial, buscar todas as listas de colaboração e filtrar
      if (listId.length < 36) {
        console.log("ID parcial - buscando listas de colaboração");
        const { data: collabLists, error: collaboratorError } =
          await supabase.rpc("get_collaborator_lists", {
            collaborator_user_id: (await supabase.auth.getUser()).data.user?.id,
            list_ids: collaboratorListIds,
          });

        if (collaboratorError) {
          console.error(
            "Erro ao buscar listas de colaboração:",
            collaboratorError
          );
          return null;
        }

        // Filtrar no JavaScript
        const matchingList = collabLists?.find((list: any) =>
          list.id.startsWith(listId)
        );

        if (!matchingList) {
          console.log("Nenhuma lista encontrada com ID parcial:", listId);
          return null;
        }

        // Buscar tarefas da lista encontrada
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("list_id", matchingList.id)
          .order("order_index");

        if (tasksError) {
          console.error("Erro ao buscar tarefas:", tasksError);
          return null;
        }

        const listWithTasks = {
          ...matchingList,
          tasks: tasksData || [],
        };

        console.log(
          "Lista encontrada com busca parcial de colaboração:",
          listWithTasks
        );
        return listWithTasks;
      } else {
        // ID completo - verificar se está nas listas de colaboração
        if (collaboratorListIds.includes(listId)) {
          console.log("ID completo encontrado nas listas de colaboração");

          // Buscar dados da lista usando RPC
          const { data: collabLists, error: collaboratorError } =
            await supabase.rpc("get_collaborator_lists", {
              collaborator_user_id: (
                await supabase.auth.getUser()
              ).data.user?.id,
              list_ids: [listId],
            });

          if (collaboratorError || !collabLists || collabLists.length === 0) {
            console.error(
              "Erro ao buscar lista de colaboração:",
              collaboratorError
            );
            return null;
          }

          // Buscar tarefas da lista
          const { data: tasksData, error: tasksError } = await supabase
            .from("tasks")
            .select("*")
            .eq("list_id", listId)
            .order("order_index");

          if (tasksError) {
            console.error("Erro ao buscar tarefas:", tasksError);
            return null;
          }

          const listWithTasks = {
            ...collabLists[0],
            tasks: tasksData || [],
          };

          console.log(
            "Lista encontrada com busca completa de colaboração:",
            listWithTasks
          );
          return listWithTasks;
        } else {
          console.log("ID completo não encontrado nas listas de colaboração");
          return null;
        }
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
