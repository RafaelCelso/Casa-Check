import {
  Home,
  ChefHat,
  Bath,
  Bed,
  TreePine,
  Archive,
  Wrench,
  Sparkles,
} from "lucide-react";
import { TaskCategory } from "@/types";

/**
 * Mapeia categorias de tarefas para seus respectivos ícones
 */
export const categoryIconMap: Record<TaskCategory, any> = {
  "limpeza-geral": Home,
  cozinha: ChefHat,
  banheiro: Bath,
  quartos: Bed,
  "area-externa": TreePine,
  organizacao: Archive,
  manutencao: Wrench,
  personalizada: Sparkles,
};

/**
 * Obtém o ícone correspondente à categoria da tarefa
 * @param category - Categoria da tarefa
 * @returns Componente de ícone do Lucide React
 */
export function getCategoryIcon(category: TaskCategory) {
  return categoryIconMap[category] || Home;
}

/**
 * Obtém o texto legível da categoria
 * @param category - Categoria da tarefa
 * @returns Texto legível da categoria
 */
export function getCategoryText(category: TaskCategory): string {
  const categoryTexts: Record<TaskCategory, string> = {
    "limpeza-geral": "Limpeza Geral",
    cozinha: "Cozinha",
    banheiro: "Banheiro",
    quartos: "Quartos",
    "area-externa": "Área Externa",
    organizacao: "Organização",
    manutencao: "Manutenção",
    personalizada: "Personalizada",
  };

  return categoryTexts[category] || "Categoria";
}
