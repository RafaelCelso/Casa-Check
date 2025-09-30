"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function EsqueceuSenhaPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/alterar-senha`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo,
      }
    );
    if (error) {
      alert(error.message || "Falha ao enviar email de recuperação");
      return;
    }
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white from-blue-50 to-gray-100 p-4">
        {/* Botão voltar no topo */}
        <div className="flex items-center justify-start pt-4 pb-8">
          <Link href="/login">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full space-y-8">
            {/* Título */}
            <div className="text-center mb-8">
              <h1 className="text-xl font-semibold text-gray-800">
                Recuperar Senha
              </h1>
            </div>

            {/* Conteúdo de confirmação */}
            <div className="text-center space-y-4">
              <div className="text-6xl mb-6">📧</div>
              <h2 className="text-2xl font-bold text-gray-800">
                Email enviado!
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Enviamos um link de redefinição de senha para{" "}
                <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
              </p>

              <div className="pt-6">
                <Link href="/login">
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg rounded-xl"
                    size="lg"
                  >
                    Voltar para o Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 p-4">
      {/* Botão voltar no topo */}
      <div className="flex items-center justify-start pt-4 pb-8">
        <Link href="/login">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <Image
                src="/image/Casa Check logo.webp"
                alt="Casa Check Logo"
                width={60}
                height={60}
                className="w-15 h-15 object-contain"
                priority
              />
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-gray-800">
              Recuperar Senha
            </h1>
          </div>

          {/* Título e descrição */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Esqueceu sua senha?
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Insira seu e-mail ou nome de usuário para receber um link de
              redefinição de senha.
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Label do campo */}
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">
                E-mail ou nome de usuário
              </label>

              {/* Campo de entrada */}
              <Input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="py-4 bg-green-50 border-green-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-400 focus:ring-green-400"
                required
              />
            </div>

            {/* Botão Enviar */}
            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg rounded-xl mt-8"
              size="lg"
            >
              Enviar Link de Redefinição
            </Button>
          </form>

          {/* Link para voltar ao login */}
          <div className="text-center mt-12">
            <Link
              href="/login"
              className="text-green-600 font-medium hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
