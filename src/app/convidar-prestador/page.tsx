"use client";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  User,
  MapPin,
  Star,
  Send,
  Users,
  Plus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { taskListsService } from "@/lib/task-lists";
import { serviceProvidersService } from "@/lib/service-providers";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { getCategoryIcon } from "@/lib/category-icons";
import { generateSlug } from "@/lib/slug";
import type { TaskCategory } from "@/types";

interface Lista {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  progresso: number;
  totalTarefas: number;
  tarefasConcluidas: number;
  categoria: TaskCategory;
}

interface Prestador {
  id: string;
  nome: string;
  servicos: string;
  localizacao: string;
  avaliacao: number;
  totalAvaliacoes: number;
  foto: string;
}

export default function ConvidarPrestadorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [etapa, setEtapa] = useState<"lista" | "buscar">("lista");
  const [listaSelecionada, setListaSelecionada] = useState<Lista | null>(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [prestadoresFiltrados, setPrestadoresFiltrados] = useState<Prestador[]>(
    []
  );
  const [loadingPrestadorId, setLoadingPrestadorId] = useState<string | null>(
    null
  );
  const [showConfirmacao, setShowConfirmacao] = useState(false);
  const [prestadorEnviado, setPrestadorEnviado] = useState<string>("");
  const [showAlreadyAcceptedModal, setShowAlreadyAcceptedModal] =
    useState(false);
  const [alreadyAcceptedPrestador, setAlreadyAcceptedPrestador] =
    useState<string>("");
  const [listas, setListas] = useState<Lista[]>([]);
  const [isLoadingListas, setIsLoadingListas] = useState(false);
  const [isLoadingPrestadores, setIsLoadingPrestadores] = useState(false);
  const [prestadoresStatus, setPrestadoresStatus] = useState<{
    [key: string]: "pending" | "active" | "none";
  }>({});

  // Detectar query parameter para definir etapa inicial e lista
  useEffect(() => {
    const etapaParam = searchParams.get("etapa");
    const listaIdParam = searchParams.get("listaId");

    if (etapaParam === "buscar") {
      setEtapa("buscar");

      // Se foi passado um listaId, buscar e definir a lista automaticamente
      if (listaIdParam && user?.id) {
        const buscarListaEspecifica = async () => {
          try {
            const listaEspecifica = await taskListsService.getTaskListById(
              listaIdParam
            );
            if (listaEspecifica) {
              setListaSelecionada({
                id: listaEspecifica.id,
                nome: listaEspecifica.name,
                descricao: listaEspecifica.description || "",
                cor: "blue",
                progresso: 0,
                totalTarefas: listaEspecifica.tasks?.length || 0,
                tarefasConcluidas:
                  listaEspecifica.tasks?.filter((t) => t.status === "concluida")
                    .length || 0,
                categoria: "limpeza-geral",
              });

              // Verificar status dos prestadores para esta lista
              checkPrestadoresStatus(listaEspecifica.id);
            }
          } catch (error) {
            console.error("Erro ao buscar lista específica:", error);
          }
        };

        buscarListaEspecifica();
      }
    }
  }, [searchParams, user?.id]);

  // Carregar listas do usuário
  useEffect(() => {
    const loadListas = async () => {
      if (!user?.id) return;

      setIsLoadingListas(true);
      try {
        const taskLists = await taskListsService.getUserTaskLists(user.id);

        // Converter para o formato esperado pela interface
        const listasFormatadas: Lista[] = taskLists.map((taskList) => ({
          id: taskList.id,
          nome: taskList.name,
          descricao: taskList.description || "",
          cor: "blue", // Cor padrão
          progresso: taskList.tasks
            ? (taskList.tasks.filter((task) => task.status === "concluida")
                .length /
                taskList.tasks.length) *
              100
            : 0,
          totalTarefas: taskList.tasks?.length || 0,
          tarefasConcluidas:
            taskList.tasks?.filter((task) => task.status === "concluida")
              .length || 0,
          categoria: (taskList.category || "limpeza-geral") as TaskCategory,
        }));

        setListas(listasFormatadas);
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
      } finally {
        setIsLoadingListas(false);
      }
    };

    loadListas();
  }, [user?.id]);

  // Dados mockados das listas removidos - agora usando dados reais do banco

  // Carregar prestadores reais do banco de dados
  useEffect(() => {
    const loadPrestadores = async () => {
      if (!user?.id) return;

      setIsLoadingPrestadores(true);
      try {
        const prestadoresData =
          await serviceProvidersService.getServiceProviders();

        // Converter dados do banco para formato da interface
        const prestadoresFormatados: Prestador[] = prestadoresData.map(
          (provider) => ({
            id: provider.id,
            nome: provider.name || "Nome não informado",
            servicos: Array.isArray(provider.service_types)
              ? provider.service_types.join(", ")
              : provider.service_types || "Serviços domésticos",
            localizacao: provider.location || "Localização não informada",
            avaliacao: provider.rating || 0,
            totalAvaliacoes: 0, // Campo não existe no banco ainda
            foto: provider.avatar_url || "/api/placeholder/60/60",
          })
        );

        setPrestadores(prestadoresFormatados);
        setPrestadoresFiltrados(prestadoresFormatados);
      } catch (error) {
        console.error("Erro ao carregar prestadores:", error);
      } finally {
        setIsLoadingPrestadores(false);
      }
    };

    loadPrestadores();
  }, [user?.id]);

  useEffect(() => {
    if (termoBusca.trim() === "") {
      setPrestadoresFiltrados(prestadores);
    } else {
      const filtrados = prestadores.filter(
        (prestador) =>
          prestador.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
          prestador.servicos.toLowerCase().includes(termoBusca.toLowerCase()) ||
          prestador.localizacao.toLowerCase().includes(termoBusca.toLowerCase())
      );
      setPrestadoresFiltrados(filtrados);
    }
  }, [termoBusca, prestadores]);

  const handleSelecionarLista = (lista: Lista) => {
    setListaSelecionada(lista);
    setEtapa("buscar");
    // Verificar status dos prestadores para esta lista
    checkPrestadoresStatus(lista.id);
  };

  // Função para verificar o status dos prestadores (colaborador ativo, convite pendente, ou nenhum)
  const checkPrestadoresStatus = async (listaId: string) => {
    if (!listaId) return;

    try {
      const { supabase } = await import("@/lib/supabase");
      const statusMap: { [key: string]: "pending" | "active" | "none" } = {};

      // Verificar colaboradores ativos
      const { data: colaboradores } = await supabase
        .from("list_collaborators")
        .select("user_id")
        .eq("list_id", listaId);

      if (colaboradores) {
        colaboradores.forEach((col) => {
          statusMap[col.user_id] = "active";
        });
      }

      // Verificar convites pendentes
      const { data: convitesPendentes } = await supabase
        .from("list_invitations")
        .select("invitee_id")
        .eq("list_id", listaId)
        .eq("status", "pending");

      if (convitesPendentes) {
        convitesPendentes.forEach((convite) => {
          statusMap[convite.invitee_id] = "pending";
        });
      }

      setPrestadoresStatus(statusMap);
    } catch (error) {
      console.error("Erro ao verificar status dos prestadores:", error);
    }
  };

  // Função para determinar o texto e estilo do botão baseado no status
  const getButtonConfig = (prestadorId: string) => {
    const status = prestadoresStatus[prestadorId] || "none";

    switch (status) {
      case "active":
        return {
          text: "Convite Enviado",
          disabled: true,
          className:
            "bg-gray-300 text-gray-500 cursor-not-allowed transform-none",
          icon: null,
        };
      case "pending":
        return {
          text: "Convite Enviado",
          disabled: true,
          className:
            "bg-gray-300 text-gray-500 cursor-not-allowed transform-none",
          icon: null,
        };
      default:
        return {
          text: "Enviar Convite",
          disabled: false,
          className:
            "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white",
          icon: <Send className="w-4 h-4" />,
        };
    }
  };

  const handleVoltar = () => {
    const etapaParam = searchParams.get("etapa");

    if (etapaParam === "buscar") {
      // Se veio da página de editar lista, volta para a página anterior
      router.back();
    } else if (etapa === "buscar") {
      // Se está na etapa buscar e veio normalmente, volta para lista
      setEtapa("lista");
      setListaSelecionada(null);
    } else {
      // Se estiver na etapa "lista", volta para a página anterior
      router.back();
    }
  };

  const handleEnviarConvite = async (prestador: Prestador) => {
    if (!user?.id || !listaSelecionada) {
      alert("Erro: Usuário não autenticado ou lista não selecionada.");
      return;
    }

    // Validar se o ID da lista é um UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(listaSelecionada.id)) {
      alert(
        "Erro: ID da lista inválido. Por favor, selecione uma lista válida."
      );
      return;
    }

    setLoadingPrestadorId(prestador.id);

    try {
      // Importar o serviço de convites
      const { invitationsService } = await import("@/lib/invitations");

      const invitation = await invitationsService.sendInvitation(
        listaSelecionada.id,
        prestador.id,
        `Convite para colaborar na lista "${listaSelecionada.nome}"`
      );

      if (invitation) {
        setPrestadorEnviado(prestador.nome);
        setShowConfirmacao(true);

        // Atualizar o status do prestador para 'pending'
        setPrestadoresStatus((prev) => ({
          ...prev,
          [prestador.id]: "pending",
        }));
      } else {
        // Mostrar erro se o convite não foi enviado
        alert("Erro ao enviar convite. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao enviar convite:", error);

      // Mostrar mensagem de erro mais específica
      let errorMessage = "Erro ao enviar convite. Tente novamente.";

      if (error instanceof Error) {
        if (error.message === "ALREADY_ACCEPTED") {
          setAlreadyAcceptedPrestador(prestador.nome);
          setShowAlreadyAcceptedModal(true);
          return; // Não mostrar alert, apenas o modal
        } else if (error.message.includes("ID da lista inválido")) {
          errorMessage =
            "Erro: Lista selecionada é inválida. Por favor, selecione uma lista válida.";
        } else if (error.message.includes("ID do prestador inválido")) {
          errorMessage =
            "Erro: Prestador selecionado é inválido. Tente novamente.";
        } else if (error.message.includes("duplicate key")) {
          errorMessage = "Este prestador já foi convidado para esta lista.";
        } else if (error.message.includes("foreign key")) {
          errorMessage =
            "Erro: Lista ou prestador não encontrado. Tente novamente.";
        }
      }

      alert(errorMessage);
    } finally {
      setLoadingPrestadorId(null);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 sm:w-4 sm:h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <button
            onClick={handleVoltar}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {etapa === "lista" ? "Convidar Prestador" : "Buscar Prestador"}
            </h1>
            {listaSelecionada && (
              <p className="text-sm text-gray-500">
                Para: {listaSelecionada.nome}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        {etapa === "lista" ? (
          /* Seleção de Lista */
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Selecione uma lista
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Escolha a lista para a qual você quer convidar um prestador
              </p>
            </div>

            <div className="space-y-3">
              {isLoadingListas ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando listas...</p>
                </div>
              ) : listas.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Nenhuma lista encontrada
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Crie uma lista primeiro para poder convidar prestadores
                  </p>
                  <Link
                    href="/nova-lista"
                    className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Lista
                  </Link>
                </div>
              ) : (
                listas.map((lista) => (
                  <div
                    key={lista.id}
                    onClick={() => handleSelecionarLista(lista)}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 bg-${lista.cor}-100 rounded-full flex items-center justify-center`}
                        >
                          {(() => {
                            const IconComponent = getCategoryIcon(
                              lista.categoria
                            );
                            return (
                              <IconComponent className="w-5 h-5 text-gray-600" />
                            );
                          })()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {lista.nome}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {lista.descricao}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-600">
                          {lista.tarefasConcluidas}/{lista.totalTarefas} tarefas
                        </div>
                        <div className="text-xs text-gray-400">
                          {lista.progresso}% concluído
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-${lista.cor}-500 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${lista.progresso}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Busca de Prestador */
          <div className="space-y-4">
            {!listaSelecionada ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Nenhuma lista selecionada
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Volte para a etapa anterior e selecione uma lista para
                      poder convidar prestadores.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setEtapa("lista")}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Voltar para Seleção de Lista
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Campo de Busca */}
                <div className="bg-white rounded-lg p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, serviço ou localização..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Lista de Prestadores */}
                <div className="space-y-3">
                  {isLoadingPrestadores ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <span className="ml-3 text-gray-600">
                        Carregando prestadores...
                      </span>
                    </div>
                  ) : prestadoresFiltrados.length > 0 ? (
                    prestadoresFiltrados.map((prestador) => (
                      <Link
                        key={prestador.id}
                        href={`/prestador/${generateSlug(prestador.nome)}`}
                        className="block"
                      >
                        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                          <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
                            {/* Avatar do prestador */}
                            <div className="flex justify-center sm:justify-start">
                              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 shadow-lg">
                                <AvatarImage
                                  src={prestador.foto}
                                  alt={`Foto de ${prestador.nome}`}
                                />
                                <AvatarFallback>
                                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                </AvatarFallback>
                              </Avatar>
                            </div>

                            <div className="flex-1 text-center sm:text-left">
                              {/* Header com nome e especialidade */}
                              <div className="mb-4">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
                                  {prestador.nome}
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">
                                  {prestador.servicos}
                                </p>
                              </div>

                              {/* Informações com ícones melhorados */}
                              <div className="space-y-3 mb-5">
                                {/* Avaliação */}
                                <div className="flex items-center justify-center sm:justify-start space-x-2">
                                  {renderStars(prestador.avaliacao)}
                                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                                    {prestador.avaliacao} (
                                    {prestador.totalAvaliacoes})
                                  </span>
                                </div>

                                {/* Localização */}
                                <div className="flex items-center justify-center sm:justify-start space-x-3">
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                                  </div>
                                  <span className="text-sm text-gray-600 font-medium">
                                    {prestador.localizacao}
                                  </span>
                                </div>
                              </div>

                              {/* Botão moderno */}
                              <div className="flex justify-center sm:justify-end">
                                {(() => {
                                  const buttonConfig = getButtonConfig(
                                    prestador.id
                                  );
                                  const isDisabled =
                                    loadingPrestadorId === prestador.id ||
                                    buttonConfig.disabled;

                                  return (
                                    <button
                                      onClick={(e) => {
                                        if (!isDisabled) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleEnviarConvite(prestador);
                                        }
                                      }}
                                      disabled={isDisabled}
                                      className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-105 w-auto sm:w-auto ${
                                        isDisabled
                                          ? buttonConfig.className
                                          : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                      }`}
                                    >
                                      {loadingPrestadorId === prestador.id ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          <span className="text-sm sm:text-base">
                                            Enviando...
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          {buttonConfig.icon}
                                          <span className="text-sm sm:text-base">
                                            {buttonConfig.text}
                                          </span>
                                        </>
                                      )}
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-sm border border-gray-100">
                      <div className="mx-auto mb-4 sm:mb-6">
                        <Image
                          src="/image/nenhum resultado.webp"
                          alt="Nenhum resultado encontrado"
                          width={512}
                          height={320}
                          className="mx-auto w-full max-w-md h-auto object-contain"
                          priority
                        />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2 sm:mb-3">
                        {prestadores.length === 0
                          ? "Nenhum prestador cadastrado"
                          : "Nenhum prestador encontrado"}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-500 font-medium">
                        {prestadores.length === 0
                          ? "Ainda não há prestadores de serviço disponíveis"
                          : "Tente ajustar os termos da sua busca"}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {showConfirmacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl">
            {/* Ícone de Sucesso */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
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

            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Convite Enviado!
            </h2>

            {/* Mensagem */}
            <p className="text-gray-600 mb-6">
              O convite foi enviado com sucesso para{" "}
              <span className="font-semibold text-green-600">
                {prestadorEnviado}
              </span>
              . O prestador receberá uma notificação e poderá aceitar o convite.
            </p>

            {/* Botões */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowConfirmacao(false);
                  setPrestadorEnviado("");
                  setTermoBusca("");
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Enviar Outro Convite
              </button>

              <button
                onClick={() => {
                  setShowConfirmacao(false);
                  setPrestadorEnviado("");

                  const etapaParam = searchParams.get("etapa");
                  if (etapaParam === "buscar") {
                    // Se veio de nova-lista ou editar-lista, volta para a página anterior
                    router.back();
                  } else {
                    // Se veio do fluxo normal, vai para a página inicial
                    router.push("/inicio");
                  }
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {searchParams.get("etapa") === "buscar"
                  ? "Voltar para a Lista"
                  : "Voltar às Listas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Prestador Já Aceito */}
      <Dialog
        open={showAlreadyAcceptedModal}
        onOpenChange={setShowAlreadyAcceptedModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Convite Já Aceito</DialogTitle>
          </DialogHeader>

          <div className="py-4 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {alreadyAcceptedPrestador}
            </h3>

            <p className="text-gray-600 text-sm">
              Este prestador já aceitou o convite para esta lista e já faz parte
              da equipe de colaboradores.
            </p>

            {listaSelecionada && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Lista:</p>
                <p className="text-base font-semibold text-blue-800">
                  {listaSelecionada.nome}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowAlreadyAcceptedModal(false);
                setAlreadyAcceptedPrestador("");
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
