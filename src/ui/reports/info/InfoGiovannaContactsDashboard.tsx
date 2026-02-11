"use client";

import * as React from "react";
import { Badge } from "@/ui/primitives/badge";
import { Input } from "@/ui/primitives/input";
import { Textarea } from "@/ui/primitives/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/primitives/table";

const DEFAULT_MESSAGE =
  "Hola {nombre}, somos el equipo de Somos Peru. Gracias por tu tiempo. Queremos compartirte una breve actualizacion del trabajo en campo.";
const LOADING_ROW_KEYS = [
  "loading-1",
  "loading-2",
  "loading-3",
  "loading-4",
  "loading-5",
  "loading-6",
  "loading-7",
  "loading-8",
];

type ContactRecord = {
  sourceId: string;
  name: string;
  phone: string;
};

type RecordStatus = {
  contacted?: boolean;
  replied?: boolean;
  deleted?: boolean;
  updatedAt?: number;
};

type InfoFeb8ApiRecord = {
  sourceId: string;
  recordedAt: string | null;
  interviewer: string | null;
  candidate: string | null;
  name: string | null;
  phone: string | null;
  east: string | null;
  north: string | null;
  latitude: string | null;
  longitude: string | null;
};

type InfoFeb8ApiStatus = {
  phone: string;
  contacted: boolean;
  replied: boolean;
  deleted: boolean;
  updatedAt: string | null;
};

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

const splitPeruPhone = (phone: string) => {
  const digits = normalizePhone(phone);
  if (digits.length === 11 && digits.startsWith("51")) {
    return { country: "51", local: digits.slice(2), raw: digits };
  }
  if (digits.length === 9) {
    return { country: "51", local: digits, raw: `51${digits}` };
  }
  return { country: "51", local: digits, raw: digits };
};

const formatPhone = (phone: string) => {
  const { local } = splitPeruPhone(phone);
  if (local.length !== 9) return `+51 ${local}`;
  return `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
};

const buildWhatsappUrl = (phone: string, message: string) => {
  const { raw } = splitPeruPhone(phone);
  const text = encodeURIComponent(message.trim());
  return `https://wa.me/${raw}?text=${text}`;
};

const buildWhatsappMessage = (template: string, name: string) => {
  const trimmedName = name.trim();
  const firstName = trimmedName.split(/\s+/).filter(Boolean)[0] ?? "";
  const personalized = template.replaceAll("{nombre}", firstName);
  return personalized.replace(/\s+,/g, ",").replace(/\s{2,}/g, " ").trim();
};

export default function InfoGiovannaContactsDashboard() {
  const headerRef = React.useRef<HTMLElement | null>(null);
  const [records, setRecords] = React.useState<ContactRecord[]>([]);
  const [message, setMessage] = React.useState(DEFAULT_MESSAGE);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusMap, setStatusMap] = React.useState<Record<string, RecordStatus>>({});
  const [savePulse, setSavePulse] = React.useState(false);
  const saveTimerRef = React.useRef<number | null>(null);
  const isMountedRef = React.useRef(true);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "uncontacted" | "contacted" | "replied"
  >("uncontacted");

  const triggerSavePulse = React.useCallback(() => {
    if (typeof window === "undefined") return;
    setSavePulse(true);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => setSavePulse(false), 1800);
  }, []);

  const fetchRecords = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/info/8-febrero/giovanna", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("No se pudo cargar el listado.");
      const payload = (await response.json()) as {
        records?: InfoFeb8ApiRecord[];
        statuses?: InfoFeb8ApiStatus[];
      };
      const parsed = (payload.records ?? [])
        .filter((record) => record.sourceId && record.phone)
        .map((record) => ({
          sourceId: record.sourceId,
          name: record.name ?? "",
          phone: record.phone ?? "",
        }));
      const nextStatusMap = (payload.statuses ?? []).reduce(
        (acc, status) => {
          acc[normalizePhone(status.phone)] = {
            contacted: status.contacted,
            replied: status.replied,
            deleted: status.deleted,
            updatedAt: status.updatedAt ? new Date(status.updatedAt).getTime() : undefined,
          };
          return acc;
        },
        {} as Record<string, RecordStatus>,
      );
      if (!isMountedRef.current) return;
      setRecords(parsed);
      setStatusMap(nextStatusMap);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  const handleRetry = React.useCallback(() => {
    void fetchRecords();
  }, [fetchRecords]);

  React.useEffect(() => {
    fetchRecords();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchRecords]);

  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  React.useLayoutEffect(() => {
    if (!headerRef.current) return;
    const updateHeaderHeight = () => {
      const height = headerRef.current?.getBoundingClientRect().height ?? 0;
      document.documentElement.style.setProperty(
        "--info-giovanna-header",
        `${Math.ceil(height)}px`,
      );
    };
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(headerRef.current);
    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  const statusCounts = React.useMemo(() => {
    let contacted = 0;
    let replied = 0;
    records.forEach((record) => {
      const status = statusMap[normalizePhone(record.phone)] ?? {};
      if (status.contacted) contacted += 1;
      if (status.replied) replied += 1;
    });
    return {
      all: records.length,
      contacted,
      replied,
      uncontacted: Math.max(records.length - contacted, 0),
    };
  }, [records, statusMap]);

  const filteredRecords = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      if (query) {
        const match = [record.name, record.phone, record.label]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(query));
        if (!match) return false;
      }
      const status = statusMap[normalizePhone(record.phone)] ?? {};
      if (statusFilter === "uncontacted") return !status.contacted;
      if (statusFilter === "contacted") return Boolean(status.contacted);
      if (statusFilter === "replied") return Boolean(status.replied);
      return true;
    });
  }, [records, search, statusFilter, statusMap]);

  const setRecordStatus = React.useCallback((phone: string, next: Partial<RecordStatus>) => {
    const key = normalizePhone(phone);
    const previous = statusMap[key] ?? {};
    const optimistic = {
      ...previous,
      ...next,
      updatedAt: Date.now(),
    };
    setStatusMap((current) => ({
      ...current,
      [key]: optimistic,
    }));
    triggerSavePulse();
    const save = async () => {
      try {
        const response = await fetch("/api/info/8-febrero/giovanna/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: key,
            contacted: Boolean(optimistic.contacted),
            replied: Boolean(optimistic.replied),
          }),
        });
        if (!response.ok) throw new Error("No se pudo guardar el estado.");
        const payload = (await response.json()) as {
          phone: string;
          contacted: boolean;
          replied: boolean;
          updatedAt: number;
        };
        setStatusMap((current) => ({
          ...current,
          [normalizePhone(payload.phone)]: {
            contacted: payload.contacted,
            replied: payload.replied,
            updatedAt: payload.updatedAt,
          },
        }));
        triggerSavePulse();
      } catch (err) {
        setStatusMap((current) => ({
          ...current,
          [key]: previous,
        }));
        setError(err instanceof Error ? err.message : "Error inesperado.");
      }
    };
    void save();
  }, [statusMap, triggerSavePulse]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,57,96,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,200,0,0.12),_transparent_55%)] text-foreground">
      <header
        ref={headerRef}
        className="panel-elevated fade-rise border-b border-border/60 px-4 py-6 md:px-6"
      >
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
                Contactos diarios
              </p>
              <h1 className="heading-display text-2xl font-semibold text-foreground md:text-3xl">
                Registros Giovanna
              </h1>
              <p className="text-sm text-muted-foreground">
                Lista persistente para seguimiento de WhatsApp.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="bg-[#FFC800]/20 text-[#7a5b00]">
              {records.length || 0} contactos
            </Badge>
            <Badge
              variant="outline"
              className={`border-border/60 text-xs uppercase tracking-[0.16em] ${
                savePulse ? "border-[#25D366]/60 text-[#1a8d44]" : "text-muted-foreground"
              }`}
            >
              {savePulse ? "Guardado" : "Sincronizado"}
            </Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-6 pt-[calc(var(--info-giovanna-header)+24px)] md:px-6">
        <section className="rounded-3xl border border-border/70 bg-card/80 px-4 py-4 shadow-lg shadow-black/5 backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-[260px] flex-1 flex-wrap items-center gap-3">
              <label
                htmlFor="record-search"
                className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
              >
                Buscar contacto
              </label>
              <Input
                id="record-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre o telefono"
                className="mt-2 h-11 rounded-2xl border-border/60 bg-card/70"
              />
              <div className="flex flex-wrap items-center gap-2">
                {([
                  { id: "uncontacted", label: "No hablados", count: statusCounts.uncontacted },
                  { id: "contacted", label: "Hablados", count: statusCounts.contacted },
                  { id: "replied", label: "Respondieron", count: statusCounts.replied },
                  { id: "all", label: "Todos", count: statusCounts.all },
                ] as const).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    className={`min-h-[36px] rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                      statusFilter === item.id
                        ? "border-[#163960] bg-[#163960]/10 text-[#163960]"
                        : "border-border/60 text-muted-foreground hover:border-[#163960]/50 hover:text-[#163960]"
                    }`}
                  >
                    {item.label} · {item.count}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-border/60 text-foreground">
                {filteredRecords.length} contactos
              </Badge>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="min-h-[36px] rounded-full border border-border/60 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition hover:border-[#163960]/50 hover:text-[#163960]"
                >
                  Limpiar busqueda
                </button>
              )}
            </div>
          </div>
          <details className="mt-4 rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Mensaje predeterminado de WhatsApp
            </summary>
            <div className="mt-3 space-y-2">
              <label htmlFor="whatsapp-message" className="sr-only">
                Mensaje predeterminado
              </label>
              <Textarea
                id="whatsapp-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-[120px] rounded-2xl border-border/60 bg-card/70"
              />
              <p className="text-xs text-muted-foreground">
                Se aplica al abrir WhatsApp desde cualquier fila. Usa {"{nombre}"} para
                insertar el nombre del contacto.
              </p>
            </div>
          </details>
        </section>

        <section className="panel fade-rise rounded-3xl border border-border/70 px-5 py-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="heading-display text-xl font-semibold">Contactos</h2>
              <p className="text-sm text-muted-foreground">
                Boton para hablar y estados: no hablados, hablados, respondidos.
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
            <div className="max-h-[640px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card/90 backdrop-blur">
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Telefono</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    LOADING_ROW_KEYS.map((rowKey) => (
                      <TableRow key={rowKey} className="border-border/60">
                        <TableCell colSpan={3} className="py-6">
                          <div className="h-4 w-full animate-pulse rounded-full bg-muted/50" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-sm text-red-500">
                        <div className="space-y-3">
                          <p>{error}</p>
                          <button
                            type="button"
                            onClick={handleRetry}
                            className="min-h-[36px] rounded-full border border-red-500/40 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-red-500 transition hover:border-red-500"
                          >
                            Reintentar
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-sm">
                        <div className="space-y-3">
                          <p>No hay contactos para mostrar.</p>
                          {(search || statusFilter !== "uncontacted") && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearch("");
                                setStatusFilter("uncontacted");
                              }}
                              className="min-h-[36px] rounded-full border border-border/60 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition hover:border-[#163960]/50 hover:text-[#163960]"
                            >
                              Limpiar busqueda
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record, index) => {
                      const status = statusMap[normalizePhone(record.phone)] ?? {};
                      const contacted = Boolean(status.contacted);
                      const replied = Boolean(status.replied);
                      return (
                        <TableRow
                          key={record.sourceId}
                          className={`border-border/60 ${
                            index % 2 === 0 ? "bg-muted/10" : "bg-transparent"
                          } hover:bg-muted/30`}
                        >
                          <TableCell className="whitespace-normal" title={record.name}>
                            {record.name}
                          </TableCell>
                          <TableCell className="font-medium">
                            <button
                              type="button"
                              className="inline-flex min-h-[40px] items-center rounded-full border border-[#163960]/30 px-3 py-2 text-sm font-semibold text-[#163960] transition hover:border-[#25D366] hover:text-[#1a8d44]"
                              onClick={() => {
                                const personalizedMessage = buildWhatsappMessage(
                                  message,
                                  record.name,
                                );
                                const url = buildWhatsappUrl(record.phone, personalizedMessage);
                                window.open(url, "_blank", "noopener,noreferrer");
                              }}
                              title="Abrir WhatsApp"
                            >
                              <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]/15 text-[10px] font-semibold text-[#1a8d44]">
                                WA
                              </span>
                              {formatPhone(record.phone)}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                className={`min-h-[36px] rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                                  contacted
                                    ? "border-[#FFC800] bg-[#FFC800]/20 text-[#7a5b00]"
                                    : "border-border/60 text-muted-foreground hover:border-[#FFC800]/60 hover:text-[#7a5b00]"
                                }`}
                                onClick={() =>
                                  setRecordStatus(record.phone, { contacted: !contacted })
                                }
                              >
                                Hablado
                              </button>
                              <button
                                type="button"
                                className={`min-h-[36px] rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                                  replied
                                    ? "border-[#25D366] bg-[#25D366]/15 text-[#1a8d44]"
                                    : "border-border/60 text-muted-foreground hover:border-[#25D366]/60 hover:text-[#1a8d44]"
                                }`}
                                onClick={() =>
                                  setRecordStatus(record.phone, {
                                    replied: !replied,
                                    contacted: true,
                                  })
                                }
                              >
                                Respondio
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
