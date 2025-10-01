"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Search,
  Filter,
  Star,
  MapPin,
  User,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { serviceProvidersService } from "@/lib/service-providers";
import { generateSlug } from "@/lib/slug";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { CategoryTags } from "@/components/ui/category-tags";

interface Prestador {
  id: string;
  nome: string;
  servicos: string;
  localizacao: string;
  avaliacao: number;
  totalAvaliacoes: number;
  foto: string;
  service_types: string[];
}

export default function BuscarPage() {
  const { user } = useAuth();
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [prestadoresFiltrados, setPrestadoresFiltrados] = useState<Prestador[]>(
    []
  );
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar prestadores do banco de dados
  useEffect(() => {
    const loadPrestadores = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const prestadoresData =
          await serviceProvidersService.getServiceProviders();

        // Converter dados do banco para formato da interface
        const prestadoresFormatados: Prestador[] = prestadoresData.map(
          (provider) => ({
            id: provider.id,
            nome: provider.name || "Nome não informado",
            servicos: Array.isArray(provider.service_types)
              ? provider.service_types.join(", ")
              : provider.service_types || "Serviços domésticos",
            localizacao: provider.location || "Localização não informada",
            avaliacao: provider.rating || 0,
            totalAvaliacoes: 0, // Campo não existe no banco ainda
            foto: provider.avatar_url || "/api/placeholder/60/60",
            service_types: Array.isArray(provider.service_types)
              ? provider.service_types
              : provider.service_types
              ? [provider.service_types]
              : [],
          })
        );

        setPrestadores(prestadoresFormatados);
        setPrestadoresFiltrados(prestadoresFormatados);
      } catch (error) {
        console.error("Erro ao carregar prestadores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrestadores();
  }, [user?.id]);

  // Filtrar prestadores baseado no termo de busca e categoria
  useEffect(() => {
    let filtrados = prestadores;

    // Filtro por termo de busca
    if (termoBusca.trim() !== "") {
      filtrados = filtrados.filter(
        (prestador) =>
          prestador.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
          prestador.servicos.toLowerCase().includes(termoBusca.toLowerCase())
      );
    }

    // Filtro por categoria
    if (filtroCategoria) {
      filtrados = filtrados.filter((prestador) =>
        prestador.servicos.toLowerCase().includes(filtroCategoria.toLowerCase())
      );
    }

    setPrestadoresFiltrados(filtrados);
  }, [prestadores, termoBusca, filtroCategoria]);

  const handleFiltroCategoria = (categoria: string | null) => {
    setFiltroCategoria(categoria);
  };

  const handleCompartilharWhatsApp = () => {
    const appUrl = "https://casa-check.vercel.app";
    const message = `Olá! Descobri um app incrível para gerenciar serviços domésticos: Casa Check! 🏠✨

Você pode criar listas de tarefas, acompanhar o progresso e colaborar facilmente. É perfeito para quem trabalha com limpeza e organização!

Baixe o app: ${appUrl}

Que tal conhecer? 😊`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center shadow-sm">
        <Link href="/inicio" className="mr-4">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Buscar Prestadores</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Nome do prestador ou serviço..."
            className="pl-10 py-3 text-base bg-white border-gray-200 rounded-xl"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-3 overflow-x-auto pb-2">
          <Button
            variant="outline"
            className={`flex items-center space-x-2 rounded-full px-4 py-2 whitespace-nowrap ${
              filtroCategoria === null
                ? "bg-green-100 border-green-300 text-green-700"
                : "bg-white border-gray-200 text-gray-600"
            }`}
            onClick={() => handleFiltroCategoria(null)}
          >
            <Filter className="w-4 h-4" />
            <span>Todos</span>
          </Button>

          <Button
            variant="outline"
            className={`rounded-full px-4 py-2 whitespace-nowrap ${
              filtroCategoria === "limpeza"
                ? "bg-green-100 border-green-300 text-green-700"
                : "bg-white border-gray-200 text-gray-600"
            }`}
            onClick={() => handleFiltroCategoria("limpeza")}
          >
            Limpeza
          </Button>

          <Button
            variant="outline"
            className={`rounded-full px-4 py-2 whitespace-nowrap ${
              filtroCategoria === "jardinagem"
                ? "bg-green-100 border-green-300 text-green-700"
                : "bg-white border-gray-200 text-gray-600"
            }`}
            onClick={() => handleFiltroCategoria("jardinagem")}
          >
            Jardinagem
          </Button>

          <Button
            variant="outline"
            className={`rounded-full px-4 py-2 whitespace-nowrap ${
              filtroCategoria === "manutenção"
                ? "bg-green-100 border-green-300 text-green-700"
                : "bg-white border-gray-200 text-gray-600"
            }`}
            onClick={() => handleFiltroCategoria("manutenção")}
          >
            Manutenção
          </Button>

          <Button
            variant="outline"
            className={`rounded-full px-4 py-2 whitespace-nowrap ${
              filtroCategoria === "organização"
                ? "bg-green-100 border-green-300 text-green-700"
                : "bg-white border-gray-200 text-gray-600"
            }`}
            onClick={() => handleFiltroCategoria("organização")}
          >
            Organização
          </Button>
        </div>

        {/* Results */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Resultados ({prestadoresFiltrados.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">
                Carregando prestadores...
              </span>
            </div>
          ) : prestadoresFiltrados.length > 0 ? (
            <div className="space-y-4">
              {prestadoresFiltrados.map((prestador) => (
                <Link
                  key={prestador.id}
                  href={`/prestador/${generateSlug(prestador.nome)}`}
                >
                  <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                        {prestador.foto &&
                        prestador.foto !== "/api/placeholder/60/60" ? (
                          <img
                            src={prestador.foto}
                            alt={prestador.nome}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-medium text-white">
                            {prestador.nome
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {prestador.nome}
                        </h3>

                        {/* Categorias como tags */}
                        <div className="mb-2">
                          <CategoryTags
                            categories={prestador.service_types}
                            maxVisible={3}
                            className="mb-1"
                          />
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-medium text-gray-800">
                              {prestador.avaliacao > 0
                                ? prestador.avaliacao.toFixed(1)
                                : "N/A"}
                            </span>
                            <span>
                              • {prestador.totalAvaliacoes} avaliações
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 mt-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{prestador.localizacao}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-sm border border-gray-100">
              <div className="mx-auto mb-4 sm:mb-6">
                <Image
                  src="/image/nenhum resultado.webp"
                  alt="Nenhum resultado encontrado"
                  width={512}
                  height={320}
                  className="mx-auto w-full max-w-md h-auto object-contain"
                  priority
                />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2 sm:mb-3">
                {prestadores.length === 0
                  ? "Nenhum prestador cadastrado"
                  : "Nenhum prestador encontrado"}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 font-medium mb-6">
                {prestadores.length === 0
                  ? "Ainda não há prestadores de serviço disponíveis"
                  : "Tente ajustar os termos da sua busca ou filtros"}
              </p>

              {/* Botão de compartilhar via WhatsApp */}
              <div className="space-y-4">
                <p className="text-sm text-gray-600 font-medium">
                  Conhece algum prestador que gostaria de usar o app?
                </p>
                <button
                  onClick={handleCompartilharWhatsApp}
                  className="inline-flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Compartilhar via WhatsApp
                </button>
                <p className="text-xs text-gray-400">
                  Convide prestadores para se cadastrarem no app
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>
    </div>
  );
}
