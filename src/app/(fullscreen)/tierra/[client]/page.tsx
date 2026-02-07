import Link from "next/link";
import { Button } from "@/ui/primitives/button";
import { MapLivePanel } from "@/ui/maps/MapLivePanel";

type TierraFullscreenPageProps = {
  params: Promise<{ client: string }>;
};

export default async function TierraFullscreenPage({ params }: TierraFullscreenPageProps) {
  const { client } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/console/campaigns/${client}`}>Volver</Link>
        </Button>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            MAQUINA ELECTORAL
          </p>
          <p className="text-sm font-semibold text-foreground">Salida de campo 28 de enero</p>
        </div>
      </header>
      <div className="flex-1">
        <MapLivePanel
          client={client}
          className="h-full rounded-none border-0 shadow-none"
        />
      </div>
    </div>
  );
}
