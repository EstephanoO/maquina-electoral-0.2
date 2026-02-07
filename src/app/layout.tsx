import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeScript } from "@/theme/ThemeScript";
import { Providers } from "@/app/providers";
import { Toaster } from "@/ui/primitives/sonner";

const montserrat = localFont({
  variable: "--font-montserrat",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/Montserrat/Montserrat-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "MAQUINA-ELECTORAL · GOBERNA",
  description: "War room y dashboards politicos para campanas modernas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${montserrat.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
