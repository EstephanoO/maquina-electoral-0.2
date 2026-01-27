import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPanel } from "@/modules/maps/MapPanel";

const candidates = [
  { id: "cand-rocio", name: "Rocio Porras", slug: "rocio", tone: "border-emerald-400" },
  { id: "cand-giovanna", name: "Giovanna", slug: "giovanna", tone: "border-sky-400" },
  { id: "cand-guillermo", name: "Guillermo", slug: "guillermo", tone: "border-amber-400" },
];

export default function EventOverviewPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/console">Volver</Link>
        </Button>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            EVENTO
          </p>
          <p className="text-sm font-semibold text-foreground">Salida de campo 28 de enero</p>
        </div>
      </header>
      <div className="flex-1 px-6 py-6">
        <div className="grid h-full gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-[420px]">
            <MapPanel height={null} className="h-full rounded-2xl" />
          </div>
          <aside className="space-y-4">
            <Card className="panel fade-rise card-hover p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resumen general
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Cobertura conjunta de los tres candidatos en la salida de campo.
              </p>
              <Button className="mt-4 w-full" asChild>
                <Link href="/eventos/28-enero/dashboard">Ver mapa full screen</Link>
              </Button>
            </Card>
            {candidates.map((candidate) => (
              <Card
                key={candidate.id}
                className={`panel fade-rise card-hover border-l-4 p-5 ${candidate.tone}`}
              >
                <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Dashboard tierra listo</p>
                <Button className="mt-4 w-full" asChild>
                  <Link href={`/dashboard/${candidate.slug}/tierra`}>Entrar</Link>
                </Button>
              </Card>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
