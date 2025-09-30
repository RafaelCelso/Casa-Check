"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskCategory, TaskPriority } from "@/types";
import { TASK_CATEGORIES } from "@/lib/constants";
import { Plus } from "lucide-react";

interface AddTaskDialogProps {
  onAddTask: (task: {
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
  }) => void;
}

export function AddTaskDialog({ onAddTask }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("limpeza-geral");
  const [priority, setPriority] = useState<TaskPriority>("media");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setCategory("limpeza-geral");
    setPriority("media");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
          <DialogDescription>
            Crie uma nova tarefa para sua lista doméstica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Tarefa</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Limpar banheiro principal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre como executar a tarefa..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TASK_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as TaskCategory)}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    category === key
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prioridade</Label>
            <div className="flex space-x-2">
              {(["baixa", "media", "alta"] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    priority === p
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Adicionar Tarefa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
