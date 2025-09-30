import { useState, useEffect } from "react";
import { TaskList } from "@/types";
import { taskListsService } from "@/lib/task-lists";
import { useAuth } from "@/components/auth/supabase-auth-provider";

export const useTaskLists = () => {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [favoriteLists, setFavoriteLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTaskLists = async () => {
    if (!user?.id) {
      console.log("Usuário não autenticado:", user);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Buscando listas para usuário:", user.id);

      const [lists, favorites] = await Promise.all([
        taskListsService.getUserTaskLists(user.id),
        taskListsService.getFavoriteTaskLists(user.id),
      ]);

      console.log("Listas encontradas:", lists);
      console.log("Favoritas encontradas:", favorites);

      setTaskLists(lists);
      setFavoriteLists(favorites);
    } catch (err) {
      console.error("Erro ao buscar listas:", err);
      setError("Erro ao carregar listas");
    } finally {
      setLoading(false);
    }
  };

  const createTaskList = async (listData: {
    name: string;
    description?: string;
  }) => {
    if (!user?.id) throw new Error("Usuário não autenticado");

    try {
      const newList = await taskListsService.createTaskList({
        ...listData,
        creator_id: user.id,
      });

      setTaskLists((prev) => [newList, ...prev]);
      return newList;
    } catch (err) {
      console.error("Erro ao criar lista:", err);
      throw err;
    }
  };

  const updateTaskList = async (
    listId: string,
    updates: {
      name?: string;
      description?: string;
      is_favorite?: boolean;
    }
  ) => {
    try {
      const updatedList = await taskListsService.updateTaskList(
        listId,
        updates
      );

      setTaskLists((prev) =>
        prev.map((list) => (list.id === listId ? updatedList : list))
      );

      // Atualizar lista de favoritos se necessário
      if (updates.is_favorite !== undefined) {
        if (updates.is_favorite) {
          setFavoriteLists((prev) => [updatedList, ...prev]);
        } else {
          setFavoriteLists((prev) => prev.filter((list) => list.id !== listId));
        }
      }

      return updatedList;
    } catch (err) {
      console.error("Erro ao atualizar lista:", err);
      throw err;
    }
  };

  const deleteTaskList = async (listId: string) => {
    try {
      await taskListsService.deleteTaskList(listId);

      setTaskLists((prev) => prev.filter((list) => list.id !== listId));
      setFavoriteLists((prev) => prev.filter((list) => list.id !== listId));
    } catch (err) {
      console.error("Erro ao deletar lista:", err);
      throw err;
    }
  };

  const toggleFavorite = async (listId: string, isFavorite: boolean) => {
    try {
      await taskListsService.toggleFavorite(listId, isFavorite);

      // Atualizar estado local
      setTaskLists((prev) =>
        prev.map((list) =>
          list.id === listId ? { ...list, is_favorite: isFavorite } : list
        )
      );

      if (isFavorite) {
        const list = taskLists.find((l) => l.id === listId);
        if (list) {
          setFavoriteLists((prev) => [{ ...list, is_favorite: true }, ...prev]);
        }
      } else {
        setFavoriteLists((prev) => prev.filter((list) => list.id !== listId));
      }
    } catch (err) {
      console.error("Erro ao alternar favorito:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTaskLists();
  }, [user?.id]);

  return {
    taskLists,
    favoriteLists,
    loading,
    error,
    createTaskList,
    updateTaskList,
    deleteTaskList,
    toggleFavorite,
    refetch: fetchTaskLists,
  };
};
