"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { useModal } from "@/contexts/modal-context";
import { taskListsService } from "@/lib/task-lists";
import { serviceProvidersService } from "@/lib/service-providers";
import { extractIdFromSlug } from "@/lib/slug";
import { User } from "@/types";

interface ColaboradorComStatus extends User {
  status: "active" | "pending";
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Save,
  X,
  Sparkles,
  ChefHat,
  Bath,
  Bed,
  Sun,
  Archive,
  Settings,
  Users,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export default function EditarListaPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isModalOpen } = useModal();

  const [lista, setLista] = useState<any>(null);
  const [nomeLista, setNomeLista] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("limpeza-geral");
  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [prestadores, setPrestadores] = useState<User[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorComStatus[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [colaboradorToRemove, setColaboradorToRemove] =
    useState<ColaboradorComStatus | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const categorias = [
    {
      id: "limpeza-geral",
      nome: "Limpeza Geral",
      icone: Sparkles,
      cor: "border-green-500 bg-green-50 text-green-700",
      corInativa: "border-gray-200 bg-gray-100 text-gray-600",
    },
    {
      id: "cozinha",
      nome: "Cozinha",
      icone: ChefHat,
      cor: "border-orange-500 bg-orange-50 text-orange-700",
      corInativa: "border-gray-200 bg-gray-100 text-gray-600",
    },
    {
      id: "banheiro",
      nome: "Banheiro",
      icone: Bath,
      cor: "border-blue-500 bg-blue-50 text-blue-700",
      corInativa: "border-gray-200 bg-gray-100 text-gray-600",
    },
    {
      id: "quartos",
      nome: "Quartos",
      icone: Bed,
      cor: "border-purple-500 bg-purple-50 text-purple-700",
      corInativa: "border-gray-200 bg-gray-100 text-gray-600",
    },
    {
      id: "area-externa",
      nome: "Área Externa",
      icone: Sun,
      cor: "border-emerald-500 bg-emerald-50 text-emerald-700",
      corInativa: "border-gray-200 bg-gray-100 text-gray-600",
    },
    {
      id: "organizacao",
      nome: "Organização",
      icone: Archive,
      cor: "border-indigo-500 bg-indigo-50 text-indigo-700",
      corInativa: "border-gray-200 bg-gray-100 text-gray-600",
    },
    {
      id: "manutencao",
      nome: "Manutenção",
      icone: Settings,
      cor: "border-red-500 bg-red-50 text-red-700",
      corInativa: "border-gray-200 bg-gray-100 text-gray-600",
    },
  ];

  // Carregar dados da lista e prestadores
  useEffect(() => {
    const loadData = async () => {
      if (!slug || !user) return;

      try {
        // Carregar lista
        const listId = extractIdFromSlug(String(slug));

        if (!listId) {
          setError("ID da lista inválido");
          return;
        }

        const listaCarregada = await taskListsService.getTaskListById(listId);

        if (!listaCarregada) {
          setError("Lista não encontrada");
          return;
        }

        // Verificar se o usuário é o criador da lista
        if (listaCarregada.creator_id !== user.id) {
          setError("Você não tem permissão para editar esta lista");
          return;
        }

        // Definir a lista no estado
        setLista(listaCarregada);

        setNomeLista(listaCarregada.name);
        setDescricao(listaCarregada.description || "");
        setCategoria(listaCarregada.category || "limpeza-geral");
        setPrestadorId(listaCarregada.service_provider_id || null);

        // Carregar prestadores de serviço
        const prestadoresData =
          await serviceProvidersService.getServiceProviders();
        setPrestadores(prestadoresData);

        // Carregar colaboradores da lista usando o ID completo da lista
        await fetchColaboradores(listaCarregada.id);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setError("Erro ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug, user]);

  // Função para buscar colaboradores da lista e convites pendentes
  const fetchColaboradores = async (listId: string) => {
    try {
      const { supabase } = await import("@/lib/supabase");

      console.log(
        "Buscando colaboradores e convites pendentes para lista:",
        listId
      );

      // Buscar colaboradores ativos
      const { data: colaboradoresIds, error: idsError } = await supabase
        .from("list_collaborators")
        .select("user_id, created_at")
        .eq("list_id", listId);

      if (idsError) {
        console.error("Erro ao buscar IDs dos colaboradores:", idsError);
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

      console.log("IDs dos colaboradores:", colaboradoresIds);
      console.log("IDs dos convites pendentes:", convitesPendentesIds);

      // Combinar todos os IDs de usuários
      const colaboradoresAtivosIds =
        colaboradoresIds?.map((c) => c.user_id) || [];
      const convitesPendentesUserIds =
        convitesPendentesIds?.map((c) => c.invitee_id) || [];
      const todosOsUserIds = [
        ...colaboradoresAtivosIds,
        ...convitesPendentesUserIds,
      ];

      if (todosOsUserIds.length === 0) {
        setColaboradores([]);
        return;
      }

      // Buscar dados de todos os usuários de uma vez
      const { data: usersData, error: usersError } = await supabase
        .from("user")
        .select("id, name, email, phone, avatar_url")
        .in("id", todosOsUserIds);

      if (usersError) {
        console.error("Erro ao buscar dados dos usuários:", usersError);
        return;
      }

      console.log("Dados dos usuários:", usersData);

      // Mapear colaboradores ativos
      const colaboradoresAtivos =
        colaboradoresIds
          ?.map((colaborador: any) => {
            const userData = usersData?.find(
              (user: any) => user.id === colaborador.user_id
            );
            return {
              id: userData?.id,
              name: userData?.name,
              email: userData?.email,
              phone: userData?.phone,
              avatar_url: userData?.avatar_url,
              created_at: colaborador.created_at,
              updated_at: colaborador.updated_at || colaborador.created_at,
              status: "active" as const,
            };
          })
          .filter((col) => col.id) || [];

      // Mapear convites pendentes
      const convitesPendentes =
        convitesPendentesIds
          ?.map((convite: any) => {
            const userData = usersData?.find(
              (user: any) => user.id === convite.invitee_id
            );
            return {
              id: userData?.id,
              name: userData?.name,
              email: userData?.email,
              phone: userData?.phone,
              avatar_url: userData?.avatar_url,
              created_at: convite.created_at,
              updated_at: convite.updated_at || convite.created_at,
              status: "pending" as const,
            };
          })
          .filter((col) => col.id) || [];

      // Combinar colaboradores ativos e convites pendentes
      const todosColaboradores = [...colaboradoresAtivos, ...convitesPendentes];

      console.log("Todos os colaboradores mapeados:", todosColaboradores);
      setColaboradores(todosColaboradores);
    } catch (error) {
      console.error("Erro ao buscar colaboradores:", error);
    }
  };

  // Função para remover colaborador da lista
  const handleRemoveColaborador = async (colaborador: ColaboradorComStatus) => {
    setColaboradorToRemove(colaborador);
    setShowRemoveModal(true);
  };

  // Função para confirmar remoção do colaborador
  const confirmRemoveColaborador = async () => {
    if (!colaboradorToRemove || !slug) return;

    setIsRemoving(true);
    try {
      const { supabase } = await import("@/lib/supabase");

      // Usar o ID completo da lista que já foi carregado
      const listId = extractIdFromSlug(String(slug));

      if (!listId) {
        setError("ID da lista inválido");
        setIsRemoving(false);
        return;
      }

      const currentLista = await taskListsService.getTaskListById(listId);
      if (!currentLista) {
        setError("Lista não encontrada");
        setIsRemoving(false);
        return;
      }

      const colaboradorId = colaboradorToRemove.id;

      console.log("Removendo colaborador:", {
        listId,
        colaboradorId,
        colaboradorName: colaboradorToRemove.name,
      });

      // Remover colaborador da tabela list_collaborators
      const { data: removeData, error: removeError } = await supabase
        .from("list_collaborators")
        .delete()
        .eq("list_id", listId)
        .eq("user_id", colaboradorId)
        .select(); // Adicionar select para ver o que foi removido

      console.log("Resultado da remoção:", { removeData, removeError });

      if (removeError) {
        console.error("Erro ao remover colaborador:", removeError);
        setError(`Erro ao remover colaborador: ${removeError.message}`);
        return;
      }

      console.log("Colaborador removido com sucesso:", removeData);

      // Atualizar status do convite para 'expired' se existir
      const { error: updateInviteError } = await supabase
        .from("list_invitations")
        .update({ status: "expired" })
        .eq("list_id", listId)
        .eq("invitee_id", colaboradorId)
        .eq("status", "accepted");

      if (updateInviteError) {
        console.error(
          "Erro ao atualizar status do convite:",
          updateInviteError
        );
      } else {
        console.log("Status do convite atualizado para 'expired'");
      }

      // Remover da lista local
      setColaboradores((prev) =>
        prev.filter((col) => col.id !== colaboradorToRemove.id)
      );

      // Fechar modal
      setShowRemoveModal(false);
      setColaboradorToRemove(null);
    } catch (error) {
      console.error("Erro ao remover colaborador:", error);
      setError("Erro inesperado ao remover colaborador");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSalvar = async () => {
    if (!user || !slug) return;

    if (!nomeLista.trim()) {
      setError("Nome da lista é obrigatório");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const listId = extractIdFromSlug(String(slug));

      if (!listId) {
        setError("ID da lista inválido");
        setIsSaving(false);
        return;
      }

      await taskListsService.updateTaskList(listId, {
        name: nomeLista.trim(),
        description: descricao.trim() || null,
        category: categoria,
        service_provider_id: prestadorId,
      });

      // Mostrar modal de sucesso
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Erro ao salvar lista:", error);
      setError("Erro inesperado ao salvar lista. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push(`/lista/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
          <h1 className="text-lg font-semibold text-gray-800">Editar Lista</h1>
        </div>

        <div className="px-4 py-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50">
          {/* Background Blur */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseSuccessModal}
          />

          {/* Modal Content */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl">
            <div className="space-y-6">
              {/* Ícone de Sucesso */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Lista Atualizada!
                </h2>
                <p className="text-gray-600">
                  As alterações foram salvas com sucesso.
                </p>
              </div>

              {/* Botão */}
              <Button
                onClick={handleCloseSuccessModal}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg rounded-xl"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Remover Colaborador */}
      {showRemoveModal && colaboradorToRemove && (
        <div className="fixed inset-0 z-50">
          {/* Background Blur */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRemoveModal(false)}
          />

          {/* Modal Content */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl">
            <div className="space-y-6">
              {/* Ícone de Aviso */}
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Remover Colaborador
                </h2>
                <p className="text-gray-600">
                  Tem certeza que deseja remover{" "}
                  <span className="font-semibold">
                    {colaboradorToRemove.name}
                  </span>{" "}
                  desta lista?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Esta ação não pode ser desfeita.
                </p>
              </div>

              {/* Botões */}
              <div className="space-y-3">
                <Button
                  onClick={confirmRemoveColaborador}
                  disabled={isRemoving}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-4 text-lg rounded-xl"
                >
                  {isRemoving ? "Removendo..." : "Sim, Remover"}
                </Button>
                <Button
                  onClick={() => setShowRemoveModal(false)}
                  disabled={isRemoving}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 font-semibold py-4 text-lg rounded-xl"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={`${
          isModalOpen ? "" : "sticky top-0"
        } z-50 bg-white px-4 py-4 flex items-center shadow-sm`}
      >
        <Link href={`/lista/${slug}`} className="mr-4">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">Editar Lista</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {/* Nome da Lista */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-3">
            Nome da Lista
          </label>
          <Input
            placeholder="Ex: Tarefas da Semana"
            value={nomeLista}
            onChange={(e) => setNomeLista(e.target.value)}
            className="w-full py-4 px-4 text-base bg-white border-gray-200 rounded-xl"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-3">
            Descrição (Opcional)
          </label>
          <Textarea
            placeholder="Descreva o propósito desta lista ou adicione instruções especiais..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full py-4 px-4 text-base bg-white border-gray-200 rounded-xl resize-none"
            rows={3}
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-4">
            Categoria
          </label>
          <div className="grid grid-cols-2 gap-3">
            {categorias.map((cat) => {
              const IconeComponent = cat.icone;
              const isSelected = categoria === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoria(cat.id)}
                  className={`p-6 rounded-xl border-2 flex flex-col items-center space-y-3 transition-all ${
                    isSelected ? cat.cor : cat.corInativa
                  } hover:border-green-400`}
                >
                  <IconeComponent className="w-8 h-8" />
                  <span className="font-medium">{cat.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Adicionar Prestador */}
        <div>
          <div className="flex items-center justify-center">
            <Link
              href={`/convidar-prestador?etapa=buscar&listaId=${lista?.id}`}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                + Adicionar Prestador
              </Button>
            </Link>
          </div>
        </div>

        {/* Seção de Colaboradores */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Colaboradores ({colaboradores.length})
            </h3>
          </div>

          {colaboradores.length > 0 ? (
            <div className="space-y-3">
              {colaboradores.map((colaborador) => (
                <div
                  key={colaborador.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border"
                >
                  {/* Informações do Colaborador */}
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      {colaborador.avatar_url ? (
                        <img
                          src={colaborador.avatar_url}
                          alt={colaborador.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 font-semibold text-lg">
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
                  </div>

                  {/* Status e Botão Remover */}
                  <div className="flex items-center space-x-3">
                    {/* Tag de Status */}
                    {colaborador.status === "pending" ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Convite Pendente
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ativo
                      </span>
                    )}

                    {/* Botão Remover - apenas para colaboradores ativos */}
                    {colaborador.status === "active" && (
                      <button
                        onClick={() => handleRemoveColaborador(colaborador)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover colaborador"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-lg shadow-sm border">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Nenhum colaborador foi adicionado a esta lista ainda.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Use o botão "Adicionar Prestador" para convidar colaboradores.
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40">
        <Button
          onClick={handleSalvar}
          disabled={!nomeLista.trim() || isSaving}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 text-lg rounded-xl"
        >
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Padding bottom para compensar o botão fixo e a navegação */}
      <div className="h-40"></div>
    </div>
  );
}
