"use client";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Camera,
  Plus,
  Sparkles,
  TreePine,
  Wrench,
  MoreHorizontal,
  ArrowDown,
  Minus,
  ArrowUp,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { useModal } from "@/contexts/modal-context";
import { extractIdFromSlug, generateUniqueSlug } from "@/lib/slug";

function NovaTarefaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isModalOpen } = useModal();
  const fromLista = searchParams.get("from") === "lista";
  const listaId = searchParams.get("lista");

  const [tituloTarefa, setTituloTarefa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [prioridadeSelecionada, setPrioridadeSelecionada] = useState("");
  const [imagens, setImagens] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categorias = [
    {
      id: "limpeza-geral",
      nome: "Limpeza Geral",
      icone: Sparkles,
    },
    {
      id: "cozinha",
      nome: "Cozinha",
      icone: Sparkles,
    },
    {
      id: "banheiro",
      nome: "Banheiro",
      icone: Sparkles,
    },
    {
      id: "quartos",
      nome: "Quartos",
      icone: Sparkles,
    },
    {
      id: "area-externa",
      nome: "Área Externa",
      icone: TreePine,
    },
    {
      id: "organizacao",
      nome: "Organização",
      icone: MoreHorizontal,
    },
    {
      id: "manutencao",
      nome: "Manutenção",
      icone: Wrench,
    },
  ];

  const prioridades = [
    {
      id: "baixa",
      nome: "Baixa",
      icone: ArrowDown,
      cor: "border-green-500 bg-green-50 text-green-700",
      corInativa:
        "border-gray-200 bg-white text-gray-600 hover:border-green-300",
    },
    {
      id: "media",
      nome: "Média",
      icone: Minus,
      cor: "border-yellow-500 bg-yellow-50 text-yellow-700",
      corInativa:
        "border-gray-200 bg-white text-gray-600 hover:border-yellow-300",
    },
    {
      id: "alta",
      nome: "Alta",
      icone: ArrowUp,
      cor: "border-red-500 bg-red-50 text-red-700",
      corInativa: "border-gray-200 bg-white text-gray-600 hover:border-red-300",
    },
  ];

  const handleAdicionarTarefa = async () => {
    if (!user?.id) {
      setError("Usuário não autenticado");
      return;
    }

    if (!listaId) {
      setError("ID da lista não encontrado");
      return;
    }

    if (!tituloTarefa.trim()) {
      setError("Título da tarefa é obrigatório");
      return;
    }

    if (!categoriaSelecionada) {
      setError("Categoria é obrigatória");
      return;
    }

    if (!prioridadeSelecionada) {
      setError("Prioridade é obrigatória");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Debug - listaId:", listaId, "Tipo:", typeof listaId);

      // Obter o UUID completo da lista
      let fullListId = listaId;
      if (listaId && listaId.length < 36) {
        console.log("Debug - ID parcial detectado, buscando UUID completo");

        // ID parcial - buscar todas as listas e filtrar no JavaScript
        const { data: allLists, error: listError } = await supabase
          .from("task_lists")
          .select("id");

        if (listError) {
          console.error("Erro ao buscar listas:", listError);
          setError("Erro ao buscar lista.");
          return;
        }

        console.log("Debug - Listas encontradas:", allLists);

        // Filtrar no JavaScript
        const currentListId = listaId; // Capturar o valor em uma variável local
        const matchingList = allLists?.find((list) =>
          list.id.startsWith(currentListId)
        );

        console.log("Debug - Lista correspondente:", matchingList);

        if (!matchingList) {
          setError("Lista não encontrada.");
          return;
        }

        fullListId = matchingList.id;
        console.log("Debug - UUID completo:", fullListId);
      } else {
        console.log("Debug - UUID completo já fornecido:", fullListId);
      }

      console.log("Adicionando tarefa:", {
        titulo: tituloTarefa,
        descricao,
        categoria: categoriaSelecionada,
        prioridade: prioridadeSelecionada,
        imagens: imagens.length,
        listaId: fullListId,
      });

      // Upload das imagens para o Supabase Storage (se houver)
      let imageUrls: string[] = [];
      if (imagens.length > 0) {
        for (const imagem of imagens) {
          const fileName = `${Date.now()}-${imagem.name}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("task-images").upload(fileName, imagem);

          if (uploadError) {
            console.error("Erro ao fazer upload da imagem:", uploadError);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("task-images").getPublicUrl(fileName);

          imageUrls.push(publicUrl);
        }
      }

      // Buscar o próximo order_index disponível
      const { data: existingTasks } = await supabase
        .from("tasks")
        .select("order_index")
        .eq("list_id", fullListId)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrderIndex =
        existingTasks && existingTasks.length > 0
          ? (existingTasks[0].order_index || 0) + 1
          : 1;

      // Criar a tarefa no banco de dados
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            list_id: fullListId,
            title: tituloTarefa.trim(),
            description: descricao.trim() || null,
            category: categoriaSelecionada,
            priority: prioridadeSelecionada,
            status: "pendente",
            order_index: nextOrderIndex,
            images: imageUrls.length > 0 ? imageUrls : null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar tarefa:", error);
        setError("Erro ao salvar tarefa: " + error.message);
        return;
      }

      console.log("Tarefa criada com sucesso:", data);

      // Redirecionar de volta para a lista
      if (fromLista && listaId) {
        // Se temos o ID parcial, precisamos buscar o nome da lista para gerar o slug
        if (listaId.length < 36) {
          // Buscar o nome da lista para gerar o slug amigável
          const { data: listData } = await supabase
            .from("task_lists")
            .select("id, name")
            .eq("id", fullListId)
            .single();

          if (listData) {
            const friendlySlug = generateUniqueSlug(listData.name, listData.id);
            router.push(`/lista/${friendlySlug}`);
          } else {
            router.push(`/lista/${listaId}`);
          }
        } else {
          // UUID completo - buscar nome da lista
          const { data: listData } = await supabase
            .from("task_lists")
            .select("id, name")
            .eq("id", listaId)
            .single();

          if (listData) {
            const friendlySlug = generateUniqueSlug(listData.name, listData.id);
            router.push(`/lista/${friendlySlug}`);
          } else {
            router.push(`/lista/${listaId}`);
          }
        }
      } else {
        router.push("/inicio");
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      setError("Erro inesperado ao salvar tarefa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      setImagens((prev) => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagens((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById(
      "image-upload"
    ) as HTMLInputElement;
    fileInput?.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className={`${
          isModalOpen ? "" : "sticky top-0"
        } z-50 bg-white px-4 py-4 flex items-center shadow-sm`}
      >
        {fromLista ? (
          <Link href="/inicio" className="mr-4">
            <X className="w-6 h-6 text-gray-600" />
          </Link>
        ) : (
          <Link href="/nova-lista" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
        )}
        <h1 className="text-lg font-semibold text-gray-800">
          Adicionar Tarefa à Lista
        </h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Título da Tarefa */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-3">
            Título da Tarefa
          </label>
          <Input
            placeholder="Ex: Limpar a cozinha"
            value={tituloTarefa}
            onChange={(e) => setTituloTarefa(e.target.value)}
            className="w-full py-4 px-4 text-base bg-white border-gray-200 rounded-xl"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-3">
            Descrição
          </label>
          <Textarea
            placeholder="Ex: Detalhes específicos sobre a limpeza"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full py-4 px-4 text-base bg-white border-gray-200 rounded-xl min-h-[120px] resize-none"
          />
        </div>

        {/* Anexar Imagens */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-4">
            Anexar Imagens
          </label>

          {/* Input de arquivo oculto */}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex space-x-3 overflow-x-auto pb-2">
            {/* Imagens selecionadas */}
            {imagens.map((imagem, index) => (
              <div key={index} className="flex-shrink-0 relative group">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={URL.createObjectURL(imagem)}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Botão de remover */}
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 text-gray-700 hover:text-gray-900 flex items-center justify-center text-sm transition-colors"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Botão adicionar foto */}
            <button
              onClick={triggerFileInput}
              className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">Adicionar foto</span>
            </button>
          </div>
        </div>

        {/* Categoria */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-600">
              Categoria
            </label>
            <button className="flex items-center space-x-1 text-green-500 text-sm font-medium">
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categorias.map((categoria) => {
              const IconeComponent = categoria.icone;
              const isSelected = categoriaSelecionada === categoria.id;

              return (
                <button
                  key={categoria.id}
                  onClick={() => setCategoriaSelecionada(categoria.id)}
                  className={`p-4 rounded-xl border-2 flex items-center space-x-3 transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-green-300"
                  }`}
                >
                  <IconeComponent className="w-5 h-5" />
                  <span className="font-medium">{categoria.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-4">
            Prioridade
          </label>
          <div className="flex space-x-3">
            {prioridades.map((prioridade) => {
              const IconeComponent = prioridade.icone;
              const isSelected = prioridadeSelecionada === prioridade.id;

              return (
                <button
                  key={prioridade.id}
                  onClick={() => setPrioridadeSelecionada(prioridade.id)}
                  className={`px-4 py-3 rounded-xl border-2 font-medium transition-all flex items-center space-x-2 ${
                    isSelected ? prioridade.cor : prioridade.corInativa
                  }`}
                >
                  <IconeComponent className="w-4 h-4" />
                  <span>{prioridade.nome}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-32 left-4 right-4 z-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Bottom Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40">
        <Button
          onClick={handleAdicionarTarefa}
          disabled={!tituloTarefa.trim() || isLoading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 text-lg rounded-xl"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Adicionar Tarefa"
          )}
        </Button>
      </div>

      {/* Padding bottom para compensar o botão fixo e a navegação */}
      <div className="h-40"></div>
    </div>
  );
}

export default function NovaTarefaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-600">
          Carregando...
        </div>
      }
    >
      <NovaTarefaContent />
    </Suspense>
  );
}
