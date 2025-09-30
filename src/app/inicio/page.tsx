"use client";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";
import {
  MoreVertical,
  User,
  LogOut,
  Clock,
  CheckCircle,
  Star,
  Home,
  Users,
  Loader2,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { useTaskLists } from "@/hooks/use-task-lists";
import { useActivities } from "@/hooks/use-activities";
import { useLastProviders } from "@/hooks/use-last-providers";
import { useModal } from "@/contexts/modal-context";
import { supabase } from "@/lib/supabase";
import { TaskListCard } from "@/components/task/task-list-card";
import { generateUniqueSlug } from "@/lib/slug";
import { lastProvidersService } from "@/lib/last-providers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ListInvitation } from "@/types";

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

export default function InicioPage() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [selectedCompletion, setSelectedCompletion] = useState("todas");
  const [showFilters, setShowFilters] = useState(false);
  const [userType, setUserType] = useState<string>("contratante");
  const [isLoadingUserType, setIsLoadingUserType] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState<
    ListInvitation[]
  >([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: "accept" | "decline" | null;
    invitation: ListInvitation | null;
  }>({ isOpen: false, type: null, invitation: null });
  const { user } = useAuth();
  const { isModalOpen } = useModal();
  const {
    taskLists,
    favoriteLists,
    loading,
    error,
    toggleFavorite,
    deleteTaskList,
    refetch,
  } = useTaskLists();
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    refetch: refetchActivities,
  } = useActivities(user?.id);
  const {
    providers,
    loading: providersLoading,
    error: providersError,
    refetch: refetchProviders,
  } = useLastProviders(user?.id);

  // Categorias disponíveis
  const categorias = [
    { value: "todas", label: "Todas as categorias" },
    { value: "limpeza-geral", label: "Limpeza Geral" },
    { value: "cozinha", label: "Cozinha" },
    { value: "banheiro", label: "Banheiro" },
    { value: "quartos", label: "Quartos" },
    { value: "area-externa", label: "Área Externa" },
    { value: "organizacao", label: "Organização" },
    { value: "manutencao", label: "Manutenção" },
  ];

  // Opções de conclusão
  const opcoesConclusao = [
    { value: "todas", label: "Todas" },
    { value: "concluidas", label: "Concluídas" },
    { value: "pendentes", label: "Pendentes" },
  ];

  // Função para filtrar listas
  const filtrarListas = (listas: any[]) => {
    return listas.filter((lista) => {
      // Filtro por busca
      const matchesSearch =
        searchTerm === "" ||
        lista.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lista.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por categoria
      const matchesCategory =
        selectedCategory === "todas" || lista.category === selectedCategory;

      // Filtro por conclusão
      let matchesCompletion = true;
      if (selectedCompletion !== "todas") {
        const totalTasks = lista.tasks?.length || 0;
        const completedTasks =
          lista.tasks?.filter((task: any) => task.status === "concluida")
            .length || 0;

        if (selectedCompletion === "concluidas") {
          matchesCompletion = totalTasks > 0 && completedTasks === totalTasks;
        } else if (selectedCompletion === "pendentes") {
          matchesCompletion = totalTasks === 0 || completedTasks < totalTasks;
        }
      }

      return matchesSearch && matchesCategory && matchesCompletion;
    });
  };

  // Listas filtradas
  const listasFiltradas = filtrarListas(taskLists || []);
  const favoritasFiltradas = filtrarListas(favoriteLists || []);

  // Função para limpar filtros
  const limparFiltros = () => {
    setSearchTerm("");
    setSelectedCategory("todas");
    setSelectedCompletion("todas");
  };

  // Função para fechar filtros ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const filtersContainer = document.querySelector(
        "[data-filters-container]"
      );

      if (
        showFilters &&
        filtersContainer &&
        !filtersContainer.contains(target)
      ) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  // Carregar avatar do usuário
  useEffect(() => {
    const loadAvatar = async () => {
      if (!user?.id) {
        setAvatarUrl(null);
        return;
      }
      const { data } = await supabase
        .from("user")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      setAvatarUrl(data?.avatar_url || null);
    };
    loadAvatar();
  }, [user?.id]);

  // Carregar tipo do usuário
  useEffect(() => {
    const loadUserType = async () => {
      if (!user?.id) {
        setIsLoadingUserType(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("user")
          .select("tipo")
          .eq("id", user.id)
          .single();

        setUserType(data?.tipo || "contratante");
      } catch (error) {
        console.error("Erro ao carregar tipo do usuário:", error);
        setUserType("contratante"); // fallback para contratante
      } finally {
        setIsLoadingUserType(false);
      }
    };

    loadUserType();
  }, [user?.id]);

  // Carregar convites pendentes para prestadores
  useEffect(() => {
    const loadPendingInvitations = async () => {
      console.log(
        "LoadPendingInvitations - user:",
        user?.id,
        "userType:",
        userType
      );

      if (!user?.id || userType !== "prestador") {
        console.log(
          "Não carregando convites - usuário não é prestador ou não está logado"
        );
        setPendingInvitations([]);
        return;
      }

      console.log("Carregando convites para prestador:", user.id);
      setIsLoadingInvitations(true);
      try {
        const { invitationsService } = await import("@/lib/invitations");
        const invitations = await invitationsService.getPendingInvitations(
          user.id
        );
        console.log("Convites carregados:", invitations);
        setPendingInvitations(invitations);
      } catch (error) {
        console.error("Erro ao carregar convites pendentes:", error);
        setPendingInvitations([]);
      } finally {
        setIsLoadingInvitations(false);
      }
    };

    if (!isLoadingUserType) {
      loadPendingInvitations();
    }
  }, [user?.id, userType, isLoadingUserType]);

  const handleLogout = () => {
    // Aqui seria implementada a lógica de logout
    console.log("Logout realizado");
    setIsProfileModalOpen(false);
    // Redirecionar para login
    window.location.href = "/login";
  };

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
        // Remover convite da lista da página inicial
        setPendingInvitations((prev) =>
          prev.filter((inv) => inv.id !== confirmationModal.invitation!.id)
        );

        // Se aceito, recarregar listas para mostrar a nova lista
        if (confirmationModal.type === "accept") {
          refetch();
          refetchActivities(); // Recarregar atividades também
          refetchProviders(); // Recarregar prestadores também
        }
      }
    } catch (error) {
      console.error("Erro ao processar convite:", error);
    } finally {
      setConfirmationModal({ isOpen: false, type: null, invitation: null });
    }
  };

  const handleLeaveList = async (listId: string) => {
    if (!user?.id) {
      console.error("Usuário não autenticado");
      return;
    }

    try {
      console.log("Saindo da lista:", { listId, userId: user.id });

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
        .eq("id", user.id)
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
        .eq("user_id", user.id);

      if (removeError) {
        console.error("Erro ao remover colaborador:", removeError);
        throw new Error(`Erro ao sair da lista: ${removeError.message}`);
      }

      // Criar notificação para o criador da lista
      const notificationTitle = "Colaborador saiu da lista";
      const notificationMessage = `${
        userData.name || userData.email
      } saiu da lista "${listData.name}"`;

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: listData.creator_id,
          type: "list_shared",
          title: notificationTitle,
          message: notificationMessage,
          related_id: listId,
          related_type: "list",
          data: {
            user_name: userData.name || userData.email,
            list_name: listData.name,
            action: "left",
          },
        });

      if (notificationError) {
        console.error("Erro ao criar notificação:", notificationError);
        // Não vamos falhar a operação por causa da notificação
      }

      console.log("Usuário removido da lista com sucesso");

      // Recarregar as listas e atividades
      refetch();
      refetchActivities();
      refetchProviders();
    } catch (error) {
      console.error("Erro ao sair da lista:", error);
      throw error;
    }
  };

  // Função para obter o ícone baseado no tipo de atividade
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "list_created":
        return Star;
      case "task_completed":
        return CheckCircle;
      case "task_created":
        return Clock;
      case "rating_given":
        return Star;
      case "comment_added":
        return Users;
      case "list_shared":
        return Users;
      case "task_assigned":
        return User;
      default:
        return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div
        className={`${
          isModalOpen ? "" : "sticky top-0"
        } z-50 bg-white/80 backdrop-blur-sm px-4 py-4 flex items-center justify-between shadow-sm border-b border-gray-100`}
      >
        <div className="flex items-center space-x-3">
          <Image
            src="/image/Casa Check logo.webp"
            alt="Casa Check"
            width={120}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-800">
              Olá, {user?.user_metadata?.full_name || "Usuário"}! 👋
            </h1>
          </div>
          <div className="block sm:hidden">
            <h1 className="text-lg font-semibold text-gray-800">
              Olá, {user?.user_metadata?.full_name || "Usuário"}! 👋
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center hover:from-green-500 hover:to-blue-600 transition-all shadow-lg"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={40}
                height={40}
                className="w-10 h-10 object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-white">
                {user?.user_metadata?.full_name?.charAt(0) || "U"}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="border-b border-white/50" data-filters-container>
        <div className="p-4">
          {/* Barra de busca */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar listas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={() => setShowFilters(true)}
                className="pl-10 bg-white/50 border-white/50 focus:bg-white focus:border-green-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Filtros em formato de tags */}
          {showFilters && (
            <div className="space-y-3">
              {/* Filtros por categoria */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria.value}
                      onClick={() => setSelectedCategory(categoria.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === categoria.value
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-white/50 text-gray-600 hover:bg-white hover:text-gray-800 border border-white/50"
                      }`}
                    >
                      {categoria.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtros por status */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {opcoesConclusao.map((opcao) => (
                    <button
                      key={opcao.value}
                      onClick={() => setSelectedCompletion(opcao.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedCompletion === opcao.value
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white/50 text-gray-600 hover:bg-white hover:text-gray-800 border border-white/50"
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão para limpar filtros */}
              {(searchTerm ||
                selectedCategory !== "todas" ||
                selectedCompletion !== "todas") && (
                <div className="flex justify-center pt-2 border-t border-white/30">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={limparFiltros}
                    className="bg-red-50 border-red-200 hover:bg-red-100 text-red-600 hover:text-red-700 font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Mensagem quando não há resultados */}
        {listasFiltradas.length === 0 &&
          favoritasFiltradas.length === 0 &&
          (searchTerm ||
            selectedCategory !== "todas" ||
            selectedCompletion !== "todas") && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhuma lista encontrada
              </h3>
              <p className="text-gray-500 mb-4">
                Tente ajustar os filtros ou termo de busca
              </p>
              <Button
                variant="outline"
                onClick={limparFiltros}
                className="bg-white/50 border-white/50 hover:bg-white"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}

        {/* Listas Favoritas */}
        {favoritasFiltradas.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Listas Favoritas ({favoritasFiltradas.length})
            </h2>
            {favoritasFiltradas.map((taskList) => (
              <Link
                key={taskList.id}
                href={`/lista/${generateUniqueSlug(
                  taskList.name,
                  taskList.id
                )}`}
              >
                <TaskListCard
                  taskList={taskList}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteTaskList}
                  onLeaveList={handleLeaveList}
                  currentUserId={user?.id}
                />
              </Link>
            ))}
          </div>
        )}

        {/* Convites Pendentes - Apenas para prestadores */}
        {!isLoadingUserType && userType === "prestador" && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              Convites Pendentes ({pendingInvitations.length})
            </h2>

            {isLoadingInvitations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                <span className="ml-2 text-gray-600">
                  Carregando convites...
                </span>
              </div>
            ) : pendingInvitations.length > 0 ? (
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3 flex-1">
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
                              : invitation.inviter?.email?.[0]?.toUpperCase() ||
                                "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          {/* Cabeçalho com nome e data */}
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-800 text-base">
                                {invitation.inviter?.name ||
                                  invitation.inviter?.email ||
                                  "Usuário"}
                              </h3>
                              <p className="text-sm text-gray-500">
                                convidou você para colaborar
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">
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
                                <p className="text-sm font-medium text-gray-700">
                                  Lista:
                                </p>
                                <p className="text-base font-semibold text-gray-800">
                                  {invitation.list?.name ||
                                    "Lista não encontrada"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Botões de ação */}
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
                              onClick={() =>
                                handleDeclineInvitation(invitation)
                              }
                              className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Recusar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhum convite pendente
                </h3>
                <p className="text-gray-500">
                  Os convites que você receber aparecerão aqui
                </p>
              </div>
            )}
          </div>
        )}

        {/* Minhas Listas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Home className="w-5 h-5 mr-2 text-green-500" />
              Minhas Listas ({taskLists.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
              <span className="ml-2 text-gray-600">Carregando listas...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-xs text-red-500 mt-2">User ID: {user?.id}</p>
            </div>
          ) : taskLists.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto mb-4">
                <Image
                  src="/image/Nenhuma lista.webp"
                  alt="Nenhuma lista criada ainda"
                  width={512}
                  height={320}
                  className="mx-auto w-full max-w-md h-auto object-contain"
                  priority
                />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {!isLoadingUserType && userType === "prestador"
                  ? "Nenhuma lista"
                  : "Nenhuma lista criada ainda"}
              </h3>
              <p className="text-gray-500">
                {!isLoadingUserType && userType === "prestador"
                  ? "As listas que você for convidado aparecerão aqui"
                  : "Crie sua primeira lista de tarefas para começar a organizar seu trabalho doméstico."}
              </p>
            </div>
          ) : (
            <>
              {listasFiltradas.map((taskList) => (
                <Link
                  key={taskList.id}
                  href={`/lista/${generateUniqueSlug(
                    taskList.name,
                    taskList.id
                  )}`}
                >
                  <TaskListCard
                    taskList={taskList}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteTaskList}
                    onLeaveList={handleLeaveList}
                    currentUserId={user?.id}
                  />
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Atividade Recente */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-green-500" />
            Atividade Recente
          </h2>

          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
              <span className="ml-2 text-gray-600">
                Carregando atividades...
              </span>
            </div>
          ) : activitiesError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{activitiesError}</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhuma atividade recente
              </h3>
              <p className="text-gray-500">
                Suas atividades aparecerão aqui conforme você usar o aplicativo
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const IconComponent = getActivityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimos Prestadores - Apenas para contratantes */}
        {!isLoadingUserType && userType === "contratante" && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-500" />
              Últimos Prestadores
            </h2>

            {providersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                <span className="ml-2 text-gray-600">
                  Carregando prestadores...
                </span>
              </div>
            ) : providersError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{providersError}</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhum prestador ainda
                </h3>
                <p className="text-gray-500">
                  Os prestadores que colaborarem em suas listas aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {providers.map((provider) => {
                  const colors = [
                    "from-orange-200 to-orange-300",
                    "from-blue-200 to-blue-300",
                    "from-purple-200 to-purple-300",
                    "from-green-200 to-green-300",
                    "from-pink-200 to-pink-300",
                    "from-indigo-200 to-indigo-300",
                  ];
                  const textColors = [
                    "text-orange-700",
                    "text-blue-700",
                    "text-purple-700",
                    "text-green-700",
                    "text-pink-700",
                    "text-indigo-700",
                  ];

                  const colorIndex =
                    providers.indexOf(provider) % colors.length;
                  const bgColor = colors[colorIndex];
                  const textColor = textColors[colorIndex];

                  return (
                    <Link
                      key={provider.id}
                      href={`/prestador/${provider.id}`}
                      className="flex-shrink-0"
                    >
                      <div className="text-center group cursor-pointer">
                        <div
                          className={`w-20 h-20 rounded-full bg-gradient-to-r ${bgColor} flex items-center justify-center mb-2 mx-auto group-hover:scale-105 transition-transform shadow-lg`}
                        >
                          {provider.avatar_url ? (
                            <img
                              src={provider.avatar_url}
                              alt={provider.name}
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            <span
                              className={`text-lg font-medium ${textColor}`}
                            >
                              {provider.initials}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[80px]">
                          {provider.name}
                        </p>
                        <div className="flex items-center justify-center space-x-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600">
                            {provider.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {lastProvidersService.formatLastCollaboration(
                            provider.last_collaboration
                          )}
                        </p>
                        {provider.list_count > 1 && (
                          <p className="text-xs text-blue-600 mt-1">
                            {provider.list_count} listas
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>

      {/* Modal do Perfil */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsProfileModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="absolute top-16 right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 py-2 min-w-[180px]">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-800">
                {user?.user_metadata?.full_name || "Usuário"}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>

            {/* Opção Perfil */}
            <Link
              href="/perfil"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={() => setIsProfileModalOpen(false)}
            >
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-gray-800 font-medium">Perfil</span>
            </Link>

            {/* Divisor */}
            <div className="border-t border-gray-100 my-1" />

            {/* Opção Sair */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut className="w-5 h-5 text-red-600" />
              <span className="text-red-600 font-medium">Sair</span>
            </button>
          </div>
        </div>
      )}

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
                : "Recusar Convite"}
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
                : "Recusar Convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
