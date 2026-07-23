import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import PinScreen from "@/components/PinScreen";

export const metadata: Metadata = {
  title: "Dhaniar Finance - Manajemen Keuangan Keluarga",
  description:
    "Aplikasi Manajemen Keuangan, Portofolio & Perencanaan Finansial Keluarga Dhaniar",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dhaniar Finance",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="icon" href="/icon-512.png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <meta name="application-name" content="Dhaniar Finance" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <PinScreen />
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}