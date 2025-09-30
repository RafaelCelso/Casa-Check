"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useModal } from "@/contexts/modal-context";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { supabase } from "@/lib/supabase";
import {
  Home,
  Search,
  Bell,
  MoreHorizontal,
  Plus,
  X,
  List,
  UserPlus,
  CheckCircle,
} from "lucide-react";

export default function BottomNavigation() {
  const pathname = usePathname();
  const { isModalOpen, setIsModalOpen } = useModal();
  const [isAnimating, setIsAnimating] = useState(false);
  const { user, isLoading } = useAuth();
  const [userType, setUserType] = useState<string>("contratante");
  const [isLoadingUserType, setIsLoadingUserType] = useState(true);

  const isActive = (path: string) => pathname === path;

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

    if (!isLoading) {
      loadUserType();
    }
  }, [user, isLoading]);

  const openModal = () => {
    setIsModalOpen(true);
    // Pequeno delay para permitir que o modal seja renderizado antes da animação
    setTimeout(() => {
      setIsAnimating(true);
    }, 10);
  };

  const closeModal = () => {
    setIsAnimating(false);
    // Aguarda a animação terminar antes de remover o modal
    setTimeout(() => {
      setIsModalOpen(false);
    }, 300);
  };

  const toggleModal = () => {
    if (isModalOpen) {
      closeModal();
    } else {
      openModal();
    }
  };

  return (
    <>
      {/* Modal Overlay */}
      {!isLoadingUserType && userType === "contratante" && isModalOpen && (
        <div className="fixed inset-0 z-40">
          {/* Blur Background */}
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-24 shadow-2xl transition-transform duration-300 ease-out ${
              isAnimating ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="space-y-6">
              {/* Criar Nova Lista */}
              <Link
                href="/nova-lista"
                className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl transition-colors"
                onClick={closeModal}
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <List className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Criar Nova Lista
                  </h3>
                  <p className="text-sm text-gray-500">
                    Organize tarefas para um novo serviço
                  </p>
                </div>
              </Link>

              {/* Convidar Prestador */}
              <Link
                href="/convidar-prestador"
                className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl transition-colors"
                onClick={closeModal}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Convidar Prestador
                  </h3>
                  <p className="text-sm text-gray-500">
                    Envie um convite para seu prestador
                  </p>
                </div>
              </Link>

              {/* Adicionar Tarefa Rápida */}
              <Link
                href="/tarefa-rapida"
                className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl transition-colors"
                onClick={closeModal}
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Adicionar Tarefa Rápida
                  </h3>
                  <p className="text-sm text-gray-500">
                    Anote uma tarefa para depois
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-30">
        <div className="flex items-end justify-around relative">
          <Link href="/inicio" className="flex flex-col items-center py-2">
            <Home
              className={`w-6 h-6 ${
                isActive("/inicio") ? "text-green-500" : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs mt-1 ${
                isActive("/inicio") ? "text-green-500" : "text-gray-400"
              }`}
            >
              Início
            </span>
          </Link>

          {!isLoadingUserType && userType === "contratante" && (
            <Link href="/buscar" className="flex flex-col items-center py-2">
              <Search
                className={`w-6 h-6 ${
                  isActive("/buscar") ? "text-green-500" : "text-gray-400"
                }`}
              />
              <span
                className={`text-xs mt-1 ${
                  isActive("/buscar") ? "text-green-500" : "text-gray-400"
                }`}
              >
                Buscar
              </span>
            </Link>
          )}

          {!isLoadingUserType && userType === "contratante" && (
            <button
              onClick={toggleModal}
              className="flex flex-col items-center relative -top-4"
            >
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-all duration-200">
                {isModalOpen ? (
                  <X className="w-7 h-7 text-white" />
                ) : (
                  <Plus className="w-7 h-7 text-white" />
                )}
              </div>
            </button>
          )}

          <Link
            href="/notificacoes"
            className="flex flex-col items-center py-2"
          >
            <Bell
              className={`w-6 h-6 ${
                isActive("/notificacoes") ? "text-green-500" : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs mt-1 ${
                isActive("/notificacoes") ? "text-green-500" : "text-gray-400"
              }`}
            >
              Notificações
            </span>
          </Link>

          <Link href="/mais" className="flex flex-col items-center py-2">
            <MoreHorizontal
              className={`w-6 h-6 ${
                isActive("/mais") ? "text-green-500" : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs mt-1 ${
                isActive("/mais") ? "text-green-500" : "text-gray-400"
              }`}
            >
              Mais
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
