"use client";

import * as React from "react";
import Image from "next/image";
import { Badge } from "@/ui/primitives/badge";
import { Input } from "@/ui/primitives/input";
import { Textarea } from "@/ui/primitives/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/primitives/dialog";
import { applyTheme } from "@/theme/theme";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/ui/primitives/table";
import type { InfoFeb8OperatorConfig } from "@/ui/reports/info/infoOperatorConfigs";

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
];
const TABLE_COLUMN_COUNT = 5;

type InterviewRecord = {
  sourceId: string;
  interviewer: string;
  candidate: string;
  name: string;
  phone: string;
  homeMapsUrl?: string | null;
  pollingPlaceUrl?: string | null;
  east?: string;
  north?: string;
  lat?: string;
  lng?: string;
  timestamp: string;
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
  homeMapsUrl: string | null;
  pollingPlaceUrl: string | null;
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

const getValidUrl = (value: string) => {
  if (!value.trim()) return null;
  try {
    return new URL(value.trim()).toString();
  } catch {
    return null;
  }
};

const getLinkCount = (record: InterviewRecord) =>
  [record.homeMapsUrl, record.pollingPlaceUrl].filter(Boolean).length;

const formatDateTime = (timestamp: string) => {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return timestamp;
  return new Intl.DateTimeFormat("es-PE", {
    timeStyle: "short",
  }).format(value);
};

type InfoFeb8OperatorDashboardProps = {
  config: InfoFeb8OperatorConfig;
};

type LinkDraft = {
  homeMapsUrl: string;
  pollingPlaceUrl: string;
};

export default function InfoFeb8OperatorDashboard({
  config,
}: InfoFeb8OperatorDashboardProps) {
  const headerRef = React.useRef<HTMLElement | null>(null);
  const previousThemeRef = React.useRef<"light" | "dark" | null>(null);
  const [records, setRecords] = React.useState<InterviewRecord[]>([]);
  const [message, setMessage] = React.useState(DEFAULT_MESSAGE);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusMap, setStatusMap] = React.useState<Record<string, RecordStatus>>({});
  const [savePulse, setSavePulse] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [linksOpen, setLinksOpen] = React.useState(false);
  const [linksDraft, setLinksDraft] = React.useState<LinkDraft>({
    homeMapsUrl: "",
    pollingPlaceUrl: "",
  });
  const [linksErrors, setLinksErrors] = React.useState<Partial<LinkDraft>>({});
  const [activeRecord, setActiveRecord] = React.useState<InterviewRecord | null>(null);
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

  const fetchRecords = React.useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const response = await fetch(config.apiBasePath, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("No se pudo cargar los registros.");
        const payload = (await response.json()) as {
          records?: InfoFeb8ApiRecord[];
          statuses?: InfoFeb8ApiStatus[];
        };
        const parsed = (payload.records ?? [])
          .filter((record) => record.sourceId && record.phone)
          .map((record) => ({
            sourceId: record.sourceId,
            timestamp: record.recordedAt ?? "",
          interviewer: record.interviewer ?? "",
          candidate: record.candidate ?? "",
          name: record.name ?? "",
          phone: record.phone ?? "",
          homeMapsUrl: record.homeMapsUrl ?? null,
          pollingPlaceUrl: record.pollingPlaceUrl ?? null,
          east: record.east ?? "",
          north: record.north ?? "",
          lat: record.latitude !== null ? String(record.latitude) : "",
          lng: record.longitude !== null ? String(record.longitude) : "",
        }))
          .filter((record) => record.timestamp && record.interviewer && record.phone);
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
        if (!silent && isMountedRef.current) setLoading(false);
      }
    },
    [config.apiBasePath],
  );

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
    if (typeof window === "undefined") return undefined;
    const interval = window.setInterval(() => {
      void fetchRecords({ silent: true });
    }, 2000);
    return () => window.clearInterval(interval);
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
        "--info-feb-header",
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

  React.useLayoutEffect(() => {
    if (typeof document === "undefined") return undefined;
    const isDark = document.documentElement.classList.contains("dark");
    previousThemeRef.current = isDark ? "dark" : "light";
    applyTheme("light");
    return () => {
      if (previousThemeRef.current) {
        applyTheme(previousThemeRef.current);
      }
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
        const match = [record.interviewer, record.candidate, record.name, record.phone]
          .filter(Boolean)
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

  const setRecordStatus = React.useCallback(
    async (phone: string, next: Partial<RecordStatus>) => {
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
      try {
        const response = await fetch(`${config.apiBasePath}/status`, {
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
    },
    [config.apiBasePath, statusMap, triggerSavePulse],
  );

  const handleDelete = React.useCallback(
    async (record: InterviewRecord) => {
      if (!record.sourceId) return;
      const confirmed = window.confirm(
        `Eliminar definitivamente a ${record.name || "este registro"}?`,
      );
      if (!confirmed) return;
      setDeletingId(record.sourceId);
      try {
        const response = await fetch(
          `${config.apiBasePath}?id=${encodeURIComponent(record.sourceId)}`,
          { method: "DELETE" },
        );
        if (!response.ok) throw new Error("No se pudo eliminar el registro.");
        setRecords((current) => current.filter((item) => item.sourceId !== record.sourceId));
        setStatusMap((current) => {
          const key = normalizePhone(record.phone);
          if (!current[key]) return current;
          const next = { ...current };
          delete next[key];
          return next;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setDeletingId((current) => (current === record.sourceId ? null : current));
      }
    },
    [config.apiBasePath],
  );

  const openLinksModal = React.useCallback((record: InterviewRecord) => {
    setActiveRecord(record);
    setLinksDraft({
      homeMapsUrl: record.homeMapsUrl ?? "",
      pollingPlaceUrl: record.pollingPlaceUrl ?? "",
    });
    setLinksErrors({});
    setLinksOpen(true);
  }, []);

  const closeLinksModal = React.useCallback(() => {
    setLinksOpen(false);
    setActiveRecord(null);
    setLinksErrors({});
  }, []);

  const saveLinks = React.useCallback(async () => {
    if (!activeRecord) return;
    const nextHome = linksDraft.homeMapsUrl.trim();
    const nextPolling = linksDraft.pollingPlaceUrl.trim();
    const errors: Partial<LinkDraft> = {};
    if (nextHome && !getValidUrl(nextHome)) {
      errors.homeMapsUrl = "URL invalida";
    }
    if (nextPolling && !getValidUrl(nextPolling)) {
      errors.pollingPlaceUrl = "URL invalida";
    }
    if (Object.keys(errors).length > 0) {
      setLinksErrors(errors);
      return;
    }

    const previous = activeRecord;
    const updated = {
      ...activeRecord,
      homeMapsUrl: nextHome || null,
      pollingPlaceUrl: nextPolling || null,
    };
    setRecords((current) =>
      current.map((item) => (item.sourceId === activeRecord.sourceId ? updated : item)),
    );
    triggerSavePulse();
    try {
      const response = await fetch(`${config.apiBasePath}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: activeRecord.sourceId,
          homeMapsUrl: updated.homeMapsUrl,
          pollingPlaceUrl: updated.pollingPlaceUrl,
        }),
      });
      if (!response.ok) throw new Error("No se pudo guardar los links.");
      const payload = (await response.json()) as {
        sourceId?: string;
        homeMapsUrl?: string | null;
        pollingPlaceUrl?: string | null;
      };
      setRecords((current) =>
        current.map((item) =>
          item.sourceId === activeRecord.sourceId
            ? {
                ...item,
                homeMapsUrl: payload.homeMapsUrl ?? updated.homeMapsUrl ?? null,
                pollingPlaceUrl: payload.pollingPlaceUrl ?? updated.pollingPlaceUrl ?? null,
              }
            : item,
        ),
      );
      triggerSavePulse();
      closeLinksModal();
    } catch (error) {
      setRecords((current) =>
        current.map((item) => (item.sourceId === activeRecord.sourceId ? previous : item)),
      );
    }
  }, [activeRecord, config.apiBasePath, linksDraft, triggerSavePulse, closeLinksModal]);

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-foreground">
      <header
        ref={headerRef}
        className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,200,0,0.22),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,34,61,0.92),_rgba(15,34,61,0.96))] px-6 py-8 text-white"
      >
        <div className="mx-auto flex w-full max-w-[1760px] flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/20">
              <Image
                src="/isotipo(2).jpg"
                alt="GOBERNA"
                width={56}
                height={56}
                className="h-full w-full rounded-lg object-contain"
                priority
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">
                  Reporte diario
                </span>
                {config.badgeDate ? (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">
                    {config.badgeDate}
                  </span>
                ) : null}
              </div>
              <h1 className="heading-display text-3xl font-semibold text-white md:text-4xl">
                {config.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span className="text-white/90">{config.subtitle}</span>
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">
                  INFO
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/80">
              {records.length || 0} registros
            </div>
            <div
              className={`rounded-2xl border px-4 py-3 text-xs uppercase tracking-[0.2em] ${
                savePulse
                  ? "border-[#25D366]/60 bg-[#25D366]/10 text-[#d6ffe5]"
                  : "border-white/15 bg-white/10 text-white/70"
              }`}
            >
              {savePulse ? "Guardado" : "Sincronizado"}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1760px] flex-1 flex-col gap-4 px-6 pb-6 pt-4">
        <section className="panel fade-rise flex min-h-0 flex-1 flex-col rounded-3xl border border-border/70 bg-white/92 px-6 py-5 shadow-[0_20px_50px_rgba(15,34,61,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="heading-display text-2xl font-semibold">{config.tableTitle}</h2>
              <p className="text-sm text-muted-foreground">{config.tableDescription}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-border/60 text-foreground">
                {filteredRecords.length} registros activos
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
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <label
                htmlFor="record-search"
                className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground"
              >
                Buscar registro
              </label>
              <Input
                id="record-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Entrevistador, candidato, nombre o telefono"
                className="mt-2 h-12 rounded-2xl border-border/60 bg-white/80"
              />
            </div>
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
                  className={`min-h-[40px] rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
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
          <details className="mt-4 rounded-2xl border border-border/60 bg-[#f8f6f1] px-5 py-4">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
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
                className="min-h-[120px] rounded-2xl border-border/60 bg-white"
              />
              <p className="text-xs text-muted-foreground">
                Se aplica al abrir WhatsApp desde cualquier fila. Usa {"{nombre}"} para
                insertar el nombre del entrevistado.
              </p>
            </div>
          </details>
          <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-border/60 bg-white">
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                  <TableRow>
                    <TableHead className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Hora
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Entrevistador
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Ciudadano
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Telefono (WhatsApp)
                    </TableHead>
                    <TableHead className="text-right text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Estado
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    LOADING_ROW_KEYS.map((rowKey) => (
                      <TableRow key={rowKey} className="border-border/60">
                        <TableCell colSpan={TABLE_COLUMN_COUNT} className="py-6">
                          <div className="h-4 w-full animate-pulse rounded-full bg-muted/50" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={TABLE_COLUMN_COUNT}
                        className="py-8 text-center text-sm text-red-500"
                      >
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
                      <TableCell colSpan={TABLE_COLUMN_COUNT} className="py-10 text-center text-sm">
                        <div className="space-y-3">
                          <p>No hay registros para mostrar.</p>
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
                    filteredRecords.map((record, index) => (
                      <TableRow
                        key={record.sourceId}
                        className={`border-border/60 ${
                          index % 2 === 0 ? "bg-[#fbfaf7]" : "bg-transparent"
                        } hover:bg-[#fff7d6]`}
                      >
                        {(() => {
                          const status = statusMap[normalizePhone(record.phone)] ?? {};
                          const contacted = Boolean(status.contacted);
                          const replied = Boolean(status.replied);
                          const canDelete = deletingId === record.sourceId;
                          const linkCount = getLinkCount(record);
                          return (
                            <>
                              <TableCell>{formatDateTime(record.timestamp)}</TableCell>
                              <TableCell className="whitespace-normal" title={record.interviewer}>
                                {record.interviewer}
                              </TableCell>
                              <TableCell className="whitespace-normal" title={record.name}>
                                {record.name}
                              </TableCell>
                              <TableCell className="font-medium">
                                <button
                                  type="button"
                                  className="inline-flex min-h-[42px] items-center rounded-full border border-[#163960]/30 bg-white px-4 py-2 text-sm font-semibold text-[#163960] shadow-[0_8px_18px_rgba(15,34,61,0.12)] transition hover:border-[#25D366] hover:text-[#1a8d44]"
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
                                  <span className="min-h-[38px] rounded-full border border-border/60 bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    {linkCount === 0
                                      ? "Sin links"
                                      : `${linkCount} link${linkCount === 1 ? "" : "s"}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openLinksModal(record)}
                                    className="min-h-[38px] rounded-full border border-[#163960]/30 bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#163960] transition hover:border-[#163960]/70"
                                  >
                                    Links
                                  </button>
                                  <button
                                    type="button"
                                    className={`min-h-[38px] rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                                      contacted
                                        ? "border-[#FFC800] bg-[#FFC800]/20 text-[#7a5b00]"
                                        : "border-border/60 text-muted-foreground hover:border-[#FFC800]/60 hover:text-[#7a5b00]"
                                    }`}
                                    onClick={() =>
                                      setRecordStatus(record.phone, {
                                        contacted: !contacted,
                                      })
                                    }
                                  >
                                    Hablado
                                  </button>
                                  <button
                                    type="button"
                                    className={`min-h-[38px] rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
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
                                  <button
                                    type="button"
                                    disabled={canDelete}
                                    onClick={() => handleDelete(record)}
                                    className={`min-h-[38px] rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                                      canDelete
                                        ? "cursor-wait border-red-500/40 text-red-500"
                                        : "border-border/60 text-muted-foreground hover:border-red-500/60 hover:text-red-500"
                                    }`}
                                  >
                                    {canDelete ? "Eliminando" : "Eliminar"}
                                  </button>
                                </div>
                              </TableCell>
                            </>
                          );
                        })()}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </div>
      <Dialog open={linksOpen} onOpenChange={(open) => (open ? null : closeLinksModal())}>
        <DialogContent className="rounded-3xl border-border/70 bg-white/95">
          <DialogHeader>
            <DialogTitle>Links de ubicacion</DialogTitle>
            <DialogDescription>
              Guarda los links de Maps para casa y local de votacion.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <label
                htmlFor="home-maps-url"
                className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Casa
              </label>
              <Input
                id="home-maps-url"
                value={linksDraft.homeMapsUrl}
                onChange={(event) =>
                  setLinksDraft((current) => ({
                    ...current,
                    homeMapsUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
                className="mt-2 h-11 rounded-2xl border-border/60 bg-white"
              />
              {linksErrors.homeMapsUrl ? (
                <p className="mt-2 text-xs text-red-500">{linksErrors.homeMapsUrl}</p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="polling-place-url"
                className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Local de votacion
              </label>
              <Input
                id="polling-place-url"
                value={linksDraft.pollingPlaceUrl}
                onChange={(event) =>
                  setLinksDraft((current) => ({
                    ...current,
                    pollingPlaceUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
                className="mt-2 h-11 rounded-2xl border-border/60 bg-white"
              />
              {linksErrors.pollingPlaceUrl ? (
                <p className="mt-2 text-xs text-red-500">{linksErrors.pollingPlaceUrl}</p>
              ) : null}
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <button
              type="button"
              onClick={closeLinksModal}
              className="min-h-[40px] rounded-full border border-border/60 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:border-[#163960]/50 hover:text-[#163960]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveLinks}
              className="min-h-[40px] rounded-full border border-[#163960]/40 bg-[#163960]/10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#163960] transition hover:border-[#163960]"
            >
              Guardar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
