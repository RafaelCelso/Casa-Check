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
  icons: {
    icon: [
      { url: "/image/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/image/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/image/favicon.ico", sizes: "any" },
    ],
    apple: [
      {
        url: "/image/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Casa Check",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#10b981",
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
