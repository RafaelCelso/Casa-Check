"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Briefcase } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TipoContaPage() {
  const [selectedType, setSelectedType] = useState<
    "contratante" | "prestador" | null
  >(null);
  const router = useRouter();

  const handleContinue = () => {
    if (selectedType) {
      // Redireciona para cadastro com o tipo selecionado como parâmetro
      router.push(`/cadastro?tipo=${selectedType}`);
    }
  };

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

          {/* Título e descrição */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Escolha o tipo de conta
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Selecione a opção que melhor descreve seu papel no aplicativo.
            </p>
          </div>

          {/* Opções de tipo de conta */}
          <div className="space-y-4 mb-12">
            {/* Contratante */}
            <div
              onClick={() => setSelectedType("contratante")}
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedType === "contratante"
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mr-4">
                <Home className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  Contratante
                </h3>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedType === "contratante"
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300"
                }`}
              >
                {selectedType === "contratante" && (
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                )}
              </div>
            </div>

            {/* Prestador de Serviços */}
            <div
              onClick={() => setSelectedType("prestador")}
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedType === "prestador"
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mr-4">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  Prestador de Serviços
                </h3>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedType === "prestador"
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300"
                }`}
              >
                {selectedType === "prestador" && (
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          </div>

          {/* Botão Continuar */}
          <Button
            onClick={handleContinue}
            disabled={!selectedType}
            className={`w-full font-semibold py-4 text-lg rounded-xl ${
              selectedType
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            size="lg"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
