"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";
import { taskListsService } from "@/lib/task-lists";
import { tasksService } from "@/lib/tasks";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { getCategoryIcon } from "@/lib/category-icons";
import type { TaskCategory } from "@/types";

interface ListaTarefa {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  progresso: number;
  totalTarefas: number;
  tarefasConcluidas: number;
  categoria?: TaskCategory;
}

export default function TarefaRapidaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [etapa, setEtapa] = useState<"lista" | "tarefa">("lista");
  const [listaSelecionada, setListaSelecionada] = useState<ListaTarefa | null>(
    null
  );
  const [nomeTarefa, setNomeTarefa] = useState("");
  const [tarefaTexto, setTarefaTexto] = useState("");
  const [isEnviando, setIsEnviando] = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);
  const [listas, setListas] = useState<ListaTarefa[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar listas reais do usuário
  useEffect(() => {
    const loadListas = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const taskLists = await taskListsService.getUserTaskLists(user.id);

        // Converter dados do banco para formato da interface
        const listasFormatadas: ListaTarefa[] = taskLists.map((taskList) => ({
          id: taskList.id,
          nome: taskList.name,
          descricao: taskList.description || "Sem descrição",
          cor: getColorByCategory(taskList.category || "limpeza-geral"),
          progresso: taskList.tasks?.length
            ? Math.round(
                (taskList.tasks.filter((task) => task.status === "concluida")
                  .length /
                  taskList.tasks.length) *
                  100
              )
            : 0,
          totalTarefas: taskList.tasks?.length || 0,
          tarefasConcluidas:
            taskList.tasks?.filter((task) => task.status === "concluida")
              .length || 0,
          categoria: (taskList.category as TaskCategory) || "limpeza-geral",
        }));

        setListas(listasFormatadas);
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadListas();
  }, [user?.id]);

  // Função para obter cor baseada na categoria
  const getColorByCategory = (category: string): string => {
    const colorMap: Record<string, string> = {
      "limpeza-geral": "blue",
      cozinha: "orange",
      banheiro: "purple",
      quartos: "green",
      "area-externa": "emerald",
      organizacao: "indigo",
      manutencao: "red",
      personalizada: "pink",
    };
    return colorMap[category] || "blue";
  };

  const handleSelecionarLista = (lista: ListaTarefa) => {
    setListaSelecionada(lista);
    setEtapa("tarefa");
  };

  const handleVoltar = () => {
    if (etapa === "tarefa") {
      setEtapa("lista");
      setListaSelecionada(null);
      setNomeTarefa("");
      setTarefaTexto("");
    } else {
      router.back();
    }
  };

  const handleEnviarTarefa = async () => {
    if (!nomeTarefa.trim()) {
      alert("Por favor, digite um nome para a tarefa");
      return;
    }

    if (!tarefaTexto.trim()) {
      alert("Por favor, digite uma descrição para a tarefa");
      return;
    }

    if (!listaSelecionada?.id) {
      alert("Lista não selecionada");
      return;
    }

    if (!user?.id) {
      alert("Usuário não autenticado");
      return;
    }

    setIsEnviando(true);

    try {
      // Obter o próximo índice de ordem para a tarefa
      const existingTasks = await tasksService.getTasksByListId(
        listaSelecionada.id
      );
      const nextOrderIndex = existingTasks.length;

      // Criar a tarefa no banco de dados
      const novaTarefa = await tasksService.createTask({
        list_id: listaSelecionada.id,
        title: nomeTarefa.trim(),
        description: tarefaTexto.trim(),
        category: listaSelecionada.categoria || "limpeza-geral",
        priority: "media",
        order_index: nextOrderIndex,
      });

      console.log("Tarefa criada com sucesso:", novaTarefa);

      // Mostrar modal de confirmação
      setShowConfirmacao(true);
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      alert("Erro ao adicionar tarefa. Tente novamente.");
    } finally {
      setIsEnviando(false);
    }
  };

  const handleFecharConfirmacao = () => {
    setShowConfirmacao(false);
    setEtapa("lista");
    setListaSelecionada(null);
    setNomeTarefa("");
    setTarefaTexto("");
  };

  if (etapa === "tarefa") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleVoltar}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Adicionar Tarefa Rápida
              </h1>
              <p className="text-sm text-gray-500">{listaSelecionada?.nome}</p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-6">
          {/* Informações da Lista */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div
                className={`w-12 h-12 bg-${listaSelecionada?.cor}-100 rounded-full flex items-center justify-center`}
              >
                {(() => {
                  const IconComponent = getCategoryIcon(
                    (listaSelecionada?.categoria as any) ||
                      ("limpeza-geral" as any)
                  );
                  return (
                    <IconComponent
                      className={`w-6 h-6 text-${listaSelecionada?.cor}-600`}
                    />
                  );
                })()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {listaSelecionada?.nome}
                </h3>
                <p className="text-sm text-gray-500">
                  {listaSelecionada?.descricao}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`bg-${listaSelecionada?.cor}-500 h-2 rounded-full transition-all duration-300`}
                style={{ width: `${listaSelecionada?.progresso}%` }}
              />
            </div>
          </div>

          {/* Formulário da Tarefa */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
            {/* Nome da Tarefa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Tarefa *
              </label>
              <input
                type="text"
                value={nomeTarefa}
                onChange={(e) => setNomeTarefa(e.target.value)}
                placeholder="Ex: Lavar a louça"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                {nomeTarefa.length}/50 caracteres
              </p>
            </div>

            {/* Descrição da Tarefa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição da Tarefa *
              </label>
              <textarea
                value={tarefaTexto}
                onChange={(e) => setTarefaTexto(e.target.value)}
                placeholder="Ex: Lavar todos os pratos, copos e talheres que estão na pia..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {tarefaTexto.length}/200 caracteres
              </p>
            </div>
          </div>

          {/* Botão Enviar */}
          <button
            onClick={handleEnviarTarefa}
            disabled={isEnviando || !nomeTarefa.trim() || !tarefaTexto.trim()}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              isEnviando || !nomeTarefa.trim() || !tarefaTexto.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {isEnviando ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Adicionando...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Adicionar Tarefa</span>
              </>
            )}
          </button>
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
                Tarefa Adicionada!
              </h2>

              {/* Mensagem */}
              <p className="text-gray-600 mb-6">
                A tarefa{" "}
                <span className="font-semibold text-green-600">
                  "{nomeTarefa}"
                </span>{" "}
                foi adicionada com sucesso à lista{" "}
                <span className="font-semibold text-blue-600">
                  "{listaSelecionada?.nome}"
                </span>
                .
              </p>

              {/* Botões */}
              <div className="space-y-3">
                <button
                  onClick={handleFecharConfirmacao}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Adicionar Outra Tarefa
                </button>

                <button
                  onClick={() => {
                    setShowConfirmacao(false);
                    router.push("/inicio");
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Voltar ao Início
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleVoltar}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Adicionar Tarefa Rápida
            </h1>
            <p className="text-sm text-gray-500">
              Selecione uma lista para adicionar a tarefa
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Carregando listas...</span>
          </div>
        ) : listas.length > 0 ? (
          listas.map((lista) => (
            <div
              key={lista.id}
              onClick={() => handleSelecionarLista(lista)}
              className="bg-white rounded-xl p-4 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 bg-${lista.cor}-100 rounded-full flex items-center justify-center`}
                  >
                    {(() => {
                      const IconComponent = getCategoryIcon(
                        lista.categoria || "limpeza-geral"
                      );
                      return (
                        <IconComponent
                          className={`w-6 h-6 text-${lista.cor}-600`}
                        />
                      );
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {lista.nome}
                    </h3>
                    <p className="text-sm text-gray-500">{lista.descricao}</p>
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
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Nenhuma lista encontrada
            </h3>
            <p className="text-gray-500 mb-6">
              Crie uma lista primeiro para adicionar tarefas rápidas
            </p>
            <Link
              href="/nova-lista"
              className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Criar Nova Lista</span>
            </Link>
          </div>
        )}
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>
    </div>
  );
}
