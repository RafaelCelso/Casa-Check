import { supabase } from "./supabase";

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    name: string | null;
    email: string | null;
    tipo?: string | null;
  } | null;
}

export const commentsService = {
  async addComment(
    taskId: string,
    content: string,
    userId: string
  ): Promise<Comment | null> {
    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          task_id: taskId,
          content: content.trim(),
          user_id: userId,
        },
      ])
      .select(
        `
        id,
        content,
        created_at,
        user:user_id (
          name,
          email,
          tipo
        )
      `
      )
      .single();

    if (error) {
      console.error("Erro ao adicionar comentário:", error);
      return null;
    }

    return data as Comment;
  },

  async getCommentsByTaskId(taskId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        content,
        created_at,
        user:user_id (
          name,
          email,
          tipo
        )
      `
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar comentários:", error);
      return [];
    }

    return data as Comment[];
  },

  async updateComment(commentId: string, content: string): Promise<boolean> {
    const { error } = await supabase
      .from("comments")
      .update({ content: content.trim() })
      .eq("id", commentId);

    if (error) {
      console.error("Erro ao atualizar comentário:", error);
      return false;
    }

    return true;
  },

  async deleteComment(commentId: string): Promise<boolean> {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Erro ao deletar comentário:", error);
      return false;
    }

    return true;
  },
};
