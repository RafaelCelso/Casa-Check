import { useState, useEffect } from "react";
import { lastProvidersService, LastProvider } from "@/lib/last-providers";

export const useLastProviders = (userId: string | undefined) => {
  const [providers, setProviders] = useState<LastProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLastProviders = async () => {
    if (!userId) {
      setProviders([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lastProviders = await lastProvidersService.getLastProviders(
        userId,
        3
      );
      setProviders(lastProviders);
    } catch (err) {
      console.error("Erro ao buscar últimos prestadores:", err);
      setError("Erro ao carregar prestadores");
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLastProviders();
  }, [userId]);

  return {
    providers,
    loading,
    error,
    refetch: fetchLastProviders,
  };
};
