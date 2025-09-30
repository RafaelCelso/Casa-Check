"use client";

import { TaskList } from "@/types";
import { taskListsService } from "@/lib/task-lists";
import { generateUniqueSlug } from "@/lib/slug";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  Home,
  Clock,
  CheckCircle,
  Star,
  StarOff,
  Trash2,
  Edit,
  Sparkles,
  ChefHat,
  Bath,
  Bed,
  Sun,
  Archive,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface TaskListCardProps {
  taskList: TaskList;
  onToggleFavorite: (listId: string, isFavorite: boolean) => void;
  onDelete: (listId: string) => void;
  onLeaveList?: (listId: string) => void;
  currentUserId?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "limpeza-geral":
      return <Sparkles className="w-5 h-5 text-green-600" />;
    case "cozinha":
      return <ChefHat className="w-5 h-5 text-orange-600" />;
    case "banheiro":
      return <Bath className="w-5 h-5 text-blue-600" />;
    case "quartos":
      return <Bed className="w-5 h-5 text-purple-600" />;
    case "area-externa":
      return <Sun className="w-5 h-5 text-emerald-600" />;
    case "organizacao":
      return <Archive className="w-5 h-5 text-indigo-600" />;
    case "manutencao":
      return <Settings className="w-5 h-5 text-red-600" />;
    default:
      return <Home className="w-5 h-5 text-gray-600" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "limpeza-geral":
      return "bg-green-100 text-green-600";
    case "cozinha":
      return "bg-orange-100 text-orange-600";
    case "banheiro":
      return "bg-blue-100 text-blue-600";
    case "quartos":
      return "bg-purple-100 text-purple-600";
    case "area-externa":
      return "bg-emerald-100 text-emerald-600";
    case "organizacao":
      return "bg-indigo-100 text-indigo-600";
    case "manutencao":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "alta":
      return "bg-red-100 text-red-600";
    case "media":
      return "bg-yellow-100 text-yellow-600";
    case "baixa":
      return "bg-green-100 text-green-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export const TaskListCard = ({
  taskList,
  onToggleFavorite,
  onDelete,
  onLeaveList,
  currentUserId,
}: TaskListCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const progress = taskListsService.calculateProgress(taskList.tasks || []);
  const completedTasks =
    taskList.tasks?.filter((task) => task.status === "concluida").length || 0;
  const totalTasks = taskList.tasks?.length || 0;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Previne o comportamento padrão do Link
    e.stopPropagation(); // Previne a propagação do evento
    setIsLoading(true);
    try {
      await onToggleFavorite(taskList.id, !taskList.is_favorite);
    } catch (error) {
      console.error("Erro ao alternar favorito:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsLoading(true);
    try {
      await onDelete(taskList.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Erro ao deletar lista:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onLeaveList) {
      return;
    }
    setIsLoading(true);
    try {
      await onLeaveList(taskList.id);
      setShowLeaveModal(false);
    } catch (error) {
      console.error("Erro ao sair da lista:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNextTask = () => {
    const pendingTasks = taskList.tasks?.filter(
      (task) => task.status === "pendente"
    );
    if (!pendingTasks || pendingTasks.length === 0) return null;

    // Ordenar por prioridade (alta, média, baixa)
    const priorityOrder = { alta: 3, media: 2, baixa: 1 };
    return pendingTasks.sort(
      (a, b) =>
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
    )[0];
  };

  const nextTask = getNextTask();

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-4 shadow-sm hover:shadow-md transition-all border border-white/50 group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
            {getCategoryIcon(taskList.category || "limpeza-geral")}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">
                {taskList.name}
              </h3>
              <button
                onClick={handleToggleFavorite}
                disabled={isLoading}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                {taskList.is_favorite ? (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                ) : (
                  <Star className="w-4 h-4 text-gray-400 hover:text-yellow-500 transition-colors" />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {completedTasks}/{totalTasks} tarefas concluídas
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* Menu para o criador da lista */}
            {currentUserId === taskList.creator_id ? (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/lista/${generateUniqueSlug(
                      taskList.name,
                      taskList.id
                    )}/editar`}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Lista
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(e);
                  }}
                  disabled={isLoading}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar Lista
                </DropdownMenuItem>
              </>
            ) : (
              /* Menu para colaboradores/prestadores */
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLeaveModal(true);
                }}
                disabled={isLoading}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair da Lista
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-3">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-green-500">
            {progress}%
          </span>
          {nextTask && (
            <span className="text-xs text-gray-400">
              Próxima: {nextTask.title}
            </span>
          )}
        </div>
      </div>

      {/* Task Categories */}
      {taskList.tasks && taskList.tasks.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {Array.from(new Set(taskList.tasks.map((task) => task.category)))
            .slice(0, 3)
            .map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className={`text-xs ${getCategoryColor(category)}`}
              >
                {category
                  .replace("-", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
            ))}
          {taskList.tasks.length > 3 && (
            <Badge
              variant="secondary"
              className="text-xs bg-gray-100 text-gray-600"
            >
              +{taskList.tasks.length - 3} mais
            </Badge>
          )}
        </div>
      )}

      {/* Description */}
      {taskList.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {taskList.description}
        </p>
      )}

      {/* Modal de confirmação para deletar */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Confirmar exclusão</DialogTitle>
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Deletar Lista
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja deletar a lista{" "}
              <strong>"{taskList.name}"</strong>?
              <br />
              <span className="text-red-600 font-medium">
                Esta ação não pode ser desfeita.
              </span>
            </p>
            <div className="flex space-x-3 justify-center">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteModal(false);
                }}
                disabled={isLoading}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  confirmDelete(e);
                }}
                disabled={isLoading}
                className="px-6"
              >
                {isLoading ? "Deletando..." : "Deletar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação - Sair da Lista */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Sair da Lista</DialogTitle>
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sair da Lista
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja sair da lista{" "}
              <strong>"{taskList.name}"</strong>?
              <br />
              <span className="text-orange-600 font-medium">
                O criador da lista será notificado.
              </span>
            </p>
            <div className="flex space-x-3 justify-center">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLeaveModal(false);
                }}
                disabled={isLoading}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLeave(e);
                }}
                disabled={isLoading}
                className="px-6 bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? "Saindo..." : "Sair da Lista"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
