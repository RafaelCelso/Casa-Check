"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { taskListsService } from "@/lib/task-lists";
import { tasksService } from "@/lib/tasks";
import { supabase } from "@/lib/supabase";
import { extractIdFromSlug } from "@/lib/slug";
import { useModal } from "@/contexts/modal-context";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import type { Task, TaskCategory } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  ArrowLeft,
  Home,
  Calendar,
  Shirt,
  ChefHat,
  Trash2,
  Plus,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { DraggableTaskCard } from "@/components/task/draggable-task-card";

interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: "alta" | "media" | "baixa";
  categoria: TaskCategory;
  concluida: boolean;
  dataConlusao?: Date;
  icone: any;
}

interface Colaborador {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  status: "active" | "pending";
}

export default function DetalhesListaPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isModalOpen } = useModal();
  const { user } = useAuth();
  const [filtroPrioridade, setFiltroPrioridade] = useState("todas");
  const [tarefasState, setTarefasState] = useState<Tarefa[]>([]);
  const [titulo, setTitulo] = useState<string>("Lista");
  const [userType, setUserType] = useState<string>("contratante");
  const [isLoadingUserType, setIsLoadingUserType] = useState(true);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [isLoadingColaboradores, setIsLoadingColaboradores] = useState(false);
  const [swipeStates, setSwipeStates] = useState<{
    [key: string]: { translateX: number; isDeleting: boolean; startX?: number };
  }>({});

  // Configuração dos sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Mínimo de 8px de movimento para ativar o drag
        delay: 100, // Delay de 100ms para evitar conflito com scroll
        tolerance: 5, // Tolerância de 5px
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 10, // Mínimo de 10px para touch
        delay: 150, // Delay maior para touch
        tolerance: 8, // Tolerância maior para touch
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Função para buscar colaboradores da lista e convites pendentes
  const fetchColaboradores = async (listId: string) => {
    if (!listId) return;

    setIsLoadingColaboradores(true);
    try {
      console.log(
        "Buscando colaboradores e convites pendentes para listId:",
        listId
      );

      // Buscar colaboradores ativos
      const { data: colaboradoresData, error: colaboradoresError } =
        await supabase
          .from("list_collaborators")
          .select(
            `
          user_id,
          created_at,
          user:user_id (
            id,
            name,
            email,
            phone,
            avatar_url
          )
        `
          )
          .eq("list_id", listId);

      if (colaboradoresError) {
        console.error("Erro ao buscar colaboradores:", colaboradoresError);
        return;
      }

      // Buscar convites pendentes
      const { data: convitesPendentesIds, error: convitesError } =
        await supabase
          .from("list_invitations")
          .select("invitee_id, status, created_at")
          .eq("list_id", listId)
          .eq("status", "pending");

      if (convitesError) {
        console.error("Erro ao buscar convites pendentes:", convitesError);
        return;
      }

      // Buscar dados dos usuários com convites pendentes
      let convitesPendentesData: any[] = [];
      if (convitesPendentesIds && convitesPendentesIds.length > 0) {
        const inviteeIds = convitesPendentesIds.map((c) => c.invitee_id);
        const { data: usersData, error: usersError } = await supabase
          .from("user")
          .select("id, name, email, phone, avatar_url")
          .in("id", inviteeIds);

        if (usersError) {
          console.error(
            "Erro ao buscar dados dos usuários com convites pendentes:",
            usersError
          );
          return;
        }

        // Combinar dados dos convites com dados dos usuários
        convitesPendentesData = convitesPendentesIds
          .map((convite: any) => {
            const userData = usersData?.find(
              (user: any) => user.id === convite.invitee_id
            );
            return {
              invitee_id: convite.invitee_id,
              status: convite.status,
              created_at: convite.created_at,
              user: userData,
            };
          })
          .filter((c) => c.user); // Filtrar apenas convites com dados de usuário válidos
      }

      console.log("Dados dos colaboradores recebidos:", colaboradoresData);
      console.log(
        "Dados dos convites pendentes recebidos:",
        convitesPendentesData
      );

      // Mapear colaboradores ativos
      const colaboradoresAtivos =
        colaboradoresData?.map((item: any) => ({
          id: item.user.id,
          name: item.user.name || item.user.email,
          email: item.user.email,
          phone: item.user.phone,
          avatar_url: item.user.avatar_url,
          created_at: item.created_at,
          status: "active" as const,
        })) || [];

      // Mapear convites pendentes
      const convitesPendentes =
        convitesPendentesData?.map((item: any) => ({
          id: item.user.id,
          name: item.user.name || item.user.email,
          email: item.user.email,
          phone: item.user.phone,
          avatar_url: item.user.avatar_url,
          created_at: item.created_at,
          status: "pending" as const,
        })) || [];

      // Combinar colaboradores ativos e convites pendentes
      const todosColaboradores = [...colaboradoresAtivos, ...convitesPendentes];

      console.log("Todos os colaboradores mapeados:", todosColaboradores);
      setColaboradores(todosColaboradores);
    } catch (error) {
      console.error("Erro inesperado ao buscar colaboradores:", error);
    } finally {
      setIsLoadingColaboradores(false);
    }
  };

  // Buscar lista real no Supabase e mapear para o tipo visual
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      // Extrair ID do slug
      const listId = extractIdFromSlug(String(slug));
      if (!listId) {
        setTitulo("Lista não encontrada");
        setTarefasState([]);
        return;
      }

      const list = await taskListsService.getTaskListById(listId, user?.id);
      if (!list) {
        setTitulo("Lista não encontrada");
        setTarefasState([]);
        return;
      }
      setTitulo(list.name);
      const mapped: Tarefa[] = (list.tasks || [])
        .sort((a: Task, b: Task) => (a.order_index || 0) - (b.order_index || 0))
        .map((t: Task) => ({
          id: t.id,
          titulo: t.title,
          descricao: t.description || "",
          prioridade: t.priority as "alta" | "media" | "baixa",
          categoria: t.category,
          concluida: t.status === "concluida",
          dataConlusao: t.completed_at ? new Date(t.completed_at) : undefined,
          icone: Home, // Mantido para compatibilidade, mas não será usado
        }));
      setTarefasState(mapped);

      // Buscar colaboradores se o usuário for contratante
      if (userType === "contratante") {
        fetchColaboradores(list.id); // Usar o ID completo da lista
      }
    };
    fetchData();
  }, [slug, userType]);

  // Cleanup para restaurar scroll quando o componente for desmontado
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Função para lidar com drag and drop
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    // Restaurar scroll sempre que o drag terminar
    document.body.style.overflow = "auto";

    if (active.id !== over.id) {
      const oldIndex = tarefasState.findIndex(
        (tarefa) => tarefa.id === active.id
      );
      const newIndex = tarefasState.findIndex(
        (tarefa) => tarefa.id === over.id
      );

      // Atualizar estado local imediatamente para feedback visual
      const newTarefas = arrayMove(tarefasState, oldIndex, newIndex);
      setTarefasState(newTarefas);

      // Atualizar ordem no banco de dados
      const updates = newTarefas.map((tarefa, index) => ({
        id: tarefa.id,
        order_index: index + 1,
      }));

      const success = await tasksService.updateMultipleTaskOrders(updates);
      if (!success) {
        // Se falhou, reverter para o estado anterior
        setTarefasState(tarefasState);
        console.error("Erro ao salvar nova ordem das tarefas");
      }
    }
  };

  // Função para alternar conclusão da tarefa
  const toggleTarefaConcluida = async (tarefaId: string) => {
    const tarefaAtual = tarefasState.find((t) => t.id === tarefaId);
    if (!tarefaAtual || !user?.id) return;

    const novoStatus = tarefaAtual.concluida ? "pendente" : "concluida";
    const ok = await tasksService.updateTaskStatus(
      tarefaId,
      novoStatus,
      user.id
    );
    if (!ok) return;

    // Buscar os dados atualizados da tarefa do banco
    const tarefaAtualizada = await tasksService.getTaskById(tarefaId);
    if (tarefaAtualizada) {
      setTarefasState((prevTarefas) =>
        prevTarefas.map((tarefa) =>
          tarefa.id === tarefaId
            ? {
                ...tarefa,
                concluida: tarefaAtualizada.status === "concluida",
                dataConlusao: tarefaAtualizada.completed_at
                  ? new Date(tarefaAtualizada.completed_at)
                  : undefined,
              }
            : tarefa
        )
      );
    }
  };

  // Função para formatar data e hora
  const formatarDataHora = (data: Date) => {
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Função para excluir tarefa
  const excluirTarefa = async (tarefaId: string) => {
    try {
      // Primeiro, buscar a tarefa para obter as imagens
      const { data: taskData, error: fetchError } = await supabase
        .from("tasks")
        .select("images")
        .eq("id", tarefaId)
        .single();

      if (fetchError) {
        console.error("Erro ao buscar tarefa:", fetchError);
        alert("Erro ao buscar tarefa. Tente novamente.");
        return;
      }

      // Excluir imagens do Supabase Storage se existirem
      if (taskData?.images && taskData.images.length > 0) {
        const fileNames = taskData.images
          .map(
            (url: string) => url.split("/").pop() // Extrair nome do arquivo da URL
          )
          .filter(Boolean);

        if (fileNames.length > 0) {
          const { error: deleteImagesError } = await supabase.storage
            .from("task-images")
            .remove(fileNames);

          if (deleteImagesError) {
            console.error("Erro ao excluir imagens:", deleteImagesError);
            // Continuar mesmo se houver erro ao excluir imagens
          }
        }
      }

      // Excluir comentários associados à tarefa
      const { error: deleteCommentsError } = await supabase
        .from("comments")
        .delete()
        .eq("task_id", tarefaId);

      if (deleteCommentsError) {
        console.error("Erro ao excluir comentários:", deleteCommentsError);
        // Continuar mesmo se houver erro ao excluir comentários
      }

      // Excluir do banco de dados
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", tarefaId);

      if (error) {
        console.error("Erro ao excluir tarefa:", error);
        alert("Erro ao excluir tarefa. Tente novamente.");
        return;
      }

      // Remover do estado local apenas se a exclusão foi bem-sucedida
      setTarefasState((prevTarefas) =>
        prevTarefas.filter((tarefa) => tarefa.id !== tarefaId)
      );

      // Limpar estado do swipe
      setSwipeStates((prev) => {
        const newState = { ...prev };
        delete newState[tarefaId];
        return newState;
      });
    } catch (error) {
      console.error("Erro inesperado ao excluir tarefa:", error);
      alert("Erro inesperado ao excluir tarefa. Tente novamente.");
    }
  };

  // Funções de swipe
  const handleTouchStart = (e: React.TouchEvent, tarefaId: string) => {
    const touch = e.touches[0];
    setSwipeStates((prev) => ({
      ...prev,
      [tarefaId]: {
        ...prev[tarefaId],
        startX: touch.clientX,
        translateX: prev[tarefaId]?.translateX || 0,
        isDeleting: false,
      },
    }));
  };

  const handleTouchMove = (e: React.TouchEvent, tarefaId: string) => {
    const touch = e.touches[0];
    const swipeState = swipeStates[tarefaId];

    if (swipeState?.startX !== undefined) {
      const deltaX = touch.clientX - swipeState.startX;
      const newTranslateX = Math.min(0, deltaX); // Só permite swipe para a esquerda
      const screenWidth = window.innerWidth;
      const deleteThreshold = -screenWidth * 0.7; // 70% da largura da tela

      setSwipeStates((prev) => ({
        ...prev,
        [tarefaId]: {
          ...prev[tarefaId],
          translateX: newTranslateX,
          isDeleting: newTranslateX < deleteThreshold, // Marca para exclusão se passou de 70% da tela
        },
      }));
    }
  };

  const handleTouchEnd = (tarefaId: string) => {
    const swipeState = swipeStates[tarefaId];

    if (swipeState) {
      if (swipeState.isDeleting) {
        // Animar completamente para fora da tela antes de excluir
        setSwipeStates((prev) => ({
          ...prev,
          [tarefaId]: {
            ...prev[tarefaId],
            translateX: -window.innerWidth,
            isDeleting: true,
          },
        }));

        // Aguardar animação terminar antes de excluir
        setTimeout(() => {
          excluirTarefa(tarefaId);
        }, 300);
      } else {
        // Senão, voltar à posição original
        setSwipeStates((prev) => ({
          ...prev,
          [tarefaId]: {
            ...prev[tarefaId],
            translateX: 0,
            isDeleting: false,
          },
        }));
      }
    }
  };

  // Filtrar tarefas por prioridade
  const tarefasFiltradas =
    filtroPrioridade === "todas"
      ? tarefasState
      : tarefasState.filter((tarefa) => tarefa.prioridade === filtroPrioridade);

  const getPrioridadeStyle = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return "bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium";
      case "media":
        return "bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium";
      case "baixa":
        return "bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium";
      default:
        return "bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium";
    }
  };

  const getPrioridadeText = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return "Alta";
      case "media":
        return "Média";
      case "baixa":
        return "Baixa";
      default:
        return prioridade;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className={`${
          isModalOpen ? "" : "sticky top-0"
        } z-50 bg-white px-4 py-4 flex items-center shadow-sm`}
      >
        <Link href="/inicio" className="mr-4">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">{titulo}</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Seção de Colaboradores - apenas para contratantes */}
        {userType === "contratante" && !isLoadingUserType && (
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Colaboradores da Lista
              </h3>
              <span className="text-sm text-gray-500">
                ({colaboradores.length})
              </span>
            </div>

            {isLoadingColaboradores ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-2">
                  Carregando colaboradores...
                </p>
              </div>
            ) : colaboradores.length > 0 ? (
              <div className="space-y-3">
                {colaboradores.map((colaborador) => (
                  <Link
                    key={colaborador.id}
                    href={`/prestador/${colaborador.id}`}
                    className="block"
                  >
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {colaborador.avatar_url ? (
                          <img
                            src={colaborador.avatar_url}
                            alt={colaborador.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 font-semibold text-sm">
                            {colaborador.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {colaborador.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {colaborador.email}
                        </p>
                        {colaborador.phone && (
                          <p className="text-xs text-gray-400 truncate">
                            {colaborador.phone}
                          </p>
                        )}
                      </div>

                      {/* Status e Data */}
                      <div className="text-right flex-shrink-0">
                        {colaborador.status === "pending" ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Convite Pendente
                            </span>
                            <p className="text-xs text-gray-400">
                              Convite enviado em{" "}
                              {new Date(
                                colaborador.created_at
                              ).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Ativo
                            </span>
                            <p className="text-xs text-gray-400">
                              Entrou em{" "}
                              {new Date(
                                colaborador.created_at
                              ).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Nenhum colaborador foi adicionado a esta lista ainda.
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Convide prestadores para colaborar nas tarefas.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Filtros por Prioridade */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            Filtrar por Prioridade
          </h3>
          <div className="flex space-x-3 overflow-x-auto pb-2">
            <button
              onClick={() => setFiltroPrioridade("todas")}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all whitespace-nowrap ${
                filtroPrioridade === "todas"
                  ? "border-gray-500 bg-gray-50 text-gray-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              Todas
            </button>

            <button
              onClick={() => setFiltroPrioridade("alta")}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all whitespace-nowrap ${
                filtroPrioridade === "alta"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-red-300"
              }`}
            >
              Alta
            </button>

            <button
              onClick={() => setFiltroPrioridade("media")}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all whitespace-nowrap ${
                filtroPrioridade === "media"
                  ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-yellow-300"
              }`}
            >
              Média
            </button>

            <button
              onClick={() => setFiltroPrioridade("baixa")}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all whitespace-nowrap ${
                filtroPrioridade === "baixa"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-green-300"
              }`}
            >
              Baixa
            </button>
          </div>
        </div>

        {/* Botão Adicionar Nova Tarefa - apenas para contratantes */}
        {userType === "contratante" && !isLoadingUserType && (
          <div className="flex justify-center">
            <Link
              href={`/nova-tarefa?from=lista&lista=${extractIdFromSlug(
                String(slug)
              )}`}
              className="w-full max-w-sm"
            >
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                <Plus className="w-5 h-5" />
                <span>Adicionar Nova Tarefa</span>
              </button>
            </Link>
          </div>
        )}

        {/* Lista de Tarefas com Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={() => {
            // Prevenir scroll durante o drag
            document.body.style.overflow = "hidden";
          }}
          onDragCancel={() => {
            // Restaurar scroll quando o drag é cancelado
            document.body.style.overflow = "auto";
          }}
        >
          <SortableContext
            items={tarefasFiltradas.map((tarefa) => tarefa.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {tarefasFiltradas.map((tarefa) => (
                <DraggableTaskCard
                  key={tarefa.id}
                  tarefa={tarefa}
                  slug={String(slug)}
                  onToggleComplete={toggleTarefaConcluida}
                  onDelete={excluirTarefa}
                  swipeStates={swipeStates}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  userType={userType}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Mensagem se não houver tarefas */}
        {tarefasFiltradas.length === 0 && tarefasState.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Nenhuma tarefa encontrada com essa prioridade.
            </p>
          </div>
        )}

        {tarefasState.length === 0 && (
          <div className="text-center py-10">
            <div className="mx-auto">
              <Image
                src="/image/Nenhuma tarefa.webp"
                alt="Nenhuma tarefa nesta lista"
                width={512}
                height={320}
                className="mx-auto w-full max-w-md h-auto object-contain"
                priority
              />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mt-4">
              Ainda não há tarefas nesta lista
            </h3>
            <p className="text-gray-500 mt-1">
              Toque em “Adicionar Nova Tarefa” para começar a organizar.
            </p>
          </div>
        )}
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>
    </div>
  );
}
