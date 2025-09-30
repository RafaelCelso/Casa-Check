import { supabase } from "./supabase";

export type DbTaskWithRelations = {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  category:
    | "limpeza-geral"
    | "cozinha"
    | "banheiro"
    | "quartos"
    | "area-externa"
    | "organizacao"
    | "manutencao"
    | "personalizada";
  priority: "baixa" | "media" | "alta";
  status: "pendente" | "em-andamento" | "concluida";
  assigned_to: string | null;
  completed_at: string | null;
  completed_by: string | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
  comments?: Array<{
    id: string;
    content: string;
    created_at: string;
    user: {
      name: string | null;
      email: string | null;
      tipo?: string | null;
    } | null;
  }>;
};

export const tasksService = {
  async getTaskById(taskId: string): Promise<DbTaskWithRelations | null> {
    console.log("Buscando tarefa com ID:", taskId, "Tamanho:", taskId.length);

    try {
      if (taskId.length < 36) {
        // ID parcial - buscar todas as tarefas e filtrar no JavaScript
        console.log(
          "Usando busca parcial para tarefa - buscando todas as tarefas"
        );
        const { data: allTasks, error: allTasksError } = await supabase
          .from("tasks")
          .select(
            `
            *,
            comments:comments (
              id,
              content,
              created_at,
              user:user_id ( name, email, tipo )
            )
          `
          );

        if (allTasksError) {
          console.error("Erro ao buscar todas as tarefas:", allTasksError);
          return null;
        }

        // Filtrar no JavaScript
        const matchingTask = allTasks?.find((task) =>
          task.id.startsWith(taskId)
        );

        if (!matchingTask) {
          console.log("Nenhuma tarefa encontrada com ID parcial:", taskId);
          return null;
        }

        console.log("Tarefa encontrada com busca parcial:", matchingTask);
        return matchingTask as unknown as DbTaskWithRelations;
      } else {
        // UUID completo - busca direta
        console.log("Usando busca exata para tarefa");
        const { data, error } = await supabase
          .from("tasks")
          .select(
            `
            *,
            comments:comments (
              id,
              content,
              created_at,
              user:user_id ( name, email, tipo )
            )
          `
          )
          .eq("id", taskId)
          .single();

        if (error) {
          console.error("Erro ao buscar tarefa:", error);
          return null;
        }

        console.log("Tarefa encontrada:", data);
        return (data as unknown as DbTaskWithRelations) || null;
      }
    } catch (error) {
      console.error("Erro inesperado ao buscar tarefa:", error);
      return null;
    }
  },

  async updateTaskStatus(
    taskId: string,
    status: "pendente" | "em-andamento" | "concluida",
    completedBy?: string
  ): Promise<boolean> {
    const updateData: any = { status };

    if (status === "concluida") {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = completedBy;
    } else {
      updateData.completed_at = null;
      updateData.completed_by = null;
    }

    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId);

    if (error) {
      console.error("Erro ao atualizar status da tarefa:", error);
      return false;
    }
    return true;
  },

  async updateTaskOrder(
    taskId: string,
    newOrderIndex: number
  ): Promise<boolean> {
    const { error } = await supabase
      .from("tasks")
      .update({ order_index: newOrderIndex })
      .eq("id", taskId);

    if (error) {
      console.error("Erro ao atualizar ordem da tarefa:", error);
      return false;
    }
    return true;
  },

  async updateMultipleTaskOrders(
    updates: Array<{ id: string; order_index: number }>
  ): Promise<boolean> {
    try {
      // Usar Promise.all para atualizar todas as tarefas em paralelo
      const promises = updates.map(({ id, order_index }) =>
        supabase.from("tasks").update({ order_index }).eq("id", id)
      );

      const results = await Promise.all(promises);

      // Verificar se houve algum erro
      const hasError = results.some((result) => result.error);

      if (hasError) {
        console.error("Erro ao atualizar ordens das tarefas:", results);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro inesperado ao atualizar ordens:", error);
      return false;
    }
  },

  async createTask(taskData: {
    list_id: string;
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    order_index?: number;
  }): Promise<{ id: string } | null> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            list_id: taskData.list_id,
            title: taskData.title,
            description: taskData.description || null,
            category: taskData.category || "limpeza-geral",
            priority: taskData.priority || "media",
            status: "pendente",
            order_index: taskData.order_index || 0,
            assigned_to: null,
            completed_at: null,
            completed_by: null,
            images: null,
          },
        ])
        .select("id")
        .single();

      if (error) {
        console.error("Erro ao criar tarefa:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Erro inesperado ao criar tarefa:", error);
      return null;
    }
  },

  async getTasksByListId(listId: string): Promise<Array<{ id: string }>> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("id")
        .eq("list_id", listId)
        .order("order_index");

      if (error) {
        console.error("Erro ao buscar tarefas da lista:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Erro inesperado ao buscar tarefas:", error);
      return [];
    }
  },
};
