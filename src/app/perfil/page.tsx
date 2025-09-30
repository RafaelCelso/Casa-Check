"use client";
import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  RefreshCw,
  ChevronRight,
  Edit3,
  Save,
  X,
  Upload,
  Star,
  Plus,
  Home,
  ChefHat,
  Bath,
  Bed,
  TreePine,
  Archive,
  Wrench,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { useModal } from "@/contexts/modal-context";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export default function PerfilPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { isModalOpen } = useModal();
  const [isFetching, setIsFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Extrai o caminho do objeto no Storage a partir da URL pública
  const getStoragePathFromUrl = (url: string | null | undefined) => {
    if (!url) return null;
    const marker = "/storage/v1/object/public/avatars/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  };
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    localidade: "",
    tipo: "",
    avatar_url: "",
    rating: 0,
    service_types: [] as string[],
  });

  // Categorias disponíveis para prestadores
  const categoriasDisponiveis = [
    {
      id: "limpeza-geral",
      nome: "Limpeza Geral",
      icone: Home,
    },
    {
      id: "cozinha",
      nome: "Cozinha",
      icone: ChefHat,
    },
    {
      id: "banheiro",
      nome: "Banheiro",
      icone: Bath,
    },
    {
      id: "quartos",
      nome: "Quartos",
      icone: Bed,
    },
    {
      id: "area-externa",
      nome: "Área Externa",
      icone: TreePine,
    },
    {
      id: "organizacao",
      nome: "Organização",
      icone: Archive,
    },
    {
      id: "manutencao",
      nome: "Manutenção",
      icone: Wrench,
    },
  ];

  // Carregar dados do usuário logado
  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setIsFetching(true);

      const { data } = await supabase
        .from("user")
        .select(
          "name, email, phone, location, tipo, avatar_url, rating, service_types"
        )
        .eq("id", user.id)
        .single();

      setFormData({
        nome: data?.name || (user.user_metadata as any)?.name || "",
        email: data?.email || user.email || "",
        telefone: data?.phone || "",
        localidade: data?.location || "",
        tipo: data?.tipo || (user.user_metadata as any)?.tipo || "",
        avatar_url: data?.avatar_url || "",
        rating: data?.rating || 0,
        service_types: data?.service_types || [],
      });
      setIsFetching(false);
    };

    if (!isLoading) {
      load();
    }
  }, [user, isLoading]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setUploadingImage(true);
    try {
      // Upload da imagem para o Supabase Storage (em pasta do usuário)
      const fileName = `avatar-${user.id}-${Date.now()}.${file.name
        .split(".")
        .pop()}`;
      const objectPath = `${user.id}/${fileName}`; // compatível com policy por pasta
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(objectPath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error("Erro ao fazer upload:", uploadError);
        alert("Erro ao fazer upload da imagem");
        return;
      }

      // Obter URL pública da imagem
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(objectPath);

      if (publicUrlData) {
        const newUrl = publicUrlData.publicUrl;

        // Apagar arquivo anterior (se existir)
        const oldPath = getStoragePathFromUrl(formData.avatar_url);
        if (oldPath) {
          const { error: removeError } = await supabase.storage
            .from("avatars")
            .remove([oldPath]);
          if (removeError) {
            console.warn(
              "Não foi possível remover avatar anterior:",
              removeError
            );
          }
        }

        setFormData((prev) => ({
          ...prev,
          avatar_url: newUrl,
        }));

        // Persistir imediatamente no banco para manter após recarregar
        const { error: saveAvatarError } = await supabase
          .from("user")
          .update({ avatar_url: newUrl })
          .eq("id", user.id);

        if (saveAvatarError) {
          console.error("Erro ao salvar avatar_url:", saveAvatarError);
        }
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
      alert("Erro inesperado ao fazer upload");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user")
        .update({
          name: formData.nome,
          phone: formData.telefone,
          location: formData.localidade,
          avatar_url: formData.avatar_url,
          service_types: formData.service_types,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar alterações");
        return;
      }

      setIsEditing(false);
      setIsConfirmOpen(true);
    } catch (error) {
      console.error("Erro inesperado:", error);
      alert("Erro inesperado ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  // Função para adicionar/remover categoria
  const toggleCategoria = (categoriaId: string) => {
    setFormData((prev) => ({
      ...prev,
      service_types: prev.service_types.includes(categoriaId)
        ? prev.service_types.filter((id) => id !== categoriaId)
        : [...prev.service_types, categoriaId],
    }));
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error.message || "Falha ao sair");
      return;
    }
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de confirmação */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Confirmação</DialogTitle>
          <div className="text-center py-2">
            <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Perfil atualizado
            </h3>
            <p className="text-sm text-gray-600">
              Suas alterações foram salvas com sucesso.
            </p>
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Ok
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <div
        className={`${
          isModalOpen ? "" : "sticky top-0"
        } z-50 bg-white px-4 py-4 flex items-center justify-between shadow-sm`}
      >
        <div className="flex items-center">
          <Link href="/inicio" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">Perfil</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Profile Information */}
        <div className="text-center mb-8">
          {/* Profile Picture */}
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto overflow-hidden">
              {formData.avatar_url ? (
                <Image
                  src={formData.avatar_url}
                  alt="Foto do perfil"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <Image
                  src="/image/Casa Check logo.webp"
                  alt="Foto do perfil"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
            </div>
            {/* Edit Profile Picture Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              aria-label="Alterar foto do perfil"
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
            >
              {uploadingImage ? (
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {formData.nome || "Usuário"}
          </h2>
          {formData.tipo && (
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 mb-2">
              {formData.tipo}
            </span>
          )}
          {formData.rating > 0 && (
            <div className="flex items-center justify-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">
                {formData.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-6 mb-8">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              readOnly={!isEditing}
              tabIndex={0}
              aria-label="Nome do usuário"
              className={`w-full px-4 py-3 border border-gray-200 rounded-lg ${
                isEditing
                  ? "bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  : "bg-gray-100"
              }`}
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={formData.email}
              readOnly
              tabIndex={0}
              aria-label="E-mail do usuário"
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => handleInputChange("telefone", e.target.value)}
              readOnly={!isEditing}
              tabIndex={0}
              aria-label="Telefone do usuário"
              className={`w-full px-4 py-3 border border-gray-200 rounded-lg ${
                isEditing
                  ? "bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  : "bg-gray-100"
              }`}
            />
          </div>

          {/* Localidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localidade
            </label>
            <input
              type="text"
              value={formData.localidade}
              onChange={(e) => handleInputChange("localidade", e.target.value)}
              readOnly={!isEditing}
              tabIndex={0}
              aria-label="Localidade do usuário"
              className={`w-full px-4 py-3 border border-gray-200 rounded-lg ${
                isEditing
                  ? "bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  : "bg-gray-100"
              }`}
            />
          </div>
        </div>

        {/* Categorias de Serviços - Apenas para prestadores */}
        {formData.tipo === "prestador" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                Categorias de Serviços
              </label>
              {isEditing && (
                <span className="text-xs text-gray-500">
                  {formData.service_types.length} selecionada(s)
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                {categoriasDisponiveis.map((categoria) => {
                  const IconeComponent = categoria.icone;
                  const isSelected = formData.service_types.includes(
                    categoria.id
                  );

                  return (
                    <button
                      key={categoria.id}
                      onClick={() => toggleCategoria(categoria.id)}
                      className={`p-3 rounded-xl border-2 flex items-center space-x-2 transition-all ${
                        isSelected
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-green-300"
                      }`}
                    >
                      <IconeComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {categoria.nome}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.service_types.length > 0 ? (
                  formData.service_types.map((categoriaId) => {
                    const categoria = categoriasDisponiveis.find(
                      (c) => c.id === categoriaId
                    );
                    if (!categoria) return null;

                    const IconeComponent = categoria.icone;
                    return (
                      <div
                        key={categoriaId}
                        className="inline-flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700"
                      >
                        <IconeComponent className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {categoria.nome}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Nenhuma categoria selecionada
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Links */}
        <div className="mb-8">
          <Link
            href="/alterar-senha"
            className="flex items-center justify-between py-3 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="font-medium">Alterar senha</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Edit/Save/Cancel Buttons */}
        <div className="mb-8">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Edit3 className="w-5 h-5" />
              <span>Editar perfil</span>
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{isSaving ? "Salvando..." : "Salvar alterações"}</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Cancelar</span>
              </button>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-colors"
        >
          Sair da conta
        </button>
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>
    </div>
  );
}
