"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    if (!email || !password) {
      setErrorMessage("Preencha email e senha");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setErrorMessage(
        error.message === "Email not confirmed"
          ? "Verifique seu email para confirmar a conta."
          : "Falha ao entrar. Verifique suas credenciais."
      );
      setIsLoading(false);
      return;
    }

    router.push("/inicio");
  };

  return (
    <div className="min-h-screen bg-white from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <Image
              src="/image/Casa Check logo.webp"
              alt="Casa Check Logo"
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
              priority
            />
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Casa Check</h1>
        </div>

        {/* Título da página */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Bem-vindo de volta
          </h2>
          <p className="text-gray-500">Faça login para continuar.</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Email */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="email"
              placeholder="E-mail ou nome de usuário"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 py-3 h-12 bg-green-50 border-green-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-400 focus:ring-green-400"
              required
            />
          </div>

          {/* Campo Senha */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 py-3 h-12 bg-green-50 border-green-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-400 focus:ring-green-400"
              required
            />
          </div>

          {errorMessage && (
            <p className="text-red-600 text-sm" role="alert" aria-live="polite">
              {errorMessage}
            </p>
          )}

          {/* Link Esqueceu a senha */}
          <div className="text-right">
            <Link
              href="/esqueceu-senha"
              className="text-green-600 text-sm hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>

          {/* Botão Entrar */}
          <Button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg rounded-xl mt-6"
            size="lg"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        {/* Link para criar conta */}
        <div className="text-center text-gray-600 mt-8">
          Não tem uma conta?{" "}
          <Link
            href="/tipo-conta"
            className="text-green-600 font-medium hover:underline"
          >
            Criar Conta
          </Link>
        </div>
      </div>
    </div>
  );
}
