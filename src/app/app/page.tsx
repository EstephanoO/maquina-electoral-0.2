"use client";

import Link from "next/link";
import { Button } from "@/ui/primitives/button";
import { useAppStore } from "@/stores/app.store";

export default function AppDownloadPage() {
  const downloadUrl = useAppStore((state) => state.downloadUrl);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(34,197,94,0.12),_transparent_55%)]" />
      <div className="relative flex w-full max-w-xl flex-col items-center gap-6 px-6 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          GOBERNA TERRITORIO
        </p>
        <h1 className="text-3xl font-semibold text-foreground [font-family:var(--font-display)]">
          Descarga la app de campo
        </h1>
        <p className="text-sm text-muted-foreground">
          Acceso directo a la captura territorial. Instalacion rapida y segura.
        </p>
        <Button size="lg" className="button-glow" asChild>
          <Link href={downloadUrl}>Descargar app</Link>
        </Button>
      </div>
    </main>
  );
}
