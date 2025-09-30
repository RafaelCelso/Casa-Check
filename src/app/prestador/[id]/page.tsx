"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Phone,
  MapPin,
  Wrench,
  UserPlus,
  StarIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { serviceProvidersService } from "@/lib/service-providers";
import { taskListsService } from "@/lib/task-lists";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { invitationsService } from "@/lib/invitations";

interface Avaliacao {
  id: string;
  autor: string;
  foto: string;
  data: string;
  estrelas: number;
  comentario: string;
  likes: number;
  dislikes: number;
}

interface Prestador {
  id: string;
  nome: string;
  servicos: string;
  avaliacao: number;
  totalServicos: number;
  anosExperiencia: number;
  telefone: string;
  localizacao: string;
  tiposServico: string;
  foto: string;
  avaliacoes: Avaliacao[];
  distribuicaoAvaliacoes: {
    "5": number;
    "4": number;
    "3": number;
    "2": number;
    "1": number;
  };
}

export default function PrestadorPage() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const providerId =
    typeof routeParams?.id === "string"
      ? routeParams.id
      : Array.isArray(routeParams?.id)
      ? routeParams.id[0]
      : "";
  const [jaAvaliado, setJaAvaliado] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);
  const [listaSelecionada, setListaSelecionada] = useState<any>(null);
  const [listaProcessando, setListaProcessando] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [listas, setListas] = useState<any[]>([]);
  const [isLoadingListas, setIsLoadingListas] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Limpar estilo de overflow quando componente for desmontado
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Verificar se o prestador já foi avaliado
  useEffect(() => {
    const avaliacoesSalvas = localStorage.getItem("avaliacoes");
    if (avaliacoesSalvas && providerId) {
      const avaliacoes = JSON.parse(avaliacoesSalvas);
      if (avaliacoes[providerId]) {
        setJaAvaliado(true);
      }
    }
  }, [providerId]);

  // Função para voltar
  const handleVoltar = () => {
    if (searchParams.get("from") === "services") {
      router.push("/mais");
    } else {
      router.back();
    }
  };

  // Função para carregar listas reais do usuário
  const loadListas = async () => {
    if (!user?.id) return;

    setIsLoadingListas(true);
    try {
      const listasData = await taskListsService.getUserTaskLists(user.id);

      // Mapear as listas para o formato esperado pelo modal
      const listasMapeadas = listasData.map((lista) => ({
        id: lista.id,
        nome: lista.name,
        descricao: lista.description || "",
        cor: "blue", // Cor padrão
        progresso: lista.tasks
          ? Math.round(
              (lista.tasks.filter((t) => t.status === "concluida").length /
                lista.tasks.length) *
                100
            )
          : 0,
        totalTarefas: lista.tasks?.length || 0,
        tarefasConcluidas:
          lista.tasks?.filter((t) => t.status === "concluida").length || 0,
      }));

      setListas(listasMapeadas);

      // Verificar se há scroll disponível após carregar as listas
      setTimeout(() => {
        const scrollContainer = document.querySelector(".overflow-y-auto");
        if (scrollContainer) {
          const isScrollable =
            scrollContainer.scrollHeight > scrollContainer.clientHeight;
          setShowScrollIndicator(isScrollable);
          console.log("Scroll disponível:", isScrollable, {
            scrollHeight: scrollContainer.scrollHeight,
            clientHeight: scrollContainer.clientHeight,
          });
        }
      }, 200); // Aumentar timeout para garantir que o DOM foi renderizado
    } catch (error) {
      console.error("Erro ao carregar listas:", error);
      setListas([]);
    } finally {
      setIsLoadingListas(false);
    }
  };

  // Funções para controlar o modal
  const openModal = () => {
    setIsModalOpen(true);
    loadListas(); // Carregar listas quando abrir o modal

    // Prevenir scroll da página principal
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      setIsAnimating(true);
    }, 10);
  };

  const closeModal = () => {
    setIsAnimating(false);

    // Restaurar scroll da página principal
    document.body.style.overflow = "unset";

    setTimeout(() => {
      setIsModalOpen(false);
    }, 300);
  };

  const handleEnviarConviteLista = async (lista: any) => {
    // Usar o ID real do prestador dos dados carregados
    const realProviderId = prestador?.id;

    console.log("Iniciando envio de convite:", {
      userId: user?.id,
      providerId: realProviderId,
      providerSlug: providerId,
      listaId: lista.id,
      listaName: lista.nome, // Usar 'nome' ao invés de 'name'
    });

    if (!user?.id || !realProviderId) {
      console.error("Usuário ou prestador não encontrado:", {
        userId: user?.id,
        providerId: realProviderId,
        prestador: prestador,
      });
      return;
    }

    try {
      // Iniciar carregamento
      setListaProcessando(lista.id);

      // Enviar convite real
      const conviteEnviado = await invitationsService.sendInvitation(
        lista.id,
        realProviderId,
        `Convite para colaborar na lista "${lista.nome}"`
      );

      if (conviteEnviado) {
        console.log("Convite enviado com sucesso:", conviteEnviado);

        // Parar carregamento
        setListaProcessando(null);

        // Fechar modal de listas
        closeModal();

        // Mostrar modal de confirmação
        setListaSelecionada(lista);
        setShowConfirmacao(true);
      } else {
        throw new Error("Falha ao enviar convite");
      }
    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);

      // Parar carregamento em caso de erro
      setListaProcessando(null);

      // Tratar diferentes tipos de erro
      let errorMessage = "Erro ao enviar convite. Tente novamente.";

      if (error.message === "ALREADY_ACCEPTED") {
        errorMessage =
          "Este prestador já foi convidado para esta lista e aceitou o convite.";
      } else if (error.message.includes("já foi convidado")) {
        errorMessage = error.message;
      } else if (error.message.includes("Usuário não autenticado")) {
        errorMessage = "Você precisa estar logado para enviar convites.";
      } else if (error.message.includes("ID")) {
        errorMessage =
          "Dados inválidos. Recarregue a página e tente novamente.";
      }

      // Mostrar erro para o usuário
      alert(errorMessage);
    }
  };
  // Carregar dados reais do prestador
  useEffect(() => {
    const fetchProvider = async () => {
      if (!providerId) return;
      setIsLoading(true);
      const provider = await serviceProvidersService.getServiceProviderById(
        providerId
      );
      if (provider) {
        const servicos = Array.isArray(provider.service_types)
          ? provider.service_types.join(", ")
          : provider.service_types || "Serviços Domésticos";
        const novoPrestador: Prestador = {
          id: provider.id,
          nome: provider.name || "Prestador",
          servicos,
          avaliacao: provider.rating || 0,
          totalServicos: 0,
          anosExperiencia: 0,
          telefone: provider.phone || "",
          localizacao: provider.location || "",
          tiposServico: servicos,
          foto: provider.avatar_url || "/api/placeholder/96/96",
          distribuicaoAvaliacoes: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
          avaliacoes: [],
        };
        setPrestador(novoPrestador);
      }
      setIsLoading(false);
    };

    fetchProvider();
  }, [providerId]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-5 h-5 text-green-500 fill-current" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className="w-5 h-5 text-gray-300 fill-current" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="w-5 h-5 text-green-500 fill-current" />
          </div>
        </div>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />);
    }

    return stars;
  };

  const getBarWidth = (percentage: number) => {
    return `${percentage}%`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!prestador) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        Prestador não encontrado
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button
            onClick={handleVoltar}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Prestador</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-24 pb-6 space-y-6">
        {/* Profile Summary */}
        <div className="text-center">
          {/* Profile Picture */}
          <div className="w-24 h-24 mx-auto mb-4">
            <Avatar className="w-24 h-24">
              <AvatarImage
                src={prestador.foto}
                alt={`Foto de ${prestador.nome}`}
              />
              <AvatarFallback className="text-lg font-semibold">
                {prestador.nome
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {prestador.nome}
          </h2>

          {/* Service Type */}
          <p className="text-gray-500 mb-6">{prestador.servicos}</p>
        </div>

        {/* Informações */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Informações
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">Telefone</span>
              </div>
              <span className="text-gray-800 font-medium">
                {prestador.telefone}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">Localização</span>
              </div>
              <span className="text-gray-800 font-medium">
                {prestador.localizacao}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wrench className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">Serviços</span>
              </div>
              <span className="text-gray-800 font-medium">
                {prestador.tiposServico}
              </span>
            </div>
          </div>
        </div>

        {/* Avaliações */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Avaliações
          </h3>

          {/* Overall Rating */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {prestador.avaliacao}
            </div>
            <div className="flex justify-center mb-4">
              {renderStars(prestador.avaliacao)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 mb-6">
            {searchParams.get("from") === "services" && !jaAvaliado ? (
              // Botão de Avaliar quando vindo dos serviços recebidos e não foi avaliado
              <Link href={`/avaliar/${prestador.id}`} className="flex-1">
                <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-2 rounded-md transition-colors flex items-center justify-center space-x-1 text-sm">
                  <StarIcon className="w-3 h-3" />
                  <span>Avaliar</span>
                </button>
              </Link>
            ) : searchParams.get("from") === "services" && jaAvaliado ? (
              // Mensagem quando já foi avaliado
              <div className="flex-1 bg-green-100 text-green-700 font-medium py-2 px-2 rounded-md flex items-center justify-center space-x-1 text-sm">
                <Star className="w-3 h-3 fill-current" />
                <span>Já Avaliado</span>
              </div>
            ) : (
              // Botão normal quando acessado diretamente
              <button
                onClick={openModal}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-2 rounded-md transition-colors flex items-center justify-center space-x-1 text-sm"
              >
                <UserPlus className="w-3 h-3" />
                <span>Contratar</span>
              </button>
            )}
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2 mb-6">
            {Object.entries(prestador.distribuicaoAvaliacoes)
              .reverse()
              .map(([stars, percentage]) => (
                <div key={stars} className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 w-4">{stars}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: getBarWidth(percentage) }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {percentage}%
                  </span>
                </div>
              ))}
          </div>

          {/* Individual Reviews */}
          <div className="space-y-4">
            {prestador.avaliacoes.map((avaliacao) => (
              <div key={avaliacao.id} className="border-t border-gray-100 pt-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Image
                      src={avaliacao.foto}
                      alt={avaliacao.autor}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-800">
                        {avaliacao.autor}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {avaliacao.data}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      {renderStars(avaliacao.estrelas)}
                    </div>
                    <p className="text-gray-700 mb-3">{avaliacao.comentario}</p>
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">{avaliacao.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors">
                        <ThumbsDown className="w-4 h-4" />
                        <span className="text-sm">{avaliacao.dislikes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Contratação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* Blur Background */}
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[50vh] ${
              isAnimating ? "translate-y-0" : "translate-y-full"
            }`}
            onTouchMove={(e) => {
              // Prevenir scroll da página quando tocar no modal
              e.stopPropagation();
            }}
            onWheel={(e) => {
              // Prevenir scroll da página quando usar wheel no modal
              e.stopPropagation();
            }}
          >
            <div className="flex flex-col h-full">
              {/* Header fixo */}
              <div className="p-6 pb-4 border-b border-gray-100">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Escolha uma Lista
                  </h2>
                  <p className="text-sm text-gray-600">
                    Selecione a lista de tarefas para enviar convite para{" "}
                    <span className="font-semibold text-green-600">
                      {prestador.nome}
                    </span>
                  </p>
                </div>
              </div>

              {/* Área rolável */}
              <div
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                style={{
                  maxHeight: "calc(50vh - 140px)", // Altura máxima considerando header e footer
                  WebkitOverflowScrolling: "touch", // Scroll suave no iOS
                }}
                onScroll={(e) => {
                  const target = e.target as HTMLElement;
                  const isScrollable =
                    target.scrollHeight > target.clientHeight;
                  const isAtBottom =
                    target.scrollTop + target.clientHeight >=
                    target.scrollHeight - 5; // Margem menor para ser mais preciso
                  setShowScrollIndicator(isScrollable && !isAtBottom);
                }}
              >
                <div className="p-6 pt-4 space-y-4">
                  {/* Lista de Listas */}
                  <div className="space-y-3">
                    {isLoadingListas ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-3"></div>
                        <p className="text-gray-500">
                          Carregando suas listas...
                        </p>
                      </div>
                    ) : listas.length > 0 ? (
                      listas.map((lista) => (
                        <div
                          key={lista.id}
                          onClick={() => handleEnviarConviteLista(lista)}
                          className={`bg-gray-50 rounded-xl p-4 border border-gray-200 transition-all ${
                            listaProcessando === lista.id
                              ? "border-green-300 shadow-md cursor-wait opacity-75"
                              : "hover:border-green-300 hover:shadow-md cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-12 h-12 bg-${lista.cor}-100 rounded-full flex items-center justify-center relative`}
                              >
                                {listaProcessando === lista.id ? (
                                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg
                                    className={`w-6 h-6 text-${lista.cor}-600`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {lista.nome}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {listaProcessando === lista.id
                                    ? "Enviando convite..."
                                    : lista.descricao}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {listaProcessando === lista.id ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-sm font-medium text-green-600">
                                    Enviando...
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <div className="text-sm font-medium text-gray-600">
                                    {lista.tarefasConcluidas}/
                                    {lista.totalTarefas} tarefas
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {lista.progresso}% concluído
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2">
                            {listaProcessando === lista.id ? (
                              <div
                                className="bg-green-500 h-2 rounded-full animate-pulse"
                                style={{ width: "100%" }}
                              />
                            ) : (
                              <div
                                className={`bg-${lista.cor}-500 h-2 rounded-full transition-all duration-300`}
                                style={{ width: `${lista.progresso}%` }}
                              />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          Nenhuma lista encontrada
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Você precisa criar uma lista de tarefas antes de
                          convidar prestadores.
                        </p>
                        <Link
                          href="/nova-lista"
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Criar Nova Lista
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Indicador de scroll */}
                  {showScrollIndicator && (
                    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-1 animate-bounce">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                        <span>Role para ver mais</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer fixo com botão Cancelar */}
              <div className="p-6 pt-4 border-t border-gray-100">
                <button
                  onClick={closeModal}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Convite */}
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
                {prestador.nome}
              </span>{" "}
              na lista{" "}
              <span className="font-semibold text-blue-600">
                "{listaSelecionada?.nome}"
              </span>
              . O prestador receberá uma notificação e poderá aceitar o convite.
            </p>

            {/* Botões */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowConfirmacao(false);
                  setListaSelecionada(null);
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Enviar Outro Convite
              </button>

              <button
                onClick={() => {
                  setShowConfirmacao(false);
                  setListaSelecionada(null);
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Voltar ao Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>
    </div>
  );
}
