"use client";
import { CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AvaliacaoSucessoPage() {
  const routeParams = useParams<{ id: string }>();
  const routeId = Array.isArray(routeParams.id)
    ? routeParams.id[0]
    : routeParams.id;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <Link href="/mais" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">
            Avaliação enviada
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            Obrigado pela sua avaliação!
          </h2>
          <p className="text-gray-600 text-base leading-relaxed max-w-sm">
            Sua opinião é muito importante para nós e ajuda outros usuários a
            encontrar os melhores profissionais.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <Link href={`/prestador/${routeId}`} className="block">
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors">
              Ver perfil do prestador
            </button>
          </Link>

          <Link href="/mais" className="block">
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors">
              Continuar avaliando
            </button>
          </Link>

          <Link href="/inicio" className="block">
            <button className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-4 px-6 rounded-lg transition-colors">
              Voltar para minhas listas
            </button>
          </Link>
        </div>
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>
    </div>
  );
}
