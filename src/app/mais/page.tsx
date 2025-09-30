"use client";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  HelpCircle,
  Info,
  ChevronRight,
  CheckCircle,
  User,
  Calendar,
  Star,
  StarIcon,
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/contexts/modal-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AjustesPage() {
  const router = useRouter();
  const { isModalOpen } = useModal();
  const [servicosRecebidos, setServicosRecebidos] = useState([
    {
      id: "1",
      nome: "Limpeza Residencial",
      prestador: "Mariana Silva",
      data: "15/01/2025",
      avaliado: false,
      avaliacao: null,
      cor: "green",
    },
    {
      id: "2",
      nome: "Organização de Quartos",
      prestador: "João Santos",
      data: "10/01/2025",
      avaliado: false,
      avaliacao: null,
      cor: "blue",
    },
    {
      id: "3",
      nome: "Limpeza de Cozinha",
      prestador: "Ana Costa",
      data: "08/01/2025",
      avaliado: true,
      avaliacao: 4.9,
      cor: "purple",
    },
  ]);

  // Verificar avaliações salvas no localStorage
  useEffect(() => {
    const avaliacoesSalvas = localStorage.getItem("avaliacoes");
    if (avaliacoesSalvas) {
      const avaliacoes = JSON.parse(avaliacoesSalvas);

      setServicosRecebidos((prevServicos) =>
        prevServicos.map((servico) => {
          const prestadorKey = servico.prestador
            .toLowerCase()
            .replace(" ", "-");
          if (avaliacoes[prestadorKey]) {
            return {
              ...servico,
              avaliado: true,
              avaliacao: avaliacoes[prestadorKey].rating,
            };
          }
          return servico;
        })
      );
    }
  }, []);

  // Escutar mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const avaliacoesSalvas = localStorage.getItem("avaliacoes");
      if (avaliacoesSalvas) {
        const avaliacoes = JSON.parse(avaliacoesSalvas);

        setServicosRecebidos((prevServicos) =>
          prevServicos.map((servico) => {
            const prestadorKey = servico.prestador
              .toLowerCase()
              .replace(" ", "-");
            if (avaliacoes[prestadorKey]) {
              return {
                ...servico,
                avaliado: true,
                avaliacao: avaliacoes[prestadorKey].rating,
              };
            }
            return servico;
          })
        );
      }
    };

    // Escutar mudanças no localStorage (incluindo da mesma aba)
    const interval = setInterval(() => {
      handleStorageChange();
    }, 1000);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-lg font-semibold text-gray-800">Mais</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Seção: Serviços Recebidos */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
              Serviços Recebidos
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {servicosRecebidos.length > 0 ? (
              servicosRecebidos.map((servico) => (
                <div key={servico.id}>
                  {servico.avaliado ? (
                    // Serviço já avaliado
                    <Link
                      href={`/prestador/${
                        servico.prestadorId ??
                        servico.prestador.toLowerCase().replace(" ", "-")
                      }?from=services`}
                      className="block"
                    >
                      <div className="flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-12 h-12 bg-${servico.cor}-100 rounded-full flex items-center justify-center`}
                          >
                            <User
                              className={`w-6 h-6 text-${servico.cor}-600`}
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">
                              {servico.nome}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {servico.prestador}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                Concluído em {servico.data}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">
                              {servico.avaliacao}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ) : (
                    // Serviço não avaliado
                    <div className="flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 bg-${servico.cor}-100 rounded-full flex items-center justify-center`}
                        >
                          <User className={`w-6 h-6 text-${servico.cor}-600`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {servico.nome}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {servico.prestador}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              Concluído em {servico.data}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/avaliar/${servico.prestador
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center space-x-1 text-sm">
                            <StarIcon className="w-3 h-3" />
                            <span>Avaliar</span>
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Mensagem quando não há serviços
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhum serviço concluído ainda</p>
                <p className="text-xs mt-1">
                  Os serviços aparecerão aqui após serem concluídos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Seção: Suporte */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <HelpCircle className="w-5 h-5 mr-3 text-orange-600" />
              Suporte
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <button className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left">
              <div className="flex items-center">
                <HelpCircle className="w-5 h-5 mr-3 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-800">
                    Central de Ajuda
                  </h3>
                  <p className="text-sm text-gray-500">
                    Perguntas frequentes e tutoriais
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left">
              <div className="flex items-center">
                <Info className="w-5 h-5 mr-3 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-800">Sobre o App</h3>
                  <p className="text-sm text-gray-500">
                    Versão 1.0.0 - Casa Check
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  alert(error.message || "Falha ao sair");
                  return;
                }
                router.replace("/login");
              }}
              className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
            >
              <div className="flex items-center">
                <Info className="w-5 h-5 mr-3 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-800">Sair</h3>
                  <p className="text-sm text-gray-500">Encerrar sua sessão</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Informações da Versão */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Casa Check v1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">
            © 2025 Casa Check. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>
    </div>
  );
}
