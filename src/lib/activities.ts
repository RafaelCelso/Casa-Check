import { supabase } from "./supabase";

export type ActivityType =
  | "list_created"
  | "task_completed"
  | "task_created"
  | "rating_given"
  | "comment_added"
  | "list_shared"
  | "task_assigned";

export type Activity = {
  id: string;
  type: ActivityType;
  message: string;
  time: string;
  created_at: string;
  related_id?: string;
  related_type?: string;
  data?: any;
};

export const activitiesService = {
  async getRecentActivities(
    userId: string,
    limit: number = 10
  ): Promise<Activity[]> {
    const activities: Activity[] = [];

    try {
      // 1. Buscar listas criadas recentemente pelo usuário
      const { data: recentLists, error: listsError } = await supabase
        .from("task_lists")
        .select("id, name, created_at")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!listsError && recentLists) {
        recentLists.forEach((list) => {
          activities.push({
            id: `list_${list.id}`,
            type: "list_created",
            message: `Lista "${list.name}" foi criada`,
            time: this.formatTimeAgo(list.created_at),
            created_at: list.created_at,
            related_id: list.id,
            related_type: "list",
            data: { list_name: list.name },
          });
        });
      }

      // 2. Buscar tarefas concluídas recentemente
      const { data: completedTasks, error: tasksError } = await supabase
        .from("tasks")
        .select(
          `
           id,
           title,
           completed_at,
           completed_by,
           task_lists!inner (
             id,
             name,
             creator_id
           )
         `
        )
        .eq("status", "concluida")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(limit);

      if (!tasksError && completedTasks) {
        completedTasks.forEach((task: any) => {
          // Verificar se o usuário é criador da lista ou foi quem completou a tarefa
          if (
            task.task_lists?.creator_id === userId ||
            task.completed_by === userId
          ) {
            activities.push({
              id: `task_completed_${task.id}`,
              type: "task_completed",
              message: `Tarefa "${task.title}" foi concluída na lista "${task.task_lists?.name}"`,
              time: this.formatTimeAgo(task.completed_at),
              created_at: task.completed_at,
              related_id: task.id,
              related_type: "task",
              data: {
                task_title: task.title,
                list_name: task.task_lists?.name,
              },
            });
          }
        });
      }

      // 3. Buscar avaliações dadas pelo usuário
      const { data: recentRatings, error: ratingsError } = await supabase
        .from("ratings")
        .select(
          `
           id,
           rating,
           created_at,
           rated_user:rated_user_id (
             name,
             email
           ),
           task_lists!inner (
             name
           )
         `
        )
        .eq("rater_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!ratingsError && recentRatings) {
        recentRatings.forEach((rating: any) => {
          const userName =
            rating.rated_user?.name || rating.rated_user?.email || "Usuário";
          activities.push({
            id: `rating_${rating.id}`,
            type: "rating_given",
            message: `Você avaliou ${userName} com ${rating.rating} estrela${
              rating.rating > 1 ? "s" : ""
            }`,
            time: this.formatTimeAgo(rating.created_at),
            created_at: rating.created_at,
            related_id: rating.id,
            related_type: "rating",
            data: {
              rating: rating.rating,
              user_name: userName,
              list_name: rating.task_lists?.name,
            },
          });
        });
      }

      // 4. Buscar comentários adicionados pelo usuário
      const { data: recentComments, error: commentsError } = await supabase
        .from("task_comments")
        .select(
          `
           id,
           content,
           created_at,
           tasks!inner (
             title,
             task_lists!inner (
               name
             )
           )
         `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!commentsError && recentComments) {
        recentComments.forEach((comment: any) => {
          activities.push({
            id: `comment_${comment.id}`,
            type: "comment_added",
            message: `Comentário adicionado na tarefa "${comment.tasks?.title}"`,
            time: this.formatTimeAgo(comment.created_at),
            created_at: comment.created_at,
            related_id: comment.id,
            related_type: "comment",
            data: {
              task_title: comment.tasks?.title,
              list_name: comment.tasks?.task_lists?.name,
              comment_preview:
                comment.content.substring(0, 50) +
                (comment.content.length > 50 ? "..." : ""),
            },
          });
        });
      }

      // 5. Buscar convites aceitos (quando o usuário é prestador)
      const { data: acceptedInvitations, error: invitationsError } =
        await supabase
          .from("list_invitations")
          .select(
            `
           id,
           created_at,
           updated_at,
           list:list_id (
             name
           ),
           inviter:inviter_id (
             name,
             email
           )
         `
          )
          .eq("invitee_id", userId)
          .eq("status", "accepted")
          .order("updated_at", { ascending: false })
          .limit(limit);

      if (!invitationsError && acceptedInvitations) {
        acceptedInvitations.forEach((invitation: any) => {
          const inviterName =
            invitation.inviter?.name || invitation.inviter?.email || "Usuário";
          activities.push({
            id: `invitation_accepted_${invitation.id}`,
            type: "list_shared",
            message: `Você aceitou o convite para colaborar na lista "${invitation.list?.name}" de ${inviterName}`,
            time: this.formatTimeAgo(invitation.updated_at),
            created_at: invitation.updated_at,
            related_id: invitation.id,
            related_type: "invitation",
            data: {
              list_name: invitation.list?.name,
              inviter_name: inviterName,
            },
          });
        });
      }

      // Ordenar todas as atividades por data (mais recentes primeiro)
      activities.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Retornar apenas as atividades mais recentes
      return activities.slice(0, limit);
    } catch (error) {
      console.error("Erro ao buscar atividades recentes:", error);
      return [];
    }
  },

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return "Agora mesmo";
    } else if (diffInMinutes < 60) {
      return `Há ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Há ${diffInHours}h`;
    } else if (diffInDays === 1) {
      return "Ontem";
    } else if (diffInDays < 7) {
      return `Há ${diffInDays} dias`;
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  },
};
