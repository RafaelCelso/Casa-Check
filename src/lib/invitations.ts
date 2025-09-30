import { supabase } from "./supabase";
import type { ListInvitation, Notification } from "@/types";

export const invitationsService = {
  // Enviar convite para uma lista
  async sendInvitation(
    listId: string,
    inviteeId: string,
    message?: string
  ): Promise<ListInvitation | null> {
    try {
      // Validar se os IDs são UUIDs válidos
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(listId)) {
        throw new Error(`ID da lista inválido: ${listId}`);
      }
      if (!uuidRegex.test(inviteeId)) {
        throw new Error(`ID do prestador inválido: ${inviteeId}`);
      }

      // Obter o usuário atual do Supabase Auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Erro de autenticação:", authError);
        throw new Error("Usuário não autenticado");
      }

      // Verificar se já existe um convite ativo para esta lista e prestador
      const { data: existingInvites, error: checkError } = await supabase
        .from("list_invitations")
        .select("*")
        .eq("list_id", listId)
        .eq("invitee_id", inviteeId)
        .eq("inviter_id", user.id)
        .in("status", ["pending", "accepted"]);

      if (checkError) {
        console.error("Erro ao verificar convites existentes:", checkError);
        throw new Error("Erro ao verificar convites existentes");
      }

      // Se não há convites ativos, pode prosseguir
      if (!existingInvites || existingInvites.length === 0) {
        console.log("Nenhum convite ativo encontrado, prosseguindo...");
      } else {
        // Verificar cada convite ativo
        for (const invite of existingInvites) {
          if (invite.status === "pending") {
            // Se há convite pendente válido, não permite novo
            if (new Date(invite.expires_at) > new Date()) {
              throw new Error(
                "Este prestador já foi convidado para esta lista."
              );
            }
          } else if (invite.status === "accepted") {
            // Se há convite aceito, verificar se ainda é colaborador ativo
            const { data: collaboratorData, error: collaboratorError } =
              await supabase
                .from("list_collaborators")
                .select("id")
                .eq("list_id", listId)
                .eq("user_id", inviteeId)
                .single();

            if (collaboratorError || !collaboratorData) {
              // Se não é mais colaborador, atualizar convite aceito para expired
              console.log(
                "Usuário não é mais colaborador, atualizando convite aceito para expired"
              );

              const { error: updateError } = await supabase
                .from("list_invitations")
                .update({ status: "expired" })
                .eq("id", invite.id);

              if (updateError) {
                console.error(
                  "Erro ao atualizar convite para expired:",
                  updateError
                );
                throw new Error("Erro ao atualizar convite anterior");
              }

              console.log(
                "Convite aceito atualizado para expired, prosseguindo..."
              );
            } else {
              // Se ainda é colaborador, não permite novo convite
              throw new Error("ALREADY_ACCEPTED");
            }
          }
        }
      }

      const { data, error } = await supabase
        .from("list_invitations")
        .insert({
          list_id: listId,
          inviter_id: user.id,
          invitee_id: inviteeId,
          message: message,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao enviar convite:", error);
        throw new Error(`Erro do Supabase: ${error.message}`);
      }

      return data as ListInvitation;
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      throw error; // Re-throw para que o componente possa lidar com o erro
    }
  },

  // Buscar convites pendentes para um usuário
  async getPendingInvitations(userId: string): Promise<ListInvitation[]> {
    try {
      const { data, error } = await supabase
        .from("list_invitations")
        .select("*")
        .eq("invitee_id", userId)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar convites:", error);
        return [];
      }

      // Buscar dados das listas e usuários separadamente
      const invitationsWithData = await Promise.all(
        (data as any[]).map(async (invitation: any) => {
          try {
            // Buscar dados da lista
            const { data: listDataArray, error: listError } = await supabase
              .from("task_lists")
              .select("id, name, description, creator_id")
              .eq("id", invitation.list_id);

            let listData = null;
            if (listError) {
              console.error("Erro ao buscar lista:", listError);
            } else if (listDataArray && listDataArray.length > 0) {
              listData = listDataArray[0];
            }

            // Buscar dados do usuário que enviou o convite
            const { data: userDataArray, error: userError } = await supabase
              .from("user")
              .select("id, name, email, avatar_url")
              .eq("id", invitation.inviter_id);

            let userData = null;
            if (userError) {
              console.error("Erro ao buscar usuário:", userError);
            } else if (userDataArray && userDataArray.length > 0) {
              userData = userDataArray[0];
            }

            return {
              ...invitation,
              list: listData || null,
              inviter: userData || null,
            };
          } catch (generalError) {
            console.warn("Erro ao buscar dados:", generalError);
            return {
              ...invitation,
              list: null,
              inviter: null,
            };
          }
        })
      );

      return invitationsWithData;
    } catch (error) {
      console.error("Erro ao buscar convites:", error);
      return [];
    }
  },

  // Buscar todos os convites para um usuário (incluindo processados)
  async getAllInvitations(userId: string): Promise<ListInvitation[]> {
    try {
      const { data, error } = await supabase
        .from("list_invitations")
        .select("*")
        .eq("invitee_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar convites:", error);
        return [];
      }

      // Buscar dados das listas separadamente
      const invitationsWithLists = await Promise.all(
        (data as any[]).map(async (invitation: any) => {
          try {
            // Buscar dados da lista
            const { data: listDataArray, error: listError } = await supabase
              .from("task_lists")
              .select("id, name, description, creator_id")
              .eq("id", invitation.list_id);

            let listData = null;
            if (listError) {
              console.error("Erro ao buscar lista:", listError);
            } else if (listDataArray && listDataArray.length > 0) {
              listData = listDataArray[0];
            }

            // Buscar dados do usuário que enviou o convite
            const { data: userDataArray, error: userError } = await supabase
              .from("user")
              .select("id, name, email, avatar_url")
              .eq("id", invitation.inviter_id);

            let userData = null;
            if (userError) {
              console.error("Erro ao buscar usuário:", userError);
            } else if (userDataArray && userDataArray.length > 0) {
              userData = userDataArray[0];
            }

            return {
              ...invitation,
              list: listData || null,
              inviter: userData || null,
            };
          } catch (generalError) {
            console.warn("Erro ao buscar dados:", generalError);
            return {
              ...invitation,
              list: null,
              inviter: null,
            };
          }
        })
      );

      return invitationsWithLists;
    } catch (error) {
      console.error("Erro ao buscar convites:", error);
      return [];
    }
  },

  // Aceitar convite
  async acceptInvitation(invitationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("accept_invitation", {
        invitation_id: invitationId,
      });

      if (error) {
        console.error("Erro ao aceitar convite:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Erro ao aceitar convite:", error);
      return false;
    }
  },

  // Recusar convite
  async declineInvitation(invitationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("decline_invitation", {
        invitation_id: invitationId,
      });

      if (error) {
        console.error("Erro ao recusar convite:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Erro ao recusar convite:", error);
      return false;
    }
  },

  // Buscar convites enviados por um usuário
  async getSentInvitations(userId: string): Promise<ListInvitation[]> {
    try {
      const { data, error } = await supabase
        .from("list_invitations")
        .select("*")
        .eq("inviter_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar convites enviados:", error);
        return [];
      }

      // Buscar dados das listas e usuários separadamente
      const invitationsWithData = await Promise.all(
        (data as any[]).map(async (invitation: any) => {
          try {
            // Buscar dados da lista
            const { data: listDataArray, error: listError } = await supabase
              .from("task_lists")
              .select("id, name, description, creator_id")
              .eq("id", invitation.list_id);

            let listData = null;
            if (listError) {
              console.error("Erro ao buscar lista:", listError);
            } else if (listDataArray && listDataArray.length > 0) {
              listData = listDataArray[0];
            }

            // Buscar dados do usuário que recebeu o convite
            const { data: userDataArray, error: userError } = await supabase
              .from("user")
              .select("id, name, email, avatar_url")
              .eq("id", invitation.invitee_id);

            let userData = null;
            if (userError) {
              console.error("Erro ao buscar usuário:", userError);
            } else if (userDataArray && userDataArray.length > 0) {
              userData = userDataArray[0];
            }

            return {
              ...invitation,
              list: listData || null,
              invitee: userData || null,
            };
          } catch (generalError) {
            console.warn("Erro ao buscar dados:", generalError);
            return {
              ...invitation,
              list: null,
              invitee: null,
            };
          }
        })
      );

      return invitationsWithData;
    } catch (error) {
      console.error("Erro ao buscar convites enviados:", error);
      return [];
    }
  },
};

export const notificationsService = {
  // Buscar notificações de um usuário
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar notificações:", error);
        return [];
      }

      return data as Notification[];
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      return [];
    }
  },

  // Marcar notificação como lida
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return false;
    }
  },

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) {
        console.error(
          "Erro ao marcar todas as notificações como lidas:",
          error
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
      return false;
    }
  },

  // Buscar notificações não lidas
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) {
        console.error("Erro ao contar notificações não lidas:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error);
      return 0;
    }
  },

  // Criar notificação
  async createNotification(
    userId: string,
    type: Notification["type"],
    title: string,
    message: string,
    relatedId?: string,
    relatedType?: string,
    data?: any
  ): Promise<Notification | null> {
    try {
      const { data: notification, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type,
          title,
          message,
          related_id: relatedId,
          related_type: relatedType,
          data,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar notificação:", error);
        return null;
      }

      return notification as Notification;
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
      return null;
    }
  },

  // Função para prestador sair da lista
  async leaveList(listId: string, userId: string): Promise<boolean> {
    try {
      console.log("Saindo da lista:", { listId, userId });

      // Primeiro, buscar informações da lista e do usuário para a notificação
      const { data: listData, error: listError } = await supabase
        .from("task_lists")
        .select("name, creator_id")
        .eq("id", listId)
        .single();

      if (listError || !listData) {
        console.error("Erro ao buscar informações da lista:", listError);
        throw new Error("Lista não encontrada");
      }

      const { data: userData, error: userError } = await supabase
        .from("user")
        .select("name, email")
        .eq("id", userId)
        .single();

      if (userError || !userData) {
        console.error("Erro ao buscar informações do usuário:", userError);
        throw new Error("Usuário não encontrado");
      }

      // Remover o usuário da tabela list_collaborators
      const { error: removeError } = await supabase
        .from("list_collaborators")
        .delete()
        .eq("list_id", listId)
        .eq("user_id", userId);

      if (removeError) {
        console.error("Erro ao remover colaborador:", removeError);
        throw new Error(`Erro ao sair da lista: ${removeError.message}`);
      }

      // Criar notificação para o criador da lista
      const notificationTitle = "Colaborador saiu da lista";
      const notificationMessage = `${
        userData.name || userData.email
      } saiu da lista "${listData.name}"`;

      await this.createNotification(
        listData.creator_id,
        "list_shared",
        notificationTitle,
        notificationMessage,
        listId,
        "list",
        {
          user_name: userData.name || userData.email,
          list_name: listData.name,
          action: "left",
        }
      );

      console.log("Usuário removido da lista com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao sair da lista:", error);
      throw error;
    }
  },
};
