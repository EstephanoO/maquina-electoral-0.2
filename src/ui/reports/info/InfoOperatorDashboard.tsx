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
import { useOperators } from "@/habilitaciones/hooks/useOperators";
import { useFormAccess } from "@/habilitaciones/hooks/useFormAccess";
import { updateFormAccessStatus } from "@/habilitaciones/services/formsAccessApi";
import type { FormAccessRecord, FormAccessStatus } from "@/habilitaciones/types";

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

type RecordStatus = {
  contacted?: boolean;
  replied?: boolean;
  deleted?: boolean;
  homeMapsUrl?: string | null;
  pollingPlaceUrl?: string | null;
  linksComment?: string | null;
  updatedAt?: number;
};

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

const formatPhone = (phone: string) => {
  const digits = normalizePhone(phone);
  if (digits.length !== 9) return `+51 ${digits}`;
  return `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
};

const buildWhatsappUrl = (phone: string, message: string) => {
  const digits = normalizePhone(phone);
  const text = encodeURIComponent(message.trim());
  return `https://wa.me/51${digits}?text=${text}`;
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

const formatDateTime = (timestamp: string | null) => {
  if (!timestamp) return "";
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return timestamp;
  return new Intl.DateTimeFormat("es-PE", {
    timeStyle: "short",
  }).format(value);
};

const parseDateInput = (value: string, mode: "start" | "end") => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const hours = mode === "end" ? 23 : 0;
  const minutes = mode === "end" ? 59 : 0;
  const seconds = mode === "end" ? 59 : 0;
  const ms = mode === "end" ? 999 : 0;
  return new Date(year, month - 1, day, hours, minutes, seconds, ms).getTime();
};

type InfoOperatorDashboardProps = {
  operatorSlug: string;
};

type LinkDraft = {
  homeMapsUrl: string;
  pollingPlaceUrl: string;
  linksComment: string;
};

export default function InfoOperatorDashboard({ operatorSlug }: InfoOperatorDashboardProps) {
  const headerRef = React.useRef<HTMLElement | null>(null);
  const { operators, isLoading: operatorsLoading } = useOperators();
  const operator = operators.find((item) => item.slug === operatorSlug);
  const operatorId = operator?.id ?? null;
  const { records, statuses, isLoading, error, mutate } = useFormAccess(operatorId);
  const [message, setMessage] = React.useState(DEFAULT_MESSAGE);
  const [search, setSearch] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [statusMap, setStatusMap] = React.useState<Record<string, RecordStatus>>({});
  const [savePulse, setSavePulse] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [linksOpen, setLinksOpen] = React.useState(false);
  const [linksDraft, setLinksDraft] = React.useState<LinkDraft>({
    homeMapsUrl: "",
    pollingPlaceUrl: "",
    linksComment: "",
  });
  const [linksErrors, setLinksErrors] = React.useState<Partial<LinkDraft>>({});
  const [activeRecord, setActiveRecord] = React.useState<FormAccessRecord | null>(null);
  const saveTimerRef = React.useRef<number | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "uncontacted" | "contacted" | "replied" | "trash"
  >("all");
  const dateFromMs = React.useMemo(() => parseDateInput(dateFrom, "start"), [dateFrom]);
  const dateToMs = React.useMemo(() => parseDateInput(dateTo, "end"), [dateTo]);
  const hasDateFilter = Boolean(dateFrom || dateTo);

  React.useEffect(() => {
    const nextStatusMap = (statuses ?? []).reduce(
      (acc, status) => {
        acc[status.formId] = {
          contacted: status.contacted,
          replied: status.replied,
          deleted: status.deleted,
          homeMapsUrl: status.homeMapsUrl ?? null,
          pollingPlaceUrl: status.pollingPlaceUrl ?? null,
          linksComment: status.linksComment ?? null,
          updatedAt: status.updatedAt ? new Date(status.updatedAt).getTime() : undefined,
        };
        return acc;
      },
      {} as Record<string, RecordStatus>,
    );
    setStatusMap(nextStatusMap);
  }, [statuses]);

  const triggerSavePulse = React.useCallback(() => {
    if (typeof window === "undefined") return;
    setSavePulse(true);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => setSavePulse(false), 1800);
  }, []);

  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  React.useLayoutEffect(() => {
    if (!headerRef.current) return;
    const updateHeaderHeight = () => {
      const height = headerRef.current?.getBoundingClientRect().height ?? 0;
      document.documentElement.style.setProperty("--info-feb-header", `${Math.ceil(height)}px`);
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

  const getLinkCount = React.useCallback(
    (status: RecordStatus) =>
      [status.homeMapsUrl, status.pollingPlaceUrl].filter(Boolean).length,
    [],
  );

  React.useLayoutEffect(() => {
    if (typeof document === "undefined") return undefined;
    applyTheme("light");
    return undefined;
  }, []);

  const recordsWithLinks = React.useMemo(
    () => records.filter((record) => getLinkCount(statusMap[record.formId] ?? {}) > 0),
    [records, statusMap, getLinkCount],
  );

  const statusCounts = React.useMemo(() => {
    let contacted = 0;
    let replied = 0;
    let trash = 0;
    recordsWithLinks.forEach((record) => {
      const status = statusMap[record.formId] ?? {};
      if (status.deleted) {
        trash += 1;
        return;
      }
      if (status.contacted) contacted += 1;
      if (status.replied) replied += 1;
    });
    const activeTotal = Math.max(recordsWithLinks.length - trash, 0);
    return {
      all: activeTotal,
      contacted,
      replied,
      uncontacted: Math.max(activeTotal - contacted, 0),
      trash,
    };
  }, [recordsWithLinks, statusMap]);

  const filteredRecords = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return recordsWithLinks.filter((record) => {
      const status = statusMap[record.formId] ?? {};
      if (query) {
        const match = [record.interviewer, record.name, record.phone]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(query));
        if (!match) return false;
      }
      const createdAtMs = record.createdAt ? new Date(record.createdAt).getTime() : null;
      if (hasDateFilter) {
        if (!createdAtMs || Number.isNaN(createdAtMs)) return false;
        if (dateFromMs && createdAtMs < dateFromMs) return false;
        if (dateToMs && createdAtMs > dateToMs) return false;
      }
      if (status.deleted) return statusFilter === "trash";
      if (statusFilter === "trash") return false;
      if (statusFilter === "uncontacted") return !status.contacted;
      if (statusFilter === "contacted") return Boolean(status.contacted);
      if (statusFilter === "replied") return Boolean(status.replied);
      return true;
    });
  }, [
    recordsWithLinks,
    search,
    statusFilter,
    statusMap,
    dateFromMs,
    dateToMs,
    hasDateFilter,
  ]);

  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== "uncontacted" || hasDateFilter;

  const setRecordStatus = React.useCallback(
    async (record: FormAccessRecord, next: Partial<RecordStatus>) => {
      if (!operatorId) return;
      const previous = statusMap[record.formId] ?? {};
      const optimistic = { ...previous, ...next, updatedAt: Date.now() };
      setStatusMap((current) => ({ ...current, [record.formId]: optimistic }));
      triggerSavePulse();
      try {
        const payload = (await updateFormAccessStatus({
          operatorId,
          formId: record.formId,
          contacted: Boolean(optimistic.contacted),
          replied: Boolean(optimistic.replied),
          deleted: Boolean(optimistic.deleted),
          homeMapsUrl: optimistic.homeMapsUrl ?? null,
          pollingPlaceUrl: optimistic.pollingPlaceUrl ?? null,
          linksComment: optimistic.linksComment ?? null,
        })) as FormAccessStatus;
        setStatusMap((current) => ({
          ...current,
          [payload.formId]: {
            contacted: payload.contacted,
            replied: payload.replied,
            deleted: payload.deleted,
            homeMapsUrl: payload.homeMapsUrl ?? null,
            pollingPlaceUrl: payload.pollingPlaceUrl ?? null,
            linksComment: payload.linksComment ?? null,
            updatedAt: payload.updatedAt ? new Date(payload.updatedAt).getTime() : undefined,
          },
        }));
        triggerSavePulse();
        void mutate();
      } catch (err) {
        setStatusMap((current) => ({ ...current, [record.formId]: previous }));
      }
    },
    [operatorId, statusMap, triggerSavePulse, mutate],
  );

  const handleDelete = React.useCallback(
    async (record: FormAccessRecord) => {
      const confirmed = window.confirm(
        `Eliminar definitivamente a ${record.name || "este registro"}?`,
      );
      if (!confirmed) return;
      setDeletingId(record.formId);
      try {
        await setRecordStatus(record, { deleted: true });
      } finally {
        setDeletingId((current) => (current === record.formId ? null : current));
      }
    },
    [setRecordStatus],
  );

  const openLinksModal = React.useCallback(
    (record: FormAccessRecord) => {
      const status = statusMap[record.formId] ?? {};
      setActiveRecord(record);
      setLinksDraft({
        homeMapsUrl: status.homeMapsUrl ?? "",
        pollingPlaceUrl: status.pollingPlaceUrl ?? "",
        linksComment: status.linksComment ?? "",
      });
      setLinksErrors({});
      setLinksOpen(true);
    },
    [statusMap],
  );

  const closeLinksModal = React.useCallback(() => {
    setLinksOpen(false);
    setActiveRecord(null);
    setLinksErrors({});
  }, []);

  const saveLinks = React.useCallback(async () => {
    if (!activeRecord) return;
    const nextHome = linksDraft.homeMapsUrl.trim();
    const nextPolling = linksDraft.pollingPlaceUrl.trim();
    const nextComment = linksDraft.linksComment.trim();
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
    await setRecordStatus(activeRecord, {
      homeMapsUrl: nextHome || null,
      pollingPlaceUrl: nextPolling || null,
      linksComment: nextComment || null,
    });
    closeLinksModal();
  }, [activeRecord, linksDraft, setRecordStatus, closeLinksModal]);

  if (operatorsLoading) {
    return (
      <main className="min-h-screen px-6 py-10 text-foreground">
        <p className="text-sm text-muted-foreground">Cargando operadora...</p>
      </main>
    );
  }

  if (!operator) {
    return (
      <main className="min-h-screen px-6 py-10 text-foreground">
        <p className="text-sm text-muted-foreground">Operadora no encontrada.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-foreground">
      <header
        ref={headerRef}
        className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,200,0,0.22),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,34,61,0.92),_rgba(15,34,61,0.96))] px-6 py-8 text-white [&_*]:!text-white"
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
                <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">
                  Operadora
                </span>
              </div>
              <h1 className="heading-display text-3xl font-semibold text-white md:text-4xl">
                Registros {operator.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span className="text-white/90">Contactos habilitados</span>
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">
                  INFO
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/80">
              {recordsWithLinks.length || 0} registros
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

      <div className="mx-auto flex w-full max-w-[1760px] flex-1 flex-col gap-4 px-6 pb-6 pt-4 [&_*]:!text-black">
        <section className="panel fade-rise flex min-h-0 flex-1 flex-col rounded-3xl border border-border/70 bg-white/92 px-6 py-5 shadow-[0_20px_50px_rgba(15,34,61,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="heading-display text-2xl font-semibold">Contactos habilitados</h2>
              <p className="text-sm text-muted-foreground">
                Toca un numero para abrir WhatsApp con el mensaje activo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-border/60 text-foreground">
                {filteredRecords.length} registros activos
              </Badge>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="min-h-[36px] rounded-full border border-border/60 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition hover:border-[#163960]/50 hover:text-[#163960]"
                >
                  Limpiar fechas
                </button>
              )}
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
                placeholder="Entrevistador, nombre o telefono"
                className="mt-2 h-12 rounded-2xl border-border/60 bg-white/80"
              />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[160px]">
                <label
                  htmlFor="record-date-from"
                  className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
                >
                  Desde
                </label>
                <Input
                  id="record-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  max={dateTo || undefined}
                  className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                />
              </div>
              <div className="min-w-[160px]">
                <label
                  htmlFor="record-date-to"
                  className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
                >
                  Hasta
                </label>
                <Input
                  id="record-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  min={dateFrom || undefined}
                  className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {([
                { id: "uncontacted", label: "No hablados", count: statusCounts.uncontacted },
                { id: "contacted", label: "Hablados", count: statusCounts.contacted },
                { id: "replied", label: "Respondieron", count: statusCounts.replied },
                { id: "trash", label: "Basura", count: statusCounts.trash },
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
                  {isLoading ? (
                    LOADING_ROW_KEYS.map((rowKey) => (
                      <TableRow key={rowKey} className="border-border/60">
                        <TableCell colSpan={4} className="py-6">
                          <div className="h-4 w-full animate-pulse rounded-full bg-muted/50" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-red-500">
                        <div className="space-y-3">
                          <p>{String(error)}</p>
                          <button
                            type="button"
                            onClick={() => mutate()}
                            className="min-h-[36px] rounded-full border border-red-500/40 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-red-500 transition hover:border-red-500"
                          >
                            Reintentar
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm">
                        <div className="space-y-3">
                          <p>No hay registros para mostrar.</p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearch("");
                                setStatusFilter("uncontacted");
                                setDateFrom("");
                                setDateTo("");
                              }}
                              className="min-h-[36px] rounded-full border border-border/60 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition hover:border-[#163960]/50 hover:text-[#163960]"
                            >
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record, index) => (
                      <TableRow
                        key={record.formId}
                        className={`border-border/60 ${
                          index % 2 === 0 ? "bg-[#fbfaf7]" : "bg-transparent"
                        } hover:bg-[#fff7d6]`}
                      >
                        {(() => {
                          const status = statusMap[record.formId] ?? {};
                          const contacted = Boolean(status.contacted);
                          const replied = Boolean(status.replied);
                          const deleted = Boolean(status.deleted);
                          const canDelete = deletingId === record.formId;
                          const linkCount = getLinkCount(status);
                          const linkBadgeClass =
                            linkCount === 2
                              ? "border-[#25D366]/60 bg-[#25D366]/15 text-[#1a8d44]"
                              : linkCount === 1
                                ? "border-[#FFC800]/60 bg-[#FFC800]/20 text-[#7a5b00]"
                                : "border-border/60 bg-white text-muted-foreground";
                          return (
                            <>
                              <TableCell>{formatDateTime(record.createdAt)}</TableCell>
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
                                    const url = buildWhatsappUrl(
                                      record.phone,
                                      personalizedMessage,
                                    );
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
                                  <span
                                    className={`min-h-[38px] min-w-[38px] rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] ${linkBadgeClass}`}
                                  >
                                    {linkCount}
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
                                      setRecordStatus(record, {
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
                                      setRecordStatus(record, {
                                        replied: !replied,
                                        contacted: true,
                                      })
                                    }
                                  >
                                    Respondio
                                  </button>
                                  <button
                                    type="button"
                                    className={`min-h-[38px] rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                                      deleted
                                        ? "border-red-500/40 bg-red-500/10 text-red-600"
                                        : "border-border/60 text-muted-foreground hover:border-red-500/60 hover:text-red-500"
                                    }`}
                                    onClick={() =>
                                      setRecordStatus(record, {
                                        deleted: !deleted,
                                      })
                                    }
                                  >
                                    Basura
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
            <div>
              <label
                htmlFor="links-comment"
                className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Comentario
              </label>
              <Textarea
                id="links-comment"
                value={linksDraft.linksComment}
                onChange={(event) =>
                  setLinksDraft((current) => ({
                    ...current,
                    linksComment: event.target.value,
                  }))
                }
                placeholder="Notas adicionales"
                className="mt-2 min-h-[100px] rounded-2xl border-border/60 bg-white"
              />
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
