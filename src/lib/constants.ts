import { TaskCategory } from "@/types";

export const TASK_CATEGORIES: Record<
  TaskCategory,
  { label: string; icon: string }
> = {
  "limpeza-geral": { label: "Limpeza Geral", icon: "🧹" },
  cozinha: { label: "Cozinha", icon: "🍳" },
  banheiro: { label: "Banheiro", icon: "🚿" },
  quartos: { label: "Quartos", icon: "🛏️" },
  "area-externa": { label: "Área Externa", icon: "🌿" },
  organizacao: { label: "Organização", icon: "📦" },
  manutencao: { label: "Manutenção", icon: "🔧" },
  personalizada: { label: "Personalizada", icon: "⭐" },
};

export const PRIORITY_COLORS = {
  baixa: "bg-green-100 text-green-800",
  media: "bg-yellow-100 text-yellow-800",
  alta: "bg-red-100 text-red-800",
};

export const STATUS_COLORS = {
  pendente: "bg-gray-100 text-gray-800",
  "em-andamento": "bg-blue-100 text-blue-800",
  concluida: "bg-green-100 text-green-800",
};
