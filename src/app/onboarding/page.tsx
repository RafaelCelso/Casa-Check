"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const [userType, setUserType] = useState<string>("contratante");
  const [isLoadingUserType, setIsLoadingUserType] = useState(true);

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
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Ilustração de Onboarding */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <Image
              src="/image/Onboarding.webp"
              alt="Pessoas fazendo limpeza doméstica"
              width={300}
              height={200}
              className="w-full max-w-sm h-auto object-contain"
              priority
            />
          </div>
        </div>

        {/* Título e descrição */}
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Bem-vindo ao Casa Check
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed px-4">
            {isLoadingUserType
              ? "Carregando..."
              : userType === "prestador"
              ? "Veja as listas de tarefas compartilhadas com você, organize suas tarefas e simplifique a comunicação com os contratantes"
              : "Organize suas tarefas domésticas e simplifique a comunicação com prestadores de serviços."}
          </p>
        </div>

        {/* Botão */}
        <div className="pt-8">
          <Link href="/onboarding-2" className="block">
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg rounded-xl"
              size="lg"
            >
              Começar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
