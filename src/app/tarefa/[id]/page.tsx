"use client";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Volume2,
  Send,
  Check,
  Play,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  ArrowDown,
  Minus,
  ArrowUp,
  Sparkles,
  Wrench,
  TreePine,
  MoreHorizontal,
  Pause,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import { tasksService } from "@/lib/tasks";
import { supabase } from "@/lib/supabase";
import { commentsService, Comment as SupabaseComment } from "@/lib/comments";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { extractIdFromSlug } from "@/lib/slug";
import { useModal } from "@/contexts/modal-context";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Comentario {
  id: string;
  texto: string;
  autor: string;
  tipo?: string | null;
  data: Date;
}

interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: "alta" | "media" | "baixa";
  categoria:
    | "limpeza-geral"
    | "cozinha"
    | "banheiro"
    | "quartos"
    | "area-externa"
    | "organizacao"
    | "manutencao"
    | "personalizada";
  concluida: boolean;
  dataConlusao?: Date;
  imagens?: string[];
  comentarios: Comentario[];
}

export default function DetalhesTarefaPage() {
  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [novoComentario, setNovoComentario] = useState("");
  const [playingCommentId, setPlayingCommentId] = useState<string | null>(null);
  const [currentPlayingType, setCurrentPlayingType] = useState<
    "description" | "comment" | null
  >(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] =
    useState<SpeechSynthesisUtterance | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    titulo: "",
    descricao: "",
    prioridade: "media" as "alta" | "media" | "baixa",
    categoria: "limpeza-geral" as
      | "limpeza-geral"
      | "cozinha"
      | "banheiro"
      | "quartos"
      | "area-externa"
      | "organizacao"
      | "manutencao"
      | "personalizada",
    imagens: [] as string[],
  });
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [userType, setUserType] = useState<string>("contratante");
  const [isLoadingUserType, setIsLoadingUserType] = useState(true);
  const searchParams = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const listaSlug = searchParams.get("lista") || "limpeza-semanal"; // valor padrão
  const { user } = useAuth();
  const { isModalOpen } = useModal();

  // Carregar tipo do usuário
  useEffect(() => {
    const loadUserType = async () => {
      if (!user?.id) {
        setIsLoadingUserType(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("user")
          .select("tipo")
          .eq("id", user.id)
          .single();

        setUserType(data?.tipo || "contratante");
      } catch (error) {
        console.error("Erro ao carregar tipo do usuário:", error);
        setUserType("contratante"); // fallback para contratante
      } finally {
        setIsLoadingUserType(false);
      }
    };

    loadUserType();
  }, [user?.id]);

  // Carregar tarefa real do Supabase
  useEffect(() => {
    const load = async () => {
      if (!id) return;

      // Extrair ID do slug
      const taskId = extractIdFromSlug(String(id));
      if (!taskId) {
        console.error("ID de tarefa inválido no slug:", id);
        return;
      }

      const dbTask = await tasksService.getTaskById(taskId);
      if (!dbTask) return;
      const mapped = {
        id: dbTask.id,
        titulo: dbTask.title,
        descricao: dbTask.description || "",
        prioridade: dbTask.priority,
        categoria: dbTask.category,
        concluida: dbTask.status === "concluida",
        dataConlusao: dbTask.completed_at
          ? new Date(dbTask.completed_at)
          : undefined,
        imagens: dbTask.images || [],
        comentarios:
          dbTask.comments?.map((c) => ({
            id: c.id,
            texto: c.content,
            autor: c.user?.name || c.user?.email || "Usuário",
            tipo: c.user?.tipo || null,
            data: new Date(c.created_at),
          })) || [],
      } as Tarefa;
      setTarefa(mapped);
      setEditForm({
        titulo: mapped.titulo,
        descricao: mapped.descricao,
        prioridade: mapped.prioridade,
        categoria: mapped.categoria,
        imagens: mapped.imagens || [],
      });
    };
    load();
  }, [id]);

  const toggleTarefaConcluida = async () => {
    if (!tarefa || !user?.id) return;
    const novoStatus = tarefa.concluida ? "pendente" : "concluida";
    const ok = await tasksService.updateTaskStatus(
      tarefa.id,
      novoStatus,
      user.id
    );
    if (!ok) return;
    setTarefa({
      ...tarefa,
      concluida: !tarefa.concluida,
      dataConlusao: !tarefa.concluida ? new Date() : undefined,
    });
  };

  const iniciarEdicao = () => {
    if (tarefa) {
      setEditForm({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        prioridade: tarefa.prioridade,
        categoria: tarefa.categoria,
        imagens: tarefa.imagens || [],
      });
      setIsEditing(true);
    }
  };

  const salvarEdicao = async () => {
    if (!tarefa) return;
    try {
      setIsSaving(true);
      setError(null);

      // Upload de novos arquivos locais
      let uploadedUrls: string[] = [];
      if (localFiles.length > 0) {
        for (const file of localFiles) {
          const fileName = `${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("task-images")
            .upload(fileName, file);
          if (uploadError) {
            console.error("Erro ao fazer upload de imagem:", uploadError);
            continue;
          }
          const {
            data: { publicUrl },
          } = supabase.storage.from("task-images").getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
        }
      }

      const finalImages = [...(editForm.imagens || []), ...uploadedUrls];

      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          title: editForm.titulo.trim(),
          description: editForm.descricao.trim() || null,
          priority: editForm.prioridade,
          category: editForm.categoria,
          images: finalImages.length > 0 ? finalImages : null,
        })
        .eq("id", tarefa.id);

      if (updateError) {
        console.error("Erro ao salvar alterações:", updateError);
        setError("Erro ao salvar alterações: " + updateError.message);
        return;
      }

      setTarefa({
        ...tarefa,
        titulo: editForm.titulo,
        descricao: editForm.descricao,
        prioridade: editForm.prioridade,
        categoria: editForm.categoria,
        imagens: finalImages,
      });
      setLocalFiles([]);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      setError("Erro inesperado ao salvar alterações");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelarEdicao = () => {
    setIsEditing(false);
    setEditForm({
      titulo: "",
      descricao: "",
      prioridade: "media",
      categoria: "limpeza-geral",
      imagens: [],
    });
  };

  const adicionarImagem = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLocalFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removerImagem = (index: number) => {
    const novasImagens = editForm.imagens.filter((_, i) => i !== index);
    setEditForm({
      ...editForm,
      imagens: novasImagens,
    });
  };

  const removerArquivoLocal = (index: number) => {
    setLocalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case "limpeza-geral":
      case "cozinha":
      case "banheiro":
      case "quartos":
        return <Sparkles className="w-5 h-5" />;
      case "area-externa":
        return <TreePine className="w-5 h-5" />;
      case "organizacao":
        return <MoreHorizontal className="w-5 h-5" />;
      case "manutencao":
        return <Wrench className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getCategoriaText = (categoria: string) => {
    switch (categoria) {
      case "limpeza-geral":
        return "Limpeza Geral";
      case "cozinha":
        return "Cozinha";
      case "banheiro":
        return "Banheiro";
      case "quartos":
        return "Quartos";
      case "area-externa":
        return "Área Externa";
      case "organizacao":
        return "Organização";
      case "manutencao":
        return "Manutenção";
      case "personalizada":
        return "Personalizada";
      default:
        return categoria;
    }
  };

  const getComentarioStyle = (autor: string) => {
    // Verifica se é o usuário atual (João Santos - Prestador)
    const isUsuarioAtual = autor.includes("João Santos");

    if (isUsuarioAtual) {
      return "bg-blue-50 border-l-4 border-blue-500"; // Azul para o usuário atual
    } else {
      return "bg-gray-100"; // Cinza para outros usuários
    }
  };

  const adicionarComentario = async () => {
    if (!novoComentario.trim() || !tarefa || !user?.id) return;

    try {
      const newComment = await commentsService.addComment(
        tarefa.id,
        novoComentario,
        user.id
      );
      if (newComment) {
        const mappedComment: Comentario = {
          id: newComment.id,
          texto: newComment.content,
          autor: newComment.user?.name || newComment.user?.email || "Usuário",
          tipo: newComment.user?.tipo || null,
          data: new Date(newComment.created_at),
        };

        setTarefa({
          ...tarefa,
          comentarios: [...tarefa.comentarios, mappedComment],
        });
        setNovoComentario("");
      }
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    }
  };

  const iniciarEdicaoComentario = (comentario: Comentario) => {
    setEditingCommentId(comentario.id);
    setEditCommentText(comentario.texto);
  };

  const salvarEdicaoComentario = async () => {
    if (!tarefa || !editingCommentId || !editCommentText.trim()) return;

    try {
      const success = await commentsService.updateComment(
        editingCommentId,
        editCommentText
      );
      if (success) {
        const comentariosAtualizados = tarefa.comentarios.map((comentario) =>
          comentario.id === editingCommentId
            ? { ...comentario, texto: editCommentText.trim() }
            : comentario
        );

        setTarefa({
          ...tarefa,
          comentarios: comentariosAtualizados,
        });

        setEditingCommentId(null);
        setEditCommentText("");
      }
    } catch (error) {
      console.error("Erro ao atualizar comentário:", error);
    }
  };

  const cancelarEdicaoComentario = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  const excluirComentario = async (comentarioId: string) => {
    if (
      !tarefa ||
      !window.confirm("Tem certeza que deseja excluir este comentário?")
    )
      return;

    try {
      const success = await commentsService.deleteComment(comentarioId);
      if (success) {
        const comentariosAtualizados = tarefa.comentarios.filter(
          (comentario) => comentario.id !== comentarioId
        );

        setTarefa({
          ...tarefa,
          comentarios: comentariosAtualizados,
        });
      }
    } catch (error) {
      console.error("Erro ao excluir comentário:", error);
    }
  };

  // Funções auxiliares para text-to-speech
  const stopCurrentSpeech = () => {
    console.log(
      "stopCurrentSpeech called, speaking:",
      window.speechSynthesis.speaking
    );
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentUtterance(null);
  };

  const pauseCurrentSpeech = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeCurrentSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const startSpeech = (
    text: string,
    type: "description" | "comment",
    commentId?: string
  ) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Text-to-speech não é suportado neste navegador");
      return;
    }

    console.log("Starting speech:", {
      type,
      text: text.substring(0, 50) + "...",
    });

    // Para qualquer reprodução atual apenas se estiver tocando
    if (window.speechSynthesis.speaking) {
      console.log("Stopping current speech before starting new one");
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      console.log("Speech started");
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentPlayingType(type);
      if (type === "comment" && commentId) {
        setPlayingCommentId(commentId);
      } else {
        setPlayingCommentId(null);
      }
    };

    utterance.onend = () => {
      console.log("Speech ended");
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentPlayingType(null);
      setPlayingCommentId(null);
      setCurrentUtterance(null);
    };

    utterance.onerror = (event) => {
      console.log("Speech error:", event);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentPlayingType(null);
      setPlayingCommentId(null);
      setCurrentUtterance(null);
    };

    setCurrentUtterance(utterance);
    console.log("About to speak...");
    window.speechSynthesis.speak(utterance);
  };

  const ouvirDescricao = () => {
    if (!tarefa) return;

    // Se já está tocando a descrição, pausar ou retomar
    if (currentPlayingType === "description") {
      if (isPaused) {
        resumeCurrentSpeech();
      } else {
        pauseCurrentSpeech();
      }
      return;
    }

    // Texto completo: título + prioridade + descrição
    const prioridadeTexto = getPrioridadeText(tarefa.prioridade);
    const texto = `${tarefa.titulo}. Prioridade: ${prioridadeTexto}. ${tarefa.descricao}`;

    startSpeech(texto, "description");
  };

  const ouvirComentario = (comentario: Comentario) => {
    // Se já está tocando este comentário, pausar ou retomar
    if (
      playingCommentId === comentario.id &&
      currentPlayingType === "comment"
    ) {
      if (isPaused) {
        resumeCurrentSpeech();
      } else {
        pauseCurrentSpeech();
      }
      return;
    }

    // Texto do comentário com autor
    const texto = `Comentário de ${comentario.autor}: ${comentario.texto}`;

    startSpeech(texto, "comment", comentario.id);
  };

  // Limpar estados ao desmontar o componente ou mudar de página
  useEffect(() => {
    // Função para parar áudio quando a página for escondida/fechada
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCurrentSpeech();
      }
    };

    // Função para parar áudio antes de sair da página
    const handleBeforeUnload = () => {
      stopCurrentSpeech();
    };

    // Adicionar event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup: remover event listeners e parar áudio ao desmontar
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopCurrentSpeech();
    };
  }, []); // Array vazio para executar apenas uma vez

  const formatarDataHora = (data: Date) => {
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (!tarefa) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className={`${
          isModalOpen ? "" : "sticky top-0"
        } z-50 bg-white px-4 py-4 flex items-center justify-between shadow-sm`}
      >
        <div className="flex items-center">
          <Link href={`/lista/${listaSlug}`} className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">
            {isEditing ? "Editar Tarefa" : "Detalhes da Tarefa"}
          </h1>
        </div>

        {!isEditing && userType === "contratante" && !isLoadingUserType && (
          <button
            onClick={iniciarEdicao}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            title="Editar tarefa"
          >
            <Edit3 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Título da Tarefa */}
        <div>
          {!isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {tarefa.titulo}
                </h2>
                <span className={getPrioridadeStyle(tarefa.prioridade)}>
                  {getPrioridadeText(tarefa.prioridade)}
                </span>
              </div>

              {/* Categoria */}
              <div className="flex items-center space-x-2 text-gray-600 mb-4">
                {getCategoriaIcon(tarefa.categoria)}
                <span>{getCategoriaText(tarefa.categoria)}</span>
              </div>

              {/* Descrição */}
              <p className="text-gray-600 leading-relaxed mb-6">
                {tarefa.descricao}
              </p>
            </>
          ) : (
            <>
              {/* Formulário de Edição */}
              <div className="space-y-6 mb-6">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Tarefa
                  </label>
                  <input
                    type="text"
                    value={editForm.titulo}
                    onChange={(e) =>
                      setEditForm({ ...editForm, titulo: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Digite o título da tarefa"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Categoria
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        key: "limpeza-geral",
                        label: "Limpeza Geral",
                        icon: <Sparkles className="w-5 h-5" />,
                      },
                      {
                        key: "cozinha",
                        label: "Cozinha",
                        icon: <Sparkles className="w-5 h-5" />,
                      },
                      {
                        key: "banheiro",
                        label: "Banheiro",
                        icon: <Sparkles className="w-5 h-5" />,
                      },
                      {
                        key: "quartos",
                        label: "Quartos",
                        icon: <Sparkles className="w-5 h-5" />,
                      },
                      {
                        key: "area-externa",
                        label: "Área Externa",
                        icon: <TreePine className="w-5 h-5" />,
                      },
                      {
                        key: "organizacao",
                        label: "Organização",
                        icon: <MoreHorizontal className="w-5 h-5" />,
                      },
                      {
                        key: "manutencao",
                        label: "Manutenção",
                        icon: <Wrench className="w-5 h-5" />,
                      },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            categoria: cat.key as
                              | "limpeza-geral"
                              | "cozinha"
                              | "banheiro"
                              | "quartos"
                              | "area-externa"
                              | "organizacao"
                              | "manutencao"
                              | "personalizada",
                          })
                        }
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          editForm.categoria === cat.key
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {cat.icon}
                          <span className="font-medium">{cat.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Prioridade
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        key: "baixa",
                        label: "Baixa",
                        icon: <ArrowDown className="w-4 h-4" />,
                      },
                      {
                        key: "media",
                        label: "Média",
                        icon: <Minus className="w-4 h-4" />,
                      },
                      {
                        key: "alta",
                        label: "Alta",
                        icon: <ArrowUp className="w-4 h-4" />,
                      },
                    ].map((prio) => (
                      <button
                        key={prio.key}
                        type="button"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            prioridade: prio.key as "alta" | "media" | "baixa",
                          })
                        }
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          editForm.prioridade === prio.key
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          {prio.icon}
                          <span className="font-medium text-sm">
                            {prio.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={editForm.descricao}
                    onChange={(e) =>
                      setEditForm({ ...editForm, descricao: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Digite a descrição da tarefa"
                  />
                </div>

                {/* Imagens */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Imagens
                  </label>

                  {/* Imagens existentes */}
                  {editForm.imagens.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {editForm.imagens.map((imagem, index) => (
                        <div key={index} className="relative">
                          <img
                            src={imagem}
                            alt={`Imagem ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removerImagem(index)}
                            className="absolute top-2 right-2 p-1 text-gray-700 hover:text-gray-900 transition-colors"
                            title="Remover imagem"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload de imagens novas */}
                  <label className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center space-x-2 cursor-pointer">
                    <Upload className="w-5 h-5" />
                    <span>Adicionar Imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => adicionarImagem(e.target.files)}
                    />
                  </label>

                  {/* Arquivos locais pendentes de upload */}
                  {localFiles.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {localFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <div className="w-full h-32 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600 px-2 text-center">
                            {file.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => removerArquivoLocal(index)}
                            className="absolute top-2 right-2 p-1 text-gray-700 hover:text-gray-900 transition-colors"
                            title="Remover arquivo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Botão Ouvir Descrição - apenas no modo visualização */}
          {!isEditing && (
            <button
              onClick={ouvirDescricao}
              className="w-full py-4 px-6 rounded-lg font-medium flex items-center justify-center space-x-3 transition-all bg-green-500 hover:bg-green-600 text-white"
            >
              {currentPlayingType === "description" &&
              isPlaying &&
              !isPaused ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
              <span>
                {currentPlayingType === "description" && isPlaying && !isPaused
                  ? "Pausar Leitura"
                  : currentPlayingType === "description" && isPaused
                  ? "Retomar Leitura"
                  : "Ouvir Descrição da Tarefa"}
              </span>
            </button>
          )}
        </div>

        {/* Imagens - apenas no modo visualização */}
        {!isEditing && tarefa.imagens && tarefa.imagens.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Imagens
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {tarefa.imagens.map((imagem, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedImage(imagem);
                    setIsImageOpen(true);
                  }}
                  className="relative focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg"
                  aria-label={`Abrir imagem ${index + 1}`}
                >
                  <img
                    src={imagem}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comentários */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Comentários
          </h3>

          {/* Lista de comentários */}
          <div className="space-y-4 mb-6">
            {tarefa.comentarios.map((comentario) => (
              <div
                key={comentario.id}
                className={`${getComentarioStyle(
                  comentario.autor
                )} rounded-lg p-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingCommentId === comentario.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                          placeholder="Editar comentário..."
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={salvarEdicaoComentario}
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={cancelarEdicaoComentario}
                            className="px-3 py-1 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-800 mb-2">{comentario.texto}</p>
                        <p className="text-sm text-gray-500">
                          - {comentario.autor}
                          {comentario.tipo && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 align-middle">
                              {comentario.tipo}
                            </span>
                          )}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-3">
                    {isEditing && editingCommentId !== comentario.id && (
                      <>
                        <button
                          onClick={() => iniciarEdicaoComentario(comentario)}
                          className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Editar comentário"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => excluirComentario(comentario.id)}
                          className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors"
                          title="Excluir comentário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => ouvirComentario(comentario)}
                      className={`p-2 rounded-full transition-colors ${
                        playingCommentId === comentario.id &&
                        currentPlayingType === "comment"
                          ? "bg-green-600 text-white"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                      title={
                        playingCommentId === comentario.id &&
                        currentPlayingType === "comment"
                          ? isPaused
                            ? "Retomar comentário"
                            : "Pausar comentário"
                          : "Ouvir comentário"
                      }
                    >
                      {playingCommentId === comentario.id &&
                      currentPlayingType === "comment" &&
                      isPlaying &&
                      !isPaused ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Adicionar comentário */}
          <div className="flex space-x-3">
            <input
              type="text"
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Adicionar um comentário..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  adicionarComentario();
                }
              }}
            />
            <button
              onClick={adicionarComentario}
              disabled={!novoComentario.trim()}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Botão Marcar como Concluída */}
        <div className="pt-4">
          <button
            onClick={toggleTarefaConcluida}
            className={`w-full py-4 px-6 rounded-lg font-medium flex items-center justify-center space-x-3 transition-all ${
              tarefa.concluida
                ? "bg-gray-500 hover:bg-gray-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            <Check className="w-5 h-5" />
            <span>
              {tarefa.concluida
                ? "Marcar como Pendente"
                : "Marcar como Concluída"}
            </span>
          </button>

          {tarefa.concluida && tarefa.dataConlusao && (
            <p className="text-center text-sm text-green-600 mt-2">
              Concluída em {formatarDataHora(tarefa.dataConlusao)}
            </p>
          )}

          {/* Botões de Edição - apenas quando estiver editando */}
          {isEditing && (
            <div className="flex space-x-3 mt-4">
              <button
                onClick={salvarEdicao}
                disabled={isSaving}
                className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{isSaving ? "Salvando..." : "Salvar"}</span>
              </button>
              <button
                onClick={cancelarEdicao}
                className="flex-1 py-3 px-6 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Cancelar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>
      {/* Visualizador de Imagem em Tela Cheia */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 border-0 bg-black/90">
          <DialogTitle className="sr-only">Visualização da Imagem</DialogTitle>
          {selectedImage && (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Imagem em tamanho grande"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
