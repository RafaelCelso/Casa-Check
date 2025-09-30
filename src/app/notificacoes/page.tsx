"use client";
import {
  ArrowLeft,
  CheckCircle,
  User,
  Edit3,
  Plus,
  Users,
  Loader2,
  X,
  Bell,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/contexts/modal-context";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Notification, ListInvitation } from "@/types";

// Função para formatar data e hora
const formatInvitationDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return "Há poucos minutos";
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
};

export default function NotificacoesPage() {
  const { isModalOpen } = useModal();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    ListInvitation[]
  >([]);
  const [allInvitations, setAllInvitations] = useState<ListInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipedNotificationId, setSwipedNotificationId] = useState<
    string | null
  >(null);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: "accept" | "decline" | "delete_notification" | null;
    invitation: ListInvitation | null;
    notification: Notification | null;
  }>({ isOpen: false, type: null, invitation: null, notification: null });

  const [bulkActionModal, setBulkActionModal] = useState<{
    isOpen: boolean;
    type: "mark_all_read" | "clear_all" | null;
  }>({ isOpen: false, type: null });

  // Carregar notificações e convites
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        console.log("Não carregando dados - usuário não logado");
        return;
      }

      console.log("Carregando notificações e convites para usuário:", user.id);
      setLoading(true);
      try {
        // Carregar notificações
        const { notificationsService } = await import("@/lib/invitations");
        const notificationsData =
          await notificationsService.getUserNotifications(user.id);
        console.log("Notificações carregadas:", notificationsData);
        setNotifications(notificationsData);

        // Carregar convites pendentes e todos os convites
        const { invitationsService } = await import("@/lib/invitations");
        const [pendingInvitationsData, allInvitationsData] = await Promise.all([
          invitationsService.getPendingInvitations(user.id),
          invitationsService.getAllInvitations(user.id),
        ]);
        console.log("Convites pendentes carregados:", pendingInvitationsData);
        console.log("Todos os convites carregados:", allInvitationsData);
        setPendingInvitations(pendingInvitationsData);
        setAllInvitations(allInvitationsData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleAcceptInvitation = (invitation: ListInvitation) => {
    setConfirmationModal({
      isOpen: true,
      type: "accept",
      invitation: invitation,
    });
  };

  const handleDeclineInvitation = (invitation: ListInvitation) => {
    setConfirmationModal({
      isOpen: true,
      type: "decline",
      invitation: invitation,
    });
  };

  const confirmInvitationAction = async () => {
    if (
      confirmationModal.type === "delete_notification" &&
      confirmationModal.notification
    ) {
      await deleteNotification(confirmationModal.notification.id);
      setConfirmationModal({
        isOpen: false,
        type: null,
        invitation: null,
        notification: null,
      });
      return;
    }

    if (!confirmationModal.invitation) return;

    try {
      const { invitationsService } = await import("@/lib/invitations");
      let success = false;

      if (confirmationModal.type === "accept") {
        success = await invitationsService.acceptInvitation(
          confirmationModal.invitation.id
        );
      } else {
        success = await invitationsService.declineInvitation(
          confirmationModal.invitation.id
        );
      }

      if (success) {
        // Remover convite da lista de pendentes
        setPendingInvitations((prev) =>
          prev.filter((inv) => inv.id !== confirmationModal.invitation!.id)
        );

        // Atualizar o convite na lista de todos os convites
        setAllInvitations((prev) =>
          prev.map((inv) =>
            inv.id === confirmationModal.invitation!.id
              ? {
                  ...inv,
                  status:
                    confirmationModal.type === "accept"
                      ? ("accepted" as const)
                      : ("declined" as const),
                }
              : inv
          )
        );
      }
    } catch (error) {
      console.error("Erro ao processar convite:", error);
    } finally {
      setConfirmationModal({
        isOpen: false,
        type: null,
        invitation: null,
        notification: null,
      });
    }
  };

  // Função para renderizar o card do convite
  const renderInvitationCard = (
    invitation: ListInvitation,
    isProcessed: boolean
  ) => (
    <div className="flex items-start space-x-3">
      {/* Avatar do usuário que enviou o convite */}
      <Avatar className="w-12 h-12">
        <AvatarImage
          src={invitation.inviter?.avatar_url}
          alt={invitation.inviter?.name || "Usuário"}
        />
        <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold">
          {invitation.inviter?.name
            ? invitation.inviter.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : invitation.inviter?.email?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-800 text-base">
                {invitation.inviter?.name ||
                  invitation.inviter?.email ||
                  "Usuário"}
              </h3>
              {isProcessed && (
                <Badge
                  variant={
                    invitation.status === "accepted" ? "default" : "destructive"
                  }
                  className={
                    invitation.status === "accepted"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  }
                >
                  {invitation.status === "accepted" ? "Aceito" : "Recusado"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              convidou você para colaborar
            </p>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
            {formatInvitationDate(invitation.created_at)}
          </span>
        </div>

        {/* Nome da lista */}
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Lista:</p>
              <p className="text-base font-semibold text-gray-800">
                {invitation.list?.name || "Lista não encontrada"}
              </p>
            </div>
          </div>
        </div>

        {/* Botões de ação - apenas para convites pendentes */}
        {!isProcessed && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => handleAcceptInvitation(invitation)}
              className="bg-green-500 hover:bg-green-600 text-white flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Aceitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeclineInvitation(invitation)}
              className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
            >
              <X className="w-4 h-4 mr-1" />
              Recusar
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const getIconColor = (tipo: string, lida: boolean) => {
    if (lida) {
      return "text-gray-400 bg-gray-100";
    }

    switch (tipo) {
      case "nova-tarefa":
        return "text-green-600 bg-green-100";
      case "tarefa-concluida":
        return "text-gray-600 bg-gray-100";
      case "tarefa-atribuida":
        return "text-gray-600 bg-gray-100";
      case "tarefa-atualizada":
        return "text-gray-600 bg-gray-100";
      case "list_shared":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case "nova-tarefa":
        return <Plus className="w-5 h-5" />;
      case "tarefa-concluida":
        return <CheckCircle className="w-5 h-5" />;
      case "tarefa-atribuida":
        return <User className="w-5 h-5" />;
      case "tarefa-atualizada":
        return <Edit3 className="w-5 h-5" />;
      case "list_shared":
        return <Users className="w-5 h-5" />;
      case "invitation":
        return <UserPlus className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  // Função para marcar notificação como lida
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        return;
      }

      // Atualizar o estado local
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  // Função para mostrar modal de confirmação de exclusão
  const confirmDeleteNotification = (notification: Notification) => {
    setConfirmationModal({
      isOpen: true,
      type: "delete_notification",
      invitation: null,
      notification: notification,
    });
  };

  // Função para excluir notificação
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error("Erro ao excluir notificação:", error);
        return;
      }

      // Atualizar o estado local
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
    }
  };

  // Função para marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    if (!user?.id) {
      console.error(
        "Usuário não encontrado para marcar notificações como lidas"
      );
      return;
    }

    console.log(
      "Marcando todas as notificações como lidas para usuário:",
      user.id
    );

    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .select();

      if (error) {
        console.error("Erro ao marcar todas como lidas:", error);
        console.error("Detalhes do erro:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return;
      }

      console.log("Notificações marcadas como lidas:", data);

      // Recarregar notificações do banco para garantir sincronização
      try {
        const { notificationsService } = await import("@/lib/invitations");
        const updatedNotifications =
          await notificationsService.getUserNotifications(user.id);
        setNotifications(updatedNotifications);
        console.log(
          "Notificações recarregadas do banco:",
          updatedNotifications
        );
      } catch (reloadError) {
        console.error("Erro ao recarregar notificações:", reloadError);
        // Fallback: atualizar o estado local
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  // Função para limpar todas as notificações
  const clearAllNotifications = async () => {
    if (!user?.id) {
      console.error("Usuário não encontrado para limpar notificações");
      return;
    }

    console.log("Limpando todas as notificações para usuário:", user.id);

    try {
      const { data, error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .select();

      if (error) {
        console.error("Erro ao limpar notificações:", error);
        console.error("Detalhes do erro:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return;
      }

      console.log("Notificações excluídas:", data);

      // Atualizar o estado local
      setNotifications([]);
      console.log("Estado local atualizado - notificações limpas");
    } catch (error) {
      console.error("Erro ao limpar notificações:", error);
    }
  };

  // Função para confirmar ações em massa
  const confirmBulkAction = async () => {
    console.log("confirmBulkAction chamada com tipo:", bulkActionModal.type);

    try {
      if (bulkActionModal.type === "mark_all_read") {
        console.log("Executando markAllAsRead...");
        await markAllAsRead();
      } else if (bulkActionModal.type === "clear_all") {
        console.log("Executando clearAllNotifications...");
        await clearAllNotifications();
      }

      console.log("Ação em massa concluída, fechando modal...");
      setBulkActionModal({ isOpen: false, type: null });
    } catch (error) {
      console.error("Erro na confirmBulkAction:", error);
    }
  };

  // Função para renderizar notificações
  const renderNotificationCard = (notification: Notification) => {
    const isRead = notification.read;
    const iconColor = getIconColor(notification.type, isRead);
    const isSwiped = swipedNotificationId === notification.id;

    const handleClick = () => {
      if (!isRead) {
        markNotificationAsRead(notification.id);
      }
    };

    const handleSwipeStart = (e: React.TouchEvent) => {
      e.preventDefault();
      setSwipeStartX(e.touches[0].clientX);
    };

    const handleSwipeMove = (e: React.TouchEvent) => {
      if (swipeStartX === null) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeStartX;

      // Se deslizou para a esquerda mais de 100px
      if (deltaX < -100) {
        setSwipedNotificationId(notification.id);
      }
      // Se deslizou de volta para a direita mais de 50px
      else if (deltaX > 50) {
        setSwipedNotificationId(null);
      }
    };

    const handleSwipeEnd = () => {
      setSwipeStartX(null);
      // Reset após um tempo se não foi confirmado
      if (swipedNotificationId === notification.id) {
        setTimeout(() => {
          setSwipedNotificationId(null);
        }, 3000);
      }
    };

    // Handlers para mouse (desktop)
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setSwipeStartX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (swipeStartX === null) return;

      const deltaX = e.clientX - swipeStartX;

      // Se deslizou para a esquerda mais de 100px
      if (deltaX < -100) {
        setSwipedNotificationId(notification.id);
      }
      // Se deslizou de volta para a direita mais de 50px
      else if (deltaX > 50) {
        setSwipedNotificationId(null);
      }
    };

    const handleMouseUp = () => {
      setSwipeStartX(null);
      // Reset após um tempo se não foi confirmado
      if (swipedNotificationId === notification.id) {
        setTimeout(() => {
          setSwipedNotificationId(null);
        }, 3000);
      }
    };

    return (
      <div className="relative overflow-hidden">
        {/* Card principal */}
        <div
          className={`flex items-start space-x-3 p-3 transition-transform duration-300 ${
            isRead ? "opacity-75" : ""
          } ${isSwiped ? "-translate-x-20" : ""}`}
          onClick={handleClick}
          onTouchStart={handleSwipeStart}
          onTouchMove={handleSwipeMove}
          onTouchEnd={handleSwipeEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isRead ? "default" : "pointer" }}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}
          >
            {getNotificationIcon(notification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center space-x-2">
                <h3
                  className={`font-semibold text-sm ${
                    isRead ? "text-gray-600" : "text-gray-800"
                  }`}
                >
                  {notification.title}
                </h3>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatInvitationDate(notification.created_at)}
                </span>
              </div>
            </div>

            <p
              className={`text-sm ${
                isRead ? "text-gray-500" : "text-gray-700"
              }`}
            >
              {notification.message}
            </p>

            {notification.data?.action === "left" && (
              <div className="mt-2 bg-orange-50 rounded-lg p-2">
                <p className="text-xs text-orange-700">
                  <strong>Usuário:</strong> {notification.data.user_name}
                </p>
                <p className="text-xs text-orange-700">
                  <strong>Lista:</strong> {notification.data.list_name}
                </p>
              </div>
            )}

            {/* Indicador de ação */}
            {!isRead && (
              <div className="mt-2 text-xs text-blue-600">
                Toque para marcar como lida
              </div>
            )}
          </div>
        </div>

        {/* Botão de excluir (aparece no swipe) */}
        <div
          className={`absolute right-0 top-0 h-full w-20 bg-red-500 flex items-center justify-center transition-opacity duration-300 ${
            isSwiped ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              confirmDeleteNotification(notification);
              setSwipedNotificationId(null);
            }}
            className="text-white text-xs font-medium px-3 py-2"
          >
            Excluir
          </button>
        </div>

        {/* Botão de excluir (sempre visível) */}
        {!isSwiped && (
          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(notification.id);
              }}
              className="w-5 h-5 text-gray-700 hover:text-red-600 flex items-center justify-center text-sm font-medium transition-colors"
              title="Excluir notificação"
            >
              ×
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen ${
        isModalOpen ? "" : "pb-20"
      } bg-gradient-to-br from-green-50 via-white to-blue-50`}
    >
      {/* Header */}
      <div
        className={`${
          isModalOpen ? "" : "sticky top-0"
        } z-50 bg-white/80 backdrop-blur-sm px-4 py-4 flex items-center justify-between shadow-sm border-b border-gray-100`}
      >
        <div className="flex items-center space-x-3">
          <Link href="/inicio">
            <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-800 cursor-pointer" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Notificações</h1>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            <span className="ml-2 text-gray-600">Carregando...</span>
          </div>
        ) : (
          <>
            {/* Notificações */}
            {notifications.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-orange-500" />
                  Notificações ({notifications.length})
                </h2>

                {/* Botões de ação */}
                <div className="flex items-center space-x-2 mb-4">
                  <button
                    onClick={() =>
                      setBulkActionModal({
                        isOpen: true,
                        type: "mark_all_read",
                      })
                    }
                    className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                    title="Marcar tudo como lido"
                  >
                    Marcar tudo como lido
                  </button>
                  <button
                    onClick={() =>
                      setBulkActionModal({ isOpen: true, type: "clear_all" })
                    }
                    className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                    title="Excluir todas as notificações"
                  >
                    Limpar tudo
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`border-b border-gray-100 last:border-b-0 ${
                        !notification.read ? "bg-orange-50/30" : ""
                      }`}
                    >
                      {renderNotificationCard(notification)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Convites */}
            {(pendingInvitations.length > 0 ||
              allInvitations.filter((inv) => inv.status !== "pending").length >
                0) && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  Convites ({allInvitations.length})
                </h2>

                <div className="space-y-3">
                  {/* Convites Pendentes */}
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow"
                    >
                      {renderInvitationCard(invitation, false)}
                    </div>
                  ))}

                  {/* Convites Processados (aceitos/recusados) */}
                  {allInvitations
                    .filter((inv) => inv.status !== "pending")
                    .map((invitation) => (
                      <div
                        key={invitation.id}
                        className="bg-gray-100 rounded-lg p-4 shadow-sm border-l-4 border-gray-400 opacity-75"
                      >
                        {renderInvitationCard(invitation, true)}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Mensagem quando não há notificações nem convites */}
            {!loading &&
              notifications.length === 0 &&
              pendingInvitations.length === 0 &&
              allInvitations.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Nenhuma notificação
                  </h3>
                  <p className="text-gray-500">
                    Você está em dia! Não há novas notificações.
                  </p>
                </div>
              )}
          </>
        )}
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>

      {/* Modal de Confirmação de Convite */}
      <Dialog
        open={confirmationModal.isOpen}
        onOpenChange={(open) =>
          setConfirmationModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmationModal.type === "accept"
                ? "Aceitar Convite"
                : confirmationModal.type === "decline"
                ? "Recusar Convite"
                : "Excluir Notificação"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {confirmationModal.invitation && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={confirmationModal.invitation.inviter?.avatar_url}
                      alt={
                        confirmationModal.invitation.inviter?.name || "Usuário"
                      }
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold text-sm">
                      {confirmationModal.invitation.inviter?.name
                        ? confirmationModal.invitation.inviter.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : confirmationModal.invitation.inviter?.email?.[0]?.toUpperCase() ||
                          "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-800">
                      {confirmationModal.invitation.inviter?.name ||
                        confirmationModal.invitation.inviter?.email ||
                        "Usuário"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Lista:{" "}
                      {confirmationModal.invitation.list?.name ||
                        "Lista não encontrada"}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  {confirmationModal.type === "accept"
                    ? "Tem certeza que deseja aceitar este convite? Você será adicionado como colaborador da lista."
                    : "Tem certeza que deseja recusar este convite?"}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmationModal({
                  isOpen: false,
                  type: null,
                  invitation: null,
                })
              }
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmInvitationAction}
              className={
                confirmationModal.type === "accept"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }
            >
              {confirmationModal.type === "accept"
                ? "Aceitar Convite"
                : confirmationModal.type === "decline"
                ? "Recusar Convite"
                : "Excluir Notificação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação para Ações em Massa */}
      <Dialog
        open={bulkActionModal.isOpen}
        onOpenChange={(open) =>
          setBulkActionModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bulkActionModal.type === "mark_all_read"
                ? "Marcar Todas como Lidas"
                : "Limpar Todas as Notificações"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {bulkActionModal.type === "mark_all_read" ? (
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                ) : (
                  <X className="w-8 h-8 text-red-600" />
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {bulkActionModal.type === "mark_all_read"
                  ? "Marcar todas como lidas?"
                  : "Excluir todas as notificações?"}
              </h3>

              <p className="text-gray-600 text-sm">
                {bulkActionModal.type === "mark_all_read"
                  ? `Todas as ${notifications.length} notificações não lidas serão marcadas como lidas.`
                  : `Todas as ${notifications.length} notificações (lidas e não lidas) serão excluídas permanentemente.`}
              </p>

              {bulkActionModal.type === "clear_all" && (
                <p className="text-red-600 text-sm font-medium mt-2">
                  Esta ação não pode ser desfeita!
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setBulkActionModal({ isOpen: false, type: null })}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmBulkAction}
              className={
                bulkActionModal.type === "mark_all_read"
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }
            >
              {bulkActionModal.type === "mark_all_read"
                ? "Marcar Todas"
                : "Excluir Todas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
