"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";
import Image from "next/image";
import { usePWA } from "@/hooks/use-pwa";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallModal = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Registrar service worker
  usePWA();

  useEffect(() => {
    // Verificar se o app já está instalado
    const isInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // Verificar se já foi mostrado antes (localStorage)
    const hasShownBefore = localStorage.getItem("pwa-install-shown");

    // Verificar se é iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (!isInstalled && !hasShownBefore) {
      // Aguardar um pouco antes de mostrar o modal
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      // Mostrar o prompt de instalação
      await deferredPrompt.prompt();

      // Aguardar a escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("Usuário aceitou a instalação");
      } else {
        console.log("Usuário rejeitou a instalação");
      }

      // Limpar o prompt
      setDeferredPrompt(null);
      setShowModal(false);

      // Marcar como mostrado
      localStorage.setItem("pwa-install-shown", "true");
    } catch (error) {
      console.error("Erro ao instalar PWA:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
    localStorage.setItem("pwa-install-shown", "true");
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal com animação de entrada */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform transition-all duration-500 ease-out animate-slide-down"
        style={{
          animation: "slideDown 0.5s ease-out forwards",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-xl">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Instalar App
              </h3>
              <p className="text-sm text-gray-500">Casa Check</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-white p-3 rounded-xl shadow-sm border">
              <Image
                src="/image/Casa Check logo.webp"
                alt="Casa Check Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                Instale o Casa Check
              </h4>
              <p className="text-sm text-gray-600">
                Acesso rápido e experiência otimizada
              </p>
            </div>
          </div>

          {/* Instruções para iOS */}
          {isIOS && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <h5 className="font-medium text-blue-900 mb-2">
                Como instalar no iPhone/iPad:
              </h5>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start space-x-2">
                  <span className="font-semibold">1.</span>
                  <span>Toque no botão de compartilhar</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-semibold">2.</span>
                  <span>Selecione "Adicionar à Tela de Início"</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-semibold">3.</span>
                  <span>Toque em "Adicionar"</span>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="space-y-3">
            {!isIOS ? (
              <Button
                onClick={handleInstall}
                disabled={isInstalling || !deferredPrompt}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>{isInstalling ? "Instalando..." : "Instalar App"}</span>
              </Button>
            ) : (
              <div className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 opacity-75">
                <Download className="w-5 h-5" />
                <span>Use o botão de compartilhar acima</span>
              </div>
            )}

            <Button
              onClick={handleDismiss}
              variant="outline"
              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl"
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
