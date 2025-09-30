import {
  Home,
  ChefHat,
  Bath,
  Bed,
  TreePine,
  Archive,
  Wrench,
} from "lucide-react";

// Mapeamento de categorias para ícones
const categoryIconMap = {
  "limpeza-geral": Home,
  cozinha: ChefHat,
  banheiro: Bath,
  quartos: Bed,
  "area-externa": TreePine,
  organizacao: Archive,
  manutencao: Wrench,
};

// Mapeamento de categorias para nomes legíveis
const categoryNameMap = {
  "limpeza-geral": "Limpeza Geral",
  cozinha: "Cozinha",
  banheiro: "Banheiro",
  quartos: "Quartos",
  "area-externa": "Área Externa",
  organizacao: "Organização",
  manutencao: "Manutenção",
};

interface CategoryTagsProps {
  categories: string[];
  maxVisible?: number;
  className?: string;
}

export function CategoryTags({
  categories,
  maxVisible = 3,
  className = "",
}: CategoryTagsProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className={`text-sm text-gray-500 italic ${className}`}>
        Nenhuma categoria
      </div>
    );
  }

  const visibleCategories = categories.slice(0, maxVisible);
  const remainingCount = categories.length - maxVisible;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {visibleCategories.map((categoryId) => {
        const IconComponent =
          categoryIconMap[categoryId as keyof typeof categoryIconMap];
        const categoryName =
          categoryNameMap[categoryId as keyof typeof categoryNameMap] ||
          categoryId;

        if (!IconComponent) return null;

        return (
          <div
            key={categoryId}
            className="inline-flex items-center space-x-1 px-2 py-1 bg-green-50 border border-green-200 rounded-md text-green-700"
          >
            <IconComponent className="w-3 h-3" />
            <span className="text-xs font-medium">{categoryName}</span>
          </div>
        );
      })}

      {remainingCount > 0 && (
        <div className="inline-flex items-center px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
          <span className="text-xs font-medium">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}
