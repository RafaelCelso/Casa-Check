"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowLeft,
  Home,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { ErrorModal } from "@/components/ui/error-modal";

export default function CadastroPage() {
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get("tipo");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    tipo: tipoParam || "contratante",
  });

  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!isValidEmail(formData.email)) {
      setErrorModal({
        isOpen: true,
        title: "Email inválido",
        message: "Por favor, insira um email válido",
      });
      return;
    }

    if (!isValidPassword(formData.password)) {
      setErrorModal({
        isOpen: true,
        title: "Senha inválida",
        message: "A senha deve ter pelo menos 6 caracteres",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorModal({
        isOpen: true,
        title: "Senhas não coincidem",
        message: "As senhas digitadas não são iguais",
      });
      return;
    }

    if (formData.name.trim().length < 2) {
      setErrorModal({
        isOpen: true,
        title: "Nome inválido",
        message: "Por favor, insira seu nome completo",
      });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.name,
          phone: formData.phone,
          account_type: formData.tipo,
        },
        // Importante: não enviar emailRedirectTo se a URL não estiver allowlisted no Supabase
      },
    });

    if (error) {
      // Tratamento específico para e-mail já existente
      if (
        error.message?.includes("already registered") ||
        error.message?.includes("User already registered")
      ) {
        setErrorModal({
          isOpen: true,
          title: "Email já cadastrado",
          message:
            "Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.",
        });
      } else {
        setErrorModal({
          isOpen: true,
          title: "Erro ao criar conta",
          message: error.message || "Falha ao criar conta. Tente novamente.",
        });
      }
      return;
    }

    // Se já houver sessão (email confirmação desativada), atualiza metadados
    if (data.session && data.user) {
      // Atualiza metadados de exibição no Auth (Display name/Phone)
      await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          phone: formData.phone,
          account_type: formData.tipo,
        },
      });
    }

    // Caso o projeto exija confirmação por email, informar o usuário
    if (data?.user && !data.user?.email_confirmed_at) {
      setErrorModal({
        isOpen: true,
        title: "Conta criada!",
        message: "Verifique seu email para confirmar o cadastro.",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return;
    }

    window.location.href = "/onboarding";
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Função para formatar nome (primeira letra maiúscula)
  const formatName = (value: string) => {
    return value
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Função para validar email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Função para validar senha
  const isValidPassword = (password: string) => {
    return password.length >= 6;
  };

  return (
    <div className="min-h-screen bg-white from-blue-50 to-gray-100 p-4">
      {/* Botão voltar no topo */}
      <div className="flex items-center justify-start pt-4 pb-8">
        <Link href="/tipo-conta">
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
            <h1 className="text-xl font-semibold text-gray-800">Casa Check</h1>
          </div>

          {/* Indicador do tipo de conta selecionado */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center bg-green-100 px-4 py-2 rounded-full">
              {formData.tipo === "contratante" ? (
                <Home className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <Briefcase className="h-5 w-5 text-green-600 mr-2" />
              )}
              <span className="text-green-700 font-medium">
                {formData.tipo === "contratante"
                  ? "Contratante"
                  : "Prestador de Serviços"}
              </span>
            </div>
          </div>

          {/* Título da página */}
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Criar sua conta
            </h2>
            <p className="text-gray-500">Preencha os dados para começar.</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Nome */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => {
                  const formattedName = formatName(e.target.value);
                  handleInputChange("name", formattedName);
                }}
                className="pl-10 py-3 h-12 bg-green-50 border-green-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-400 focus:ring-green-400"
                required
                minLength={2}
              />
            </div>

            {/* Campo Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="email"
                placeholder="exemplo@email.com"
                value={formData.email}
                onChange={(e) =>
                  handleInputChange("email", e.target.value.toLowerCase())
                }
                className={`pl-10 py-3 h-12 bg-green-50 border-green-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-400 focus:ring-green-400 ${
                  formData.email && !isValidEmail(formData.email)
                    ? "border-red-300 focus:border-red-400"
                    : ""
                }`}
                required
              />
              {formData.email && !isValidEmail(formData.email) && (
                <p className="text-red-500 text-xs mt-1 ml-1">Email inválido</p>
              )}
            </div>

            {/* Campo Telefone */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-gray-400" />
              </div>
              <MaskedInput
                mask="(99) 99999-9999"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="pl-10 py-3 bg-green-50 border-green-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-400 focus:ring-green-400"
              />
              <p className="text-gray-500 text-xs mt-1 ml-1">Opcional</p>
            </div>

            {/* Campo Senha */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`pl-10 py-3 h-12 bg-green-50 border-green-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-400 focus:ring-green-400 ${
                  formData.password && !isValidPassword(formData.password)
                    ? "border-red-300 focus:border-red-400"
                    : ""
                }`}
                required
                minLength={6}
              />
              {formData.password && !isValidPassword(formData.password) && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  Senha deve ter pelo menos 6 caracteres
                </p>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="password"
                placeholder="Confirmar senha"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                className={`pl-10 py-3 h-12 bg-green-50 border-green-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-400 focus:ring-green-400 ${
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword
                    ? "border-red-300 focus:border-red-400"
                    : ""
                }`}
                required
              />
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 ml-1">
                    Senhas não coincidem
                  </p>
                )}
            </div>

            {/* Botão Cadastrar */}
            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg rounded-xl mt-6"
              size="lg"
            >
              Criar Conta
            </Button>
          </form>

          {/* Link para login */}
          <div className="text-center text-gray-600 mt-6">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-green-600 font-medium hover:underline"
            >
              Fazer Login
            </Link>
          </div>

          {/* Termos */}
          <div className="text-center text-xs text-gray-500 mt-6">
            Ao criar uma conta, você concorda com nossos{" "}
            <span className="text-green-600 underline cursor-pointer">
              Termos de Serviço
            </span>{" "}
            e{" "}
            <span className="text-green-600 underline cursor-pointer">
              Política de Privacidade
            </span>
            .
          </div>
        </div>
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>

      {/* Modal de Erro */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: "", message: "" })}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.title === "Conta criada!" ? "info" : "error"}
      />
    </div>
  );
}
