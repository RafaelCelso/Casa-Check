"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, X } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "error" | "warning" | "info";
}

export const ErrorModal = ({
  isOpen,
  onClose,
  title = "Erro",
  message,
  type = "error",
}: ErrorModalProps) => {
  const getIconColor = () => {
    switch (type) {
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-red-500";
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "error":
        return "bg-red-500 hover:bg-red-600";
      case "warning":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "info":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-red-500 hover:bg-red-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className={`w-5 h-5 ${getIconColor()}`} />
              {title}
            </DialogTitle>
            {/* Botão X removido: o DialogContent já pode renderizar um botão de fechar quando necessário */}
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className={`${getButtonColor()} text-white`}
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
