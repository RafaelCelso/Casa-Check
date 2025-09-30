"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./supabase-auth-provider";

// Rotas públicas que não exigem autenticação
const PUBLIC_ROUTES = new Set<string>([
  "/",
  "/login",
  "/cadastro",
  "/tipo-conta",
  "/onboarding",
  "/onboarding-2",
  "/esqueceu-senha",
  "/alterar-senha",
]);

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_ROUTES.has(pathname || "/");
    if (!user && !isPublic) {
      router.replace("/login");
    }
  }, [user, isLoading, pathname, router]);

  return <>{children}</>;
};
