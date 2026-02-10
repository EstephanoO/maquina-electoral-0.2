"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/ui/primitives/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import { useOperators } from "@/habilitaciones/hooks/useOperators";

const REPORT_LINKS = [
  {
    id: "habilitar",
    title: "Habilitar contactos",
    description: "Gestiona el acceso a registros y operadores.",
    href: "/info/habilitar",
  },
  {
    id: "febrero",
    title: "Reporte 8 febrero",
    description: "Resumen especial de entrevistas de campo.",
    href: "/info/8-febrero",
  },
];

export default function InfoDashboard() {
  const { operators, isLoading, error } = useOperators();
  const activeOperators = operators.filter((item) => item.active);
  const orderedOperators = React.useMemo(
    () => [...operators].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [operators],
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,57,96,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,200,0,0.12),_transparent_55%)] text-foreground">
      <header className="panel-elevated fade-rise border-b border-border/60 px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#163960] p-2">
              <img
                src="/isotipo(2).jpg"
                alt="GOBERNA"
                className="h-full w-full rounded-lg object-contain"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Centro INFO
              </p>
              <h1 className="heading-display text-2xl font-semibold text-foreground md:text-3xl">
                Dashboard de reportes
              </h1>
              <p className="text-sm text-muted-foreground">
                Accesos rapidos a operadores y reportes especiales.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="bg-[#163960]/10 text-[#163960]">
              {activeOperators.length} operadoras activas
            </Badge>
            <Badge variant="secondary" className="bg-[#FFC800]/20 text-[#7a5b00]">
              {operators.length} en total
            </Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-10 pt-8 md:px-6">
        <section className="rounded-3xl border border-border/70 bg-card/80 px-5 py-6 shadow-lg shadow-black/5 backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="heading-display text-xl font-semibold">Atajos principales</h2>
              <p className="text-sm text-muted-foreground">
                Secciones clave para habilitar y revisar reportes.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {REPORT_LINKS.map((report) => (
              <Card key={report.id} className="border-border/60 bg-card/70">
                <CardHeader>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={report.href}
                    className="inline-flex min-h-[40px] items-center rounded-full border border-[#163960]/40 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#163960] transition hover:border-[#163960] hover:bg-[#163960]/10"
                  >
                    Abrir reporte
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="panel fade-rise rounded-3xl border border-border/70 px-5 py-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="heading-display text-xl font-semibold">Operadoras</h2>
              <p className="text-sm text-muted-foreground">
                Acceso directo a los registros habilitados por operadora.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-4 text-sm text-muted-foreground">Cargando operadoras...</div>
          ) : error ? (
            <div className="mt-4 text-sm text-red-500">{String(error)}</div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {orderedOperators.map((operator) => (
                <Card key={operator.id} className="border-border/60 bg-card/70">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{operator.name}</CardTitle>
                        <CardDescription>Slug: {operator.slug}</CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          operator.active
                            ? "border-emerald-500/40 text-emerald-600"
                            : "border-border/60 text-muted-foreground"
                        }
                      >
                        {operator.active ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Contactos habilitados
                    </div>
                    <Link
                      href={`/info/${operator.slug}`}
                      className="inline-flex min-h-[40px] items-center rounded-full border border-[#163960]/40 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#163960] transition hover:border-[#163960] hover:bg-[#163960]/10"
                    >
                      Ver registros
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
