"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, TaskCategory } from "@/types";
import { generateUniqueSlug } from "@/lib/slug";
import { getCategoryIcon } from "@/lib/category-icons";
import {
  ArrowLeft,
  ArrowDown,
  Minus,
  ArrowUp,
  Sparkles,
  Wrench,
  TreePine,
  MoreHorizontal,
  Trash2,
  Home,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

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

interface DraggableTaskCardProps {
  tarefa: Tarefa;
  slug: string;
  onToggleComplete: (tarefaId: string) => void;
  onDelete: (tarefaId: string) => void;
  swipeStates: {
    [key: string]: { translateX: number; isDeleting: boolean; startX?: number };
  };
  onTouchStart: (e: React.TouchEvent, tarefaId: string) => void;
  onTouchMove: (e: React.TouchEvent, tarefaId: string) => void;
  onTouchEnd: (tarefaId: string) => void;
  userType?: string;
  currentUserId?: string;
}

export function DraggableTaskCard({
  tarefa,
  slug,
  onToggleComplete,
  onDelete,
  swipeStates,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  userType = "contratante",
  currentUserId,
}: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

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

  const formatarDataHora = (data: Date) => {
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const IconeComponent = getCategoryIcon(tarefa.categoria);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative overflow-hidden group"
    >
      {/* Background de exclusão - apenas para tarefas não concluídas */}
      {!tarefa.concluida && (
        <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-lg">
          <div className="flex items-center space-x-2 text-white">
            <Trash2 className="w-5 h-5" />
            <span className="font-medium">Excluir</span>
          </div>
        </div>
      )}

      {/* Card da tarefa */}
      <div
        className={`rounded-lg p-4 shadow-sm border-l-4 transition-all duration-200 relative ${
          tarefa.concluida
            ? "bg-gray-100 opacity-70 border-gray-400"
            : "bg-white hover:shadow-md"
        } ${
          !tarefa.concluida && tarefa.prioridade === "alta"
            ? "border-red-500"
            : !tarefa.concluida && tarefa.prioridade === "media"
            ? "border-yellow-500"
            : !tarefa.concluida && tarefa.prioridade === "baixa"
            ? "border-green-500"
            : ""
        } ${
          isDragging ? "shadow-lg ring-2 ring-blue-500 ring-opacity-50" : ""
        }`}
        style={{
          transform: `translateX(${swipeStates[tarefa.id]?.translateX || 0}px)`,
        }}
        onTouchStart={
          !tarefa.concluida ? (e) => onTouchStart(e, tarefa.id) : undefined
        }
        onTouchMove={
          !tarefa.concluida ? (e) => onTouchMove(e, tarefa.id) : undefined
        }
        onTouchEnd={!tarefa.concluida ? () => onTouchEnd(tarefa.id) : undefined}
      >
        <div className="flex items-start space-x-4">
          {/* Handle para drag and drop - apenas para contratantes */}
          {userType === "contratante" && (
            <div
              {...attributes}
              {...listeners}
              className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing touch-none select-none group"
              style={{ touchAction: "none" }}
              title="Arrastar para reorganizar"
            >
              <div className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors active:bg-gray-100 active:scale-95 relative">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                {/* Indicador visual apenas para mobile */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity md:hidden"></div>
              </div>
            </div>
          )}

          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleComplete(tarefa.id);
            }}
            className="flex-shrink-0 mt-1"
          >
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                tarefa.concluida
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300 hover:border-green-400"
              }`}
            >
              {tarefa.concluida && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>

          {/* Ícone */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              tarefa.concluida ? "bg-gray-200" : "bg-green-100"
            }`}
          >
            <IconeComponent
              className={`w-6 h-6 ${
                tarefa.concluida ? "text-gray-500" : "text-green-600"
              }`}
            />
          </div>

          {/* Conteúdo */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <Link
                href={`/tarefa/${generateUniqueSlug(
                  tarefa.titulo,
                  tarefa.id
                )}?lista=${slug}`}
                className="flex-1"
              >
                <h3
                  className={`font-semibold cursor-pointer hover:text-green-600 transition-colors ${
                    tarefa.concluida
                      ? "line-through text-gray-500"
                      : "text-gray-800"
                  }`}
                >
                  {tarefa.titulo}
                </h3>
              </Link>
              <div className="flex items-center space-x-2">
                <span className={getPrioridadeStyle(tarefa.prioridade)}>
                  {getPrioridadeText(tarefa.prioridade)}
                </span>

                {/* Botões de ação baseados no tipo de usuário */}
                {userType === "contratante" && !tarefa.concluida && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(tarefa.id);
                    }}
                    className="hidden md:opacity-0 md:group-hover:opacity-100 md:flex items-center justify-center w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <Link
              href={`/tarefa/${generateUniqueSlug(
                tarefa.titulo,
                tarefa.id
              )}?lista=${slug}`}
            >
              <p
                className={`text-sm cursor-pointer hover:text-green-600 transition-colors ${
                  tarefa.concluida ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {tarefa.descricao}
              </p>
            </Link>
            {tarefa.concluida && tarefa.dataConlusao && (
              <div className="mt-2 flex items-center space-x-1">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs text-green-600 font-medium">
                  Concluída em {formatarDataHora(tarefa.dataConlusao)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
