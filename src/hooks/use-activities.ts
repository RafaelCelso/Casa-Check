import { useState, useEffect } from "react";
import { activitiesService, Activity } from "@/lib/activities";

export const useActivities = (userId: string | undefined) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    if (!userId) {
      setActivities([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const recentActivities = await activitiesService.getRecentActivities(
        userId,
        5
      );
      setActivities(recentActivities);
    } catch (err) {
      console.error("Erro ao buscar atividades:", err);
      setError("Erro ao carregar atividades recentes");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
};
