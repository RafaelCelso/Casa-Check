"use client";

import BottomNavigation from "./bottom-navigation";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { usePathname } from "next/navigation";

export default function AuthBottomNavigation() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // Rotas públicas: ocultar navegação sempre
  const PUBLIC_ROUTES = new Set<string>([
    "/",
    "/login",
    "/cadastro",
    "/tipo-conta",
    "/esqueceu-senha",
    "/alterar-senha",
    "/onboarding",
    "/onboarding-2",
  ]);

  const currentPath = pathname || "/";
  if (isLoading || PUBLIC_ROUTES.has(currentPath) || !user) {
    return null;
  }

  return <BottomNavigation />;
}
