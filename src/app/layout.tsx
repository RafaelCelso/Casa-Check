import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthBottomNavigation from "@/components/layout/auth-bottom-navigation";
import { SupabaseAuthProvider } from "@/components/auth/supabase-auth-provider";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ModalProvider } from "@/contexts/modal-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Casa Check - Gerenciador de Tarefas Domésticas",
  description:
    "Aplicativo PWA para coordenação e acompanhamento de tarefas domésticas",
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <SupabaseAuthProvider>
          <ModalProvider>
            <AuthGuard>{children}</AuthGuard>
            <AuthBottomNavigation />
          </ModalProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
