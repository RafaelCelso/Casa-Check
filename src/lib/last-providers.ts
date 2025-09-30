import { supabase } from "./supabase";

export type LastProvider = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  rating: number;
  last_collaboration: string;
  list_count: number;
  initials: string;
};

export const lastProvidersService = {
  async getLastProviders(
    userId: string,
    limit: number = 3
  ): Promise<LastProvider[]> {
    try {
      // Buscar prestadores que colaboraram nas listas do usuário
      const { data: collaborators, error } = await supabase
        .from("list_collaborators")
        .select(
          `
          user_id,
          created_at,
          user:user_id (
            id,
            name,
            email,
            avatar_url,
            rating,
            tipo
          ),
          task_lists!inner (
            id,
            name,
            creator_id
          )
        `
        )
        .eq("task_lists.creator_id", userId)
        .eq("user.tipo", "prestador")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar colaboradores:", error);
        return [];
      }

      if (!collaborators || collaborators.length === 0) {
        return [];
      }

      // Agrupar por usuário e calcular estatísticas
      const providerMap = new Map<string, LastProvider>();

      collaborators.forEach((collaboration: any) => {
        const provider = collaboration.user;
        const providerId = provider.id;

        if (!providerMap.has(providerId)) {
          // Calcular iniciais do nome
          const initials = this.getInitials(
            provider.name || provider.email || "U"
          );

          providerMap.set(providerId, {
            id: providerId,
            name: provider.name || provider.email || "Usuário",
            email: provider.email || "",
            avatar_url: provider.avatar_url,
            rating: provider.rating || 0,
            last_collaboration: collaboration.created_at,
            list_count: 1,
            initials,
          });
        } else {
          // Atualizar contagem de listas e última colaboração
          const existing = providerMap.get(providerId)!;
          existing.list_count += 1;

          // Manter a colaboração mais recente
          if (
            new Date(collaboration.created_at) >
            new Date(existing.last_collaboration)
          ) {
            existing.last_collaboration = collaboration.created_at;
          }
        }
      });

      // Converter para array e ordenar por última colaboração
      const providers = Array.from(providerMap.values())
        .sort(
          (a, b) =>
            new Date(b.last_collaboration).getTime() -
            new Date(a.last_collaboration).getTime()
        )
        .slice(0, limit);

      return providers;
    } catch (error) {
      console.error("Erro ao buscar últimos prestadores:", error);
      return [];
    }
  },

  getInitials(name: string): string {
    if (!name) return "U";

    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  },

  formatLastCollaboration(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Hoje";
    } else if (diffInDays === 1) {
      return "Ontem";
    } else if (diffInDays < 7) {
      return `Há ${diffInDays} dias`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Há ${weeks} semana${weeks > 1 ? "s" : ""}`;
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  },
};
