import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-8 rounded-3xl shadow-lg">
            <Image
              src="/image/Casa Check logo.webp"
              alt="Casa Check Logo"
              width={128}
              height={128}
              className="w-32 h-32 object-contain"
              priority
            />
          </div>
        </div>

        {/* Título e descrição */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Bem-vindo ao Casa Check
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Organize sua casa com facilidade. Gerencie tarefas, encontre
            prestadores e mantenha tudo em ordem.
          </p>
        </div>

        {/* Botões */}
        <div className="space-y-4">
          <Link href="/login" className="block">
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg rounded-xl"
              size="lg"
            >
              Entrar
            </Button>
          </Link>

          <Link href="/tipo-conta" className="block">
            <Button
              variant="outline"
              className="w-full bg-green-100 hover:bg-green-200 text-green-700 border-green-300 font-semibold py-4 text-lg rounded-xl"
              size="lg"
            >
              Cadastrar-se
            </Button>
          </Link>
        </div>

        {/* Termos */}
        <div className="text-center text-sm text-gray-500 mt-8">
          Ao continuar, você concorda com nossos{" "}
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
  );
}
