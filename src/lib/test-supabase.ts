import { supabase } from "./supabase";

export const testSupabaseQuery = async () => {
  try {
    console.log("Testando consulta do Supabase...");

    // Primeiro, testar consulta simples de listas
    const { data: lists, error: listsError } = await supabase
      .from("task_lists")
      .select("*")
      .eq("creator_id", "cdae8e90-1a86-480e-985f-1b7112b8d610")
      .order("created_at", { ascending: false });

    if (listsError) {
      console.error("Erro na consulta de listas:", listsError);
      return;
    }

    console.log("Listas encontradas:", lists);

    // Agora testar consulta com relacionamento
    const { data, error } = await supabase
      .from("task_lists")
      .select(
        `
        *,
        tasks (
          id,
          title,
          status,
          priority,
          category
        )
      `
      )
      .eq("creator_id", "cdae8e90-1a86-480e-985f-1b7112b8d610")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro na consulta com relacionamento:", error);
      return;
    }

    console.log(
      "Dados retornados com relacionamento:",
      JSON.stringify(data, null, 2)
    );

    // Verificar se as tarefas estão sendo incluídas
    data?.forEach((list: any) => {
      console.log(`Lista: ${list.name}`);
      console.log(`Tarefas: ${list.tasks?.length || 0}`);
      if (list.tasks) {
        list.tasks.forEach((task: any) => {
          console.log(`  - ${task.title} (${task.status})`);
        });
      }
    });
  } catch (err) {
    console.error("Erro no teste:", err);
  }
};
