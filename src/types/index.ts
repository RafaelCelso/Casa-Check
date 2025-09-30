export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  location?: string;
  service_types?: string[];
  rating?: number;
  tipo?: string; // 'contratante' ou 'prestador'
  created_at: string;
  updated_at: string;
}

export interface TaskList {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  is_favorite: boolean;
  category?: string;
  service_provider_id?: string;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
  collaborators?: User[];
  service_provider?: User;
}

export interface Task {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  completed_at?: string;
  completed_by?: string;
  order_index?: number;
  images?: string[];
  created_at: string;
  updated_at: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Rating {
  id: string;
  rater_id: string;
  rated_user_id: string;
  task_list_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export type TaskCategory =
  | "limpeza-geral"
  | "cozinha"
  | "banheiro"
  | "quartos"
  | "area-externa"
  | "organizacao"
  | "manutencao"
  | "personalizada";

export type TaskPriority = "baixa" | "media" | "alta";

export type TaskStatus = "pendente" | "em-andamento" | "concluida";

export interface ListInvitation {
  id: string;
  list_id: string;
  inviter_id: string;
  invitee_id: string;
  status: "pending" | "accepted" | "declined" | "expired";
  message?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  list?: TaskList;
  inviter?: User;
  invitee?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type:
    | "invitation"
    | "task_assigned"
    | "task_completed"
    | "task_updated"
    | "list_shared";
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  related_id?: string;
  related_type?: string;
}
