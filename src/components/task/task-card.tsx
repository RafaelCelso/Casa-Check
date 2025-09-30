"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@/types";
import {
  TASK_CATEGORIES,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from "@/lib/constants";
import { Play, MessageCircle, Camera } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onPlayAudio?: (task: Task) => void;
  onAddComment?: (task: Task) => void;
  onAddPhoto?: (task: Task) => void;
}

export function TaskCard({
  task,
  onPlayAudio,
  onAddComment,
  onAddPhoto,
}: TaskCardProps) {
  const category = TASK_CATEGORIES[task.category];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{category.label}</p>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <Badge className={PRIORITY_COLORS[task.priority]}>
              {task.priority}
            </Badge>
            <Badge className={STATUS_COLORS[task.status]}>{task.status}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {task.description && (
          <p className="text-gray-700 mb-4">{task.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPlayAudio?.(task)}
              className="flex items-center space-x-1"
            >
              <Play className="h-4 w-4" />
              <span>Ouvir</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddComment?.(task)}
              className="flex items-center space-x-1"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{task.comments?.length || 0}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddPhoto?.(task)}
              className="flex items-center space-x-1"
            >
              <Camera className="h-4 w-4" />
              <span>{task.images?.length || 0}</span>
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            {new Date(task.created_at).toLocaleDateString("pt-BR")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
