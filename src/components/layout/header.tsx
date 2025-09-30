"use client";

import { Button } from "@/components/ui/button";
import { Home, Menu, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function Header() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setAvatarUrl(null);
        return;
      }
      const { data } = await supabase
        .from("user")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      setAvatarUrl(data?.avatar_url || null);
    };
    load();
  }, [user?.id]);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Home className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Casa Check</h1>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/listas" className="text-gray-600 hover:text-gray-900">
              Minhas Listas
            </Link>
            <Link href="/perfil" className="text-gray-600 hover:text-gray-900">
              Perfil
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <Link href={user ? "/perfil" : "/login"}>
              <Button size="sm" className="flex items-center">
                {user ? (
                  avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full mr-2 object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center mr-2 text-xs font-semibold">
                      {user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  )
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                {user ? "Perfil" : "Entrar"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
