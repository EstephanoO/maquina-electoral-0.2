import Link from "next/link";
import { Card } from "@/components/ui/card";

const dashboardsByClient: Record<
  string,
  Array<{
    id: string;
    title: string;
    href: string;
    subtitle: string;
    tag: string;
    accent: string;
  }>
> = {
  rocio: [
    {
      id: "event-rocio-01",
      title: "Dashboard Tierra: Recolecion de datos",
      subtitle: "Operaciones y territorio en vivo",
      tag: "Tierra",
      accent: "from-emerald-400/30 via-sky-300/20 to-transparent",
      href: "/dashboard/rocio/tierra/event-rocio-01",
    },
  ],
  giovanna: [
    {
      id: "event-giovanna-01",
      title: "Dashboard Tierra: Recolecion de datos",
      subtitle: "Operaciones y territorio en vivo",
      tag: "Tierra",
      accent: "from-emerald-400/30 via-sky-300/20 to-transparent",
      href: "/dashboard/giovanna/tierra/event-giovanna-01",
    },
  ],
  guillermo: [
    {
      id: "event-guillermo-01",
      title: "Dashboard Tierra: Recolecion de datos",
      subtitle: "Operaciones y territorio en vivo",
      tag: "Tierra",
      accent: "from-emerald-400/30 via-sky-300/20 to-transparent",
      href: "/dashboard/guillermo/tierra/event-guillermo-01",
    },
    {
      id: "guillermo-analytics",
      title: "Dashboard Analytics",
      subtitle: "Panorama digital y conversion",
      tag: "Analytics",
      accent: "from-indigo-400/25 via-amber-300/20 to-transparent",
      href: "/dashboard/guillermo/analytics",
    },
  ],
};

type DashboardCatalogProps = {
  client?: string;
};

export const DashboardCatalog = ({ client }: DashboardCatalogProps) => {
  const dashboards = dashboardsByClient[client ?? "rocio"] ?? [];
  return (
    <Card className="relative overflow-hidden bg-card/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-border/20 sm:p-7">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -right-16 top-12 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/50 to-transparent" />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-muted-foreground">
            Dashboards disponibles
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Catalogo del cliente</p>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Selecciona una vista para entrar al panel completo.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          <span className="rounded-full border border-border/40 bg-background/70 px-3 py-1">{client ?? "rocio"}</span>
          <span className="rounded-full border border-border/40 bg-background/70 px-3 py-1">
            {dashboards.length} vistas
          </span>
        </div>
      </div>

      <div className="relative mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboards.map((dashboard) => (
          <Link
            key={dashboard.id}
            href={dashboard.href}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-background/80 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.12)] ring-1 ring-border/20 transition hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(15,23,42,0.16)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 transition duration-300 group-hover:opacity-100" />
            <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${dashboard.accent}`} />
            <div className="relative flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-foreground/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/70">
                  {dashboard.tag}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                  Disponible
                </span>
              </div>
              <div className="mt-4">
                <p className="text-base font-semibold text-foreground sm:text-lg">{dashboard.title}</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{dashboard.subtitle}</p>
              </div>
              <div className="mt-4 flex-1 rounded-2xl bg-muted/40 p-3 ring-1 ring-border/20">
                <div className="map-grid h-28 w-full rounded-xl sm:h-32" />
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Vista previa</span>
                  <span className="font-semibold text-foreground">Entrar</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Ultima actualizacion</span>
                <span className="font-semibold text-foreground">Hoy</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
};
