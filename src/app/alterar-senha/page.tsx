"use client";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/contexts/modal-context";
import { useEffect } from "react";

export default function AlterarSenhaPage() {
  const { isModalOpen } = useModal();
  const [formData, setFormData] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    senhaAtual: false,
    novaSenha: false,
    confirmarSenha: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro quando o usuário começar a digitar
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.senhaAtual) {
      newErrors.senhaAtual = "Senha atual é obrigatória";
    }

    if (!formData.novaSenha) {
      newErrors.novaSenha = "Nova senha é obrigatória";
    } else if (formData.novaSenha.length < 6) {
      newErrors.novaSenha = "A nova senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = "Confirmação de senha é obrigatória";
    } else if (formData.novaSenha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem";
    }

    if (formData.senhaAtual === formData.novaSenha) {
      newErrors.novaSenha = "A nova senha deve ser diferente da senha atual";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Existem dois fluxos: recuperação (link mágico abre esta página) e troca autenticada
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Se houve recuperação via link (user está numa sessão de recuperação), apenas atualiza a senha
    if (session) {
      const { error } = await supabase.auth.updateUser({
        password: formData.novaSenha,
      });
      if (error) {
        alert(error.message || "Falha ao alterar senha");
        return;
      }
    } else {
      // Sem sessão: tentar login com senha atual e então alterar
      const emailFromPrompt = window.prompt(
        "Digite seu email para confirmar a alteração de senha"
      );
      if (!emailFromPrompt) return;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailFromPrompt.trim().toLowerCase(),
        password: formData.senhaAtual,
      });
      if (signInError) {
        alert("Credenciais inválidas");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.novaSenha,
      });
      if (updateError) {
        alert(updateError.message || "Falha ao alterar senha");
        return;
      }
    }

    setFormData({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
    alert("Senha alterada com sucesso!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className={`${
          isModalOpen ? "" : "sticky top-0"
        } z-50 bg-white px-4 py-4 flex items-center justify-between shadow-sm`}
      >
        <div className="flex items-center">
          <Link href="/perfil" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">Alterar Senha</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Senha Atual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Atual
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type={showPasswords.senhaAtual ? "text" : "password"}
                value={formData.senhaAtual}
                onChange={(e) =>
                  handleInputChange("senhaAtual", e.target.value)
                }
                className={`pl-10 py-3 h-12 bg-gray-100 border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:border-green-400 focus:ring-green-400 ${
                  errors.senhaAtual ? "border-red-500" : ""
                }`}
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("senhaAtual")}
                className="absolute inset-y-0 right-3 flex items-center"
              >
                {showPasswords.senhaAtual ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.senhaAtual && (
              <p className="text-red-500 text-sm mt-1">{errors.senhaAtual}</p>
            )}
          </div>

          {/* Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type={showPasswords.novaSenha ? "text" : "password"}
                value={formData.novaSenha}
                onChange={(e) => handleInputChange("novaSenha", e.target.value)}
                className={`pl-10 py-3 h-12 bg-gray-100 border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:border-green-400 focus:ring-green-400 ${
                  errors.novaSenha ? "border-red-500" : ""
                }`}
                placeholder="Digite sua nova senha"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("novaSenha")}
                className="absolute inset-y-0 right-3 flex items-center"
              >
                {showPasswords.novaSenha ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.novaSenha && (
              <p className="text-red-500 text-sm mt-1">{errors.novaSenha}</p>
            )}
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type={showPasswords.confirmarSenha ? "text" : "password"}
                value={formData.confirmarSenha}
                onChange={(e) =>
                  handleInputChange("confirmarSenha", e.target.value)
                }
                className={`pl-10 py-3 h-12 bg-gray-100 border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:border-green-400 focus:ring-green-400 ${
                  errors.confirmarSenha ? "border-red-500" : ""
                }`}
                placeholder="Confirme sua nova senha"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirmarSenha")}
                className="absolute inset-y-0 right-3 flex items-center"
              >
                {showPasswords.confirmarSenha ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmarSenha && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmarSenha}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg rounded-lg mt-8"
            size="lg"
          >
            Alterar Senha
          </Button>
        </form>

        {/* Informações de Segurança */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Dicas de Segurança
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use pelo menos 6 caracteres</li>
            <li>• Combine letras, números e símbolos</li>
            <li>• Evite informações pessoais óbvias</li>
            <li>• Não reutilize senhas antigas</li>
          </ul>
        </div>
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>
    </div>
  );
}
