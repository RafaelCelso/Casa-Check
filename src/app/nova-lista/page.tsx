"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Sparkles,
  TreePine,
  Wrench,
  Plus,
  UserPlus,
  ChevronRight,
  Home,
  ChefHat,
  Bath,
  Bed,
  Sun,
  Archive,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useModal } from "@/contexts/modal-context";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { taskListsService } from "@/lib/task-lists";
import { serviceProvidersService } from "@/lib/service-providers";
import { User } from "@/types";

export default function NovaListaPage() {
  const router = useRouter();
  const { isModalOpen } = useModal();
  const { user } = useAuth();
  const [nomeList, setNomeLista] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState("limpeza-geral");
  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [prestadores, setPrestadores] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Carregar prestadores de serviço
  useEffect(() => {
    const loadPrestadores = async () => {
      try {
        const prestadoresData =
          await serviceProvidersService.getServiceProviders();
        setPrestadores(prestadoresData);
      } catch (error) {
        console.error("Erro ao carregar prestadores:", error);
      }
    };

    loadPrestadores();
  }, []);

  const handleCriarLista = async () => {
    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    if (!nomeList.trim()) {
      setError("Nome da lista é obrigatório");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const novaLista = await taskListsService.createTaskList({
        name: nomeList.trim(),
        description: descricao.trim() || null,
        creator_id: user.id,
        category: categoriaSelecionada,
        service_provider_id: prestadorId,
      });

      console.log("Lista criada com sucesso:", novaLista);

      // Salvar ID da lista criada no localStorage para usar ao adicionar tarefas
      localStorage.setItem("listaCriada", novaLista.id);

      // Mostrar modal de confirmação
      openModal();
    } catch (error) {
      console.error("Erro ao criar lista:", error);
      setError("Erro inesperado ao criar lista. Tente novamente.");
    } finally {
      setIsCreating(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setTimeout(() => {
      setIsAnimating(true);
    }, 10);
  };

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowModal(false);
    }, 300);
  };

  const handleAdicionarTarefas = () => {
    closeModal();
    setTimeout(() => {
      // Usar o ID da lista recém criada
      const listaCriada = localStorage.getItem("listaCriada");
      if (listaCriada) {
        router.push(`/nova-tarefa?from=lista&lista=${listaCriada}`);
      } else {
        router.push("/nova-tarefa?from=lista");
      }
    }, 300);
  };

  const handleFinalizarLista = () => {
    closeModal();
    // Limpar o ID da lista do localStorage
    localStorage.removeItem("listaCriada");
    setTimeout(() => {
      router.push("/inicio");
    }, 300);
  };

  return (
    <>
      {/* Modal de Confirmação */}
      {showModal && (
        <div className="fixed inset-0 z-50">
          {/* Background Blur */}
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl transition-transform duration-300 ease-out ${
              isAnimating ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="space-y-6">
              {/* Título */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Lista Criada com Sucesso!
                </h2>
                <p className="text-gray-600">
                  Gostaria de adicionar tarefas à sua lista agora?
                </p>
              </div>

              {/* Botões */}
              <div className="space-y-3">
                <Button
                  onClick={handleAdicionarTarefas}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg rounded-xl"
                >
                  Sim, adicionar tarefas
                </Button>

                <Button
                  onClick={handleFinalizarLista}
                  variant="outline"
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-semibold py-4 text-lg rounded-xl"
                >
                  Não, finalizar por agora
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div
          className={`${
            isModalOpen ? "" : "sticky top-0"
          } z-50 bg-white px-4 py-4 flex items-center justify-between shadow-sm`}
        >
          <Link href="/inicio">
            <X className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">
            Iniciar Criação de Lista
          </h1>
          <div className="w-6"></div> {/* Spacer para centralizar o título */}
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
              value={nomeList}
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
              {categorias.map((categoria) => {
                const IconeComponent = categoria.icone;
                const isSelected = categoriaSelecionada === categoria.id;
                const isPersonalizar = categoria.id === "personalizar";

                return (
                  <button
                    key={categoria.id}
                    onClick={() =>
                      !isPersonalizar && setCategoriaSelecionada(categoria.id)
                    }
                    className={`p-6 rounded-xl border-2 flex flex-col items-center space-y-3 transition-all ${
                      isSelected && !isPersonalizar
                        ? categoria.cor
                        : categoria.corInativa
                    } ${
                      isPersonalizar
                        ? "cursor-default"
                        : "hover:border-green-400"
                    }`}
                  >
                    <IconeComponent className="w-8 h-8" />
                    <span className="font-medium">{categoria.nome}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Adicionar Prestador */}
          <div>
            <div className="flex items-center justify-center">
              <Link href="/convidar-prestador?etapa=buscar">
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
        </div>

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-32 left-4 right-4 z-40">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          </div>
        )}

        {/* Bottom Button */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40">
          <Button
            onClick={handleCriarLista}
            disabled={!nomeList.trim() || isCreating}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 text-lg rounded-xl"
          >
            {isCreating ? "Criando..." : "Criar lista"}
          </Button>
        </div>

        {/* Padding bottom para compensar o botão fixo e a navegação */}
        <div className="h-40"></div>
      </div>
    </>
  );
}
