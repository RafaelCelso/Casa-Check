"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Send,
  CheckCircle,
  User,
  Calendar,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Prestador {
  id: string;
  nome: string;
  servicos: string;
  telefone: string;
  localizacao: string;
  tiposServico: string;
  servicoRealizado: string;
  dataConclusao: string;
}

export default function AvaliarPage() {
  const routeParams = useParams<{ id: string }>();
  const routeId = Array.isArray(routeParams.id)
    ? routeParams.id[0]
    : routeParams.id;
  // Dados mockados do prestador
  const prestador: Prestador = {
    id: routeId,
    nome: "Mariana Silva",
    servicos: "Serviços Domésticos",
    telefone: "(11) 98765-4321",
    localizacao: "São Paulo, SP",
    tiposServico: "Limpeza, Organização",
    servicoRealizado: "Limpeza Residencial",
    dataConclusao: "15/01/2025",
  };

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Por favor, selecione uma avaliação");
      return;
    }

    setIsSubmitting(true);

    // Simular envio da avaliação
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Salvar avaliação no localStorage
    const avaliacoesSalvas = localStorage.getItem("avaliacoes");
    const avaliacoes = avaliacoesSalvas ? JSON.parse(avaliacoesSalvas) : {};

    avaliacoes[routeId] = {
      rating: rating,
      comentario: comentario,
      data: new Date().toISOString(),
    };

    localStorage.setItem("avaliacoes", JSON.stringify(avaliacoes));

    setIsSubmitting(false);

    // Redirecionar para página de sucesso
    window.location.href = `/avaliar/${routeId}/sucesso`;
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = hoveredRating || rating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          onMouseLeave={handleStarLeave}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 ${
              i <= displayRating
                ? "text-yellow-400 fill-current"
                : "text-gray-300"
            }`}
          />
        </button>
      );
    }
    return stars;
  };

  const getRatingText = () => {
    if (rating === 0) return "Selecione uma avaliação";
    if (rating === 1) return "Muito ruim";
    if (rating === 2) return "Ruim";
    if (rating === 3) return "Regular";
    if (rating === 4) return "Bom";
    if (rating === 5) return "Excelente";
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <Link href="/ajustes" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">
            Avaliar Prestador
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Informações do Serviço */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Serviço Realizado
          </h3>

          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">
                {prestador.servicoRealizado}
              </h4>
              <p className="text-sm text-gray-500">{prestador.nome}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">
                  Concluído em {prestador.dataConclusao}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wrench className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Tipo de Serviço</span>
              </div>
              <span className="text-gray-800 font-medium">
                {prestador.tiposServico}
              </span>
            </div>
          </div>
        </div>

        {/* Avaliação */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Como foi o serviço?
          </h3>

          {/* Estrelas */}
          <div className="flex justify-center mb-4">
            <div className="flex space-x-2">{renderStars()}</div>
          </div>

          {/* Texto da avaliação */}
          <div className="text-center mb-6">
            <p className="text-lg font-medium text-gray-800">
              {getRatingText()}
            </p>
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Comentário (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte como foi sua experiência com o serviço..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={4}
            />
            <p className="text-xs text-gray-500">
              {comentario.length}/500 caracteres
            </p>
          </div>
        </div>

        {/* Botão de Envio */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Enviar Avaliação</span>
            </>
          )}
        </button>

        {/* Dicas */}
        <div className="bg-blue-50 border-l-4 border-blue-300 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">
            Dicas para uma boa avaliação:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Seja específico sobre o que gostou ou não gostou</li>
            <li>• Mencione pontos como pontualidade, qualidade e limpeza</li>
            <li>• Sua avaliação ajuda outros usuários a escolherem</li>
          </ul>
        </div>
      </div>

      {/* Padding bottom para compensar a navegação fixa */}
      <div className="h-20"></div>
    </div>
  );
}
