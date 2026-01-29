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
    <Card className="bg-card/70 p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-border/20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Dashboards disponibles
          </p>
          <p className="text-xl font-semibold text-foreground">Catalogo del cliente</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Selecciona una vista para entrar al panel completo.
        </p>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {dashboards.map((dashboard) => (
          <Link
            key={dashboard.id}
            href={dashboard.href}
            className="group relative overflow-hidden rounded-3xl bg-background/80 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.12)] ring-1 ring-border/20 transition hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(15,23,42,0.16)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 transition group-hover:opacity-100" />
            <div
              className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${dashboard.accent}`}
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-foreground/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/70">
                  {dashboard.tag}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                  Disponible
                </span>
              </div>
              <div className="mt-4">
                <p className="text-base font-semibold text-foreground">{dashboard.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{dashboard.subtitle}</p>
              </div>
              <div className="mt-4 rounded-2xl bg-muted/40 p-3 ring-1 ring-border/20">
                <div className="map-grid h-28 w-full rounded-xl" />
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Vista previa</span>
                  <span className="font-semibold text-foreground">Entrar</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
};
