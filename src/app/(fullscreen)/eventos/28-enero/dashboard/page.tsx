"use client";

import * as React from "react";
import { MapPanel } from "@/modules/maps/MapPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MapPoint = {
  latitude: number | null;
  longitude: number | null;
  candidate?: string | null;
  name?: string | null;
  phone?: string | null;
  createdAt?: string | null;
};

const candidateLabels = ["Rocio Porras", "Giovanna Castagnino", "Guillermo Aliaga"];

export default function EventMapDashboardPage() {
  const [points, setPoints] = React.useState<Array<{ lat: number; lng: number }>>([]);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [rows, setRows] = React.useState<MapPoint[]>([]);
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  React.useEffect(() => {
    let isMounted = true;

    const loadPoints = async () => {
      const response = await fetch("/api/interviews", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { points: MapPoint[] };
      const nextPoints = (data.points ?? [])
        .filter((point) => point.latitude !== null && point.longitude !== null)
        .map((point) => ({
          lat: point.latitude as number,
          lng: point.longitude as number,
        }));
      const nextCounts = (data.points ?? []).reduce<Record<string, number>>((acc, point) => {
        const key = point.candidate ?? "Sin candidato";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

      if (isMounted) {
        setPoints(nextPoints);
        setCounts(nextCounts);
        setRows(data.points ?? []);
      }
    };

    loadPoints();
    const timer = window.setInterval(loadPoints, 8000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const filteredRows = rows.filter((row) => {
    if (activeFilter && row.candidate !== activeFilter) return false;
    if (!search.trim()) return true;
    const query = search.trim().toLowerCase();
    return (
      row.candidate?.toLowerCase().includes(query) ||
      row.name?.toLowerCase().includes(query) ||
      row.phone?.toLowerCase().includes(query)
    );
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = sortedRows.slice(pageStart, pageStart + pageSize);

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };


  return (
    <div className="h-screen w-screen bg-[#f5f6f8] text-foreground">
      <div className="grid h-full grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-full p-4">
          <div className="h-full rounded-2xl border border-border/60 bg-card/70 p-0 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
            <MapPanel height={null} className="h-full w-full rounded-2xl" points={points} />
          </div>
        </div>
        <aside className="h-full border-l border-border/60 bg-white/90 p-4">
          <div className="space-y-4">
            <Card className="border-border/60 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Evento
              </p>
              <h1 className="mt-2 text-lg font-semibold text-foreground">
                Salida de campo 28 de enero
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">Actualizacion en tiempo real</p>
            </Card>

            <Card className="border-border/60 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contactos obtenidos
                </p>
                <span className="text-xs font-semibold text-muted-foreground">Total</span>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-3xl font-semibold text-foreground">{total}</p>
                <Dialog
                  onOpenChange={(open) => {
                    setActiveFilter(open ? null : activeFilter);
                    if (open) {
                      setSearch("");
                      setPage(1);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      Ver mas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Registros en campo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-[220px]">
                          <label
                            htmlFor="records-search"
                            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            Buscar
                          </label>
                          <Input
                            id="records-search"
                            value={search}
                            onChange={(event) => {
                              setSearch(event.target.value);
                              setPage(1);
                            }}
                            placeholder="Nombre, telefono o candidato"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{sortedRows.length} registros</span>
                          {activeFilter ? (
                            <span className="rounded-full border border-border/60 px-2 py-1 text-[0.65rem] uppercase tracking-wide">
                              {activeFilter}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border/60">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white/95 backdrop-blur">
                          <TableRow>
                            <TableHead>Candidato</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Telefono</TableHead>
                            <TableHead>Fecha</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                                Sin registros para este filtro.
                              </TableCell>
                            </TableRow>
                          ) : (
                            pageRows.map((row, index) => (
                              <TableRow key={`${row.candidate}-${row.name}-${index}`}>
                                <TableCell className="text-sm font-medium text-foreground">
                                  {row.candidate ?? "-"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {row.name ?? "-"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {row.phone ?? "-"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatDate(row.createdAt)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
                        <span>
                          Mostrando {sortedRows.length === 0 ? 0 : pageStart + 1}-
                          {Math.min(pageStart + pageSize, sortedRows.length)} de {sortedRows.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={currentPage <= 1}
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          >
                            Anterior
                          </Button>
                          <span>
                            {currentPage} / {totalPages}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={currentPage >= totalPages}
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <div className="space-y-3">
              {candidateLabels.map((candidate) => (
                <Card key={candidate} className="border-border/60 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{candidate}</p>
                    <span className="text-sm font-semibold text-foreground">
                      {counts[candidate] ?? 0}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Registros en campo</p>
                    <Dialog
                      onOpenChange={(open) => {
                        setActiveFilter(open ? candidate : activeFilter);
                        if (open) {
                          setSearch("");
                          setPage(1);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          Ver mas
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Registros en campo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-[220px]">
                              <label
                                htmlFor={`records-search-${candidate}`}
                                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                              >
                                Buscar
                              </label>
                              <Input
                                id={`records-search-${candidate}`}
                                value={search}
                                onChange={(event) => {
                                  setSearch(event.target.value);
                                  setPage(1);
                                }}
                                placeholder="Nombre, telefono o candidato"
                              />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{sortedRows.length} registros</span>
                              <span className="rounded-full border border-border/60 px-2 py-1 text-[0.65rem] uppercase tracking-wide">
                                {candidate}
                              </span>
                            </div>
                          </div>
                          <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border/60">
                          <Table>
                            <TableHeader className="sticky top-0 bg-white/95 backdrop-blur">
                              <TableRow>
                                <TableHead>Candidato</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Telefono</TableHead>
                                <TableHead>Fecha</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedRows.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                                    Sin registros para este filtro.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                pageRows.map((row, index) => (
                                  <TableRow key={`${row.candidate}-${row.name}-${index}`}>
                                    <TableCell className="text-sm font-medium text-foreground">
                                      {row.candidate ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {row.name ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {row.phone ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {formatDate(row.createdAt)}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                          <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
                            <span>
                              Mostrando {sortedRows.length === 0 ? 0 : pageStart + 1}-
                              {Math.min(pageStart + pageSize, sortedRows.length)} de {sortedRows.length}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={currentPage <= 1}
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                              >
                                Anterior
                              </Button>
                              <span>
                                {currentPage} / {totalPages}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={currentPage >= totalPages}
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                        </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
