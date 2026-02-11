"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/ui/primitives/badge";
import { Input } from "@/ui/primitives/input";
import { Textarea } from "@/ui/primitives/textarea";
import { applyTheme } from "@/theme/theme";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/ui/primitives/table";

import {
  CESAR_VASQUEZ_CONFIG_STORAGE_KEY,
  CESAR_VASQUEZ_CONFIG_URL,
  DEFAULT_CESAR_VASQUEZ_CONFIG,
  type CesarVasquezConfig,
  normalizeCesarVasquezConfig,
} from "@/ui/reports/info/cesarVasquezConfig";

const SIMULATED_RECORDS = [
  {
    id: "cv-001",
    timestamp: "2026-02-11T08:12:00-05:00",
    interviewer: "Lucia Ramos",
    candidate: "Cesar Vasquez",
    name: "Mariana Torres",
    phone: "987654321",
    district: "Cercado",
  },
  {
    id: "cv-002",
    timestamp: "2026-02-11T08:37:00-05:00",
    interviewer: "Bruno Salazar",
    candidate: "Cesar Vasquez",
    name: "Hector Quispe",
    phone: "956123987",
    district: "Miraflores",
  },
  {
    id: "cv-003",
    timestamp: "2026-02-11T09:05:00-05:00",
    interviewer: "Lucia Ramos",
    candidate: "Cesar Vasquez",
    name: "Paola Meza",
    phone: "912345678",
    district: "Yanahuara",
  },
  {
    id: "cv-004",
    timestamp: "2026-02-11T09:42:00-05:00",
    interviewer: "Diego Ponce",
    candidate: "Cesar Vasquez",
    name: "Rodolfo Caceres",
    phone: "901223344",
    district: "Cayma",
  },
  {
    id: "cv-005",
    timestamp: "2026-02-11T10:10:00-05:00",
    interviewer: "Valeria Rivas",
    candidate: "Cesar Vasquez",
    name: "Ana Maria Cardenas",
    phone: "978654123",
    district: "Sachaca",
  },
  {
    id: "cv-006",
    timestamp: "2026-02-11T10:36:00-05:00",
    interviewer: "Diego Ponce",
    candidate: "Cesar Vasquez",
    name: "Luis Solis",
    phone: "945667788",
    district: "Jose Luis Bustamante",
  },
  {
    id: "cv-007",
    timestamp: "2026-02-11T11:02:00-05:00",
    interviewer: "Lucia Ramos",
    candidate: "Cesar Vasquez",
    name: "Carmen Huaman",
    phone: "934556677",
    district: "Alto Selva Alegre",
  },
];

type RecordStatus = {
  contacted?: boolean;
  replied?: boolean;
  updatedAt?: number;
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

const parseMetaValue = (value: string) => {
  const normalized = value.replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatMetaProgress = (current: string, total: string) => {
  const currentValue = parseMetaValue(current);
  const totalValue = parseMetaValue(total);
  if (currentValue === null || totalValue === null) return null;
  if (totalValue === 0) return null;
  return `${((currentValue / totalValue) * 100).toFixed(2)}%`;
};

const formatDateTime = (timestamp: string) => {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return timestamp;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Lima",
  }).format(value);
};

export default function InfoCesarVasquezDashboard() {
  const headerRef = React.useRef<HTMLElement | null>(null);
  const previousThemeRef = React.useRef<"light" | "dark" | null>(null);
  const [config, setConfig] = React.useState<CesarVasquezConfig>(
    DEFAULT_CESAR_VASQUEZ_CONFIG,
  );
  const [message, setMessage] = React.useState(
    DEFAULT_CESAR_VASQUEZ_CONFIG.messageTemplate,
  );
  const [search, setSearch] = React.useState("");
  const [statusMap, setStatusMap] = React.useState<Record<string, RecordStatus>>({});
  const [savePulse, setSavePulse] = React.useState(false);
  const saveTimerRef = React.useRef<number | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "uncontacted" | "contacted" | "replied"
  >("uncontacted");

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

  React.useEffect(() => {
    let active = true;
    const loadConfig = async () => {
      let nextConfig = DEFAULT_CESAR_VASQUEZ_CONFIG;
      try {
        const response = await fetch(CESAR_VASQUEZ_CONFIG_URL, { cache: "no-store" });
        if (response.ok) {
          const payload = (await response.json()) as Partial<CesarVasquezConfig>;
          nextConfig = normalizeCesarVasquezConfig(payload, nextConfig);
        }
      } catch (error) {
        nextConfig = DEFAULT_CESAR_VASQUEZ_CONFIG;
      }

      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(CESAR_VASQUEZ_CONFIG_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Partial<CesarVasquezConfig>;
            nextConfig = normalizeCesarVasquezConfig(parsed, nextConfig);
          } catch (error) {
            window.localStorage.removeItem(CESAR_VASQUEZ_CONFIG_STORAGE_KEY);
          }
        }
      }

      if (!active) return;
      setConfig(nextConfig);
      setMessage(nextConfig.messageTemplate);
    };

    void loadConfig();
    return () => {
      active = false;
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
    SIMULATED_RECORDS.forEach((record) => {
      const status = statusMap[record.id] ?? {};
      if (status.contacted) contacted += 1;
      if (status.replied) replied += 1;
    });
    return {
      all: SIMULATED_RECORDS.length,
      contacted,
      replied,
      uncontacted: Math.max(SIMULATED_RECORDS.length - contacted, 0),
    };
  }, [statusMap]);

  const filteredRecords = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return SIMULATED_RECORDS.filter((record) => {
      if (query) {
        const match = [
          record.interviewer,
          record.candidate,
          record.name,
          record.phone,
          record.district,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
        if (!match) return false;
      }
      const status = statusMap[record.id] ?? {};
      if (statusFilter === "uncontacted") return !status.contacted;
      if (statusFilter === "contacted") return Boolean(status.contacted);
      if (statusFilter === "replied") return Boolean(status.replied);
      return true;
    });
  }, [search, statusFilter, statusMap]);

  const setRecordStatus = React.useCallback(
    (recordId: string, next: Partial<RecordStatus>) => {
      setStatusMap((current) => ({
        ...current,
        [recordId]: {
          ...current[recordId],
          ...next,
          updatedAt: Date.now(),
        },
      }));
      triggerSavePulse();
    },
    [triggerSavePulse],
  );

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
                src={config.logoSrc}
                alt={config.logoAlt}
                width={56}
                height={56}
                className="h-full w-full rounded-lg object-contain"
                priority
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">
                  {config.brandName}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">
                  {config.reportKicker}
                </span>
              </div>
              <h1 className="heading-display text-3xl font-semibold text-white md:text-4xl">
                {config.reportTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span className="text-white/90">{config.candidateName}</span>
                <span>{config.partyName}</span>
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">
                  {config.positionLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/80">
              {config.dateLabel}
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white/80">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                Meta de datos
              </div>
              <div className="text-sm font-semibold text-white">
                {config.metaDataCurrent} / {config.metaDataTotal}
              </div>
              {(() => {
                const progress = formatMetaProgress(
                  config.metaDataCurrent,
                  config.metaDataTotal,
                );
                if (!progress) return null;
                return <div className="text-[10px] text-white/60">{progress}</div>;
              })()}
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white/80">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                Meta de votos
              </div>
              <div className="text-sm font-semibold text-white">
                {config.metaVotesCurrent} / {config.metaVotesTotal}
              </div>
              {(() => {
                const progress = formatMetaProgress(
                  config.metaVotesCurrent,
                  config.metaVotesTotal,
                );
                if (!progress) return null;
                return <div className="text-[10px] text-white/60">{progress}</div>;
              })()}
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/80">
              {SIMULATED_RECORDS.length} registros
            </div>
            <div
              className={`rounded-2xl border px-4 py-3 text-xs uppercase tracking-[0.2em] ${
                savePulse
                  ? "border-[#25D366]/60 bg-[#25D366]/10 text-[#d6ffe5]"
                  : "border-white/15 bg-white/10 text-white/70"
              }`}
            >
              {savePulse ? "Guardado" : "Simulado"}
            </div>
            <Link
              href="/info/cesar-vasquez/config"
              className="min-h-[42px] rounded-full border border-white/20 bg-white/10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:bg-white/20"
            >
              Configurar
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1760px] flex-1 flex-col gap-4 px-6 pb-6 pt-4">
        <section className="panel fade-rise flex min-h-0 flex-1 flex-col rounded-3xl border border-border/70 bg-white/92 px-6 py-5 shadow-[0_20px_50px_rgba(15,34,61,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="heading-display text-2xl font-semibold">Tabla consolidada</h2>
              <p className="text-sm text-muted-foreground">
                Registros simulados para control interno de la campana.
              </p>
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
                placeholder="Entrevistador, distrito, nombre o telefono"
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
                      Distrito
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
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm">
                        <div className="space-y-3">
                          <p>No hay registros para mostrar.</p>
                          {search && (
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
                        key={record.id}
                        className={`border-border/60 ${
                          index % 2 === 0 ? "bg-[#fbfaf7]" : "bg-transparent"
                        } hover:bg-[#fff7d6]`}
                      >
                        {(() => {
                          const status = statusMap[record.id] ?? {};
                          const contacted = Boolean(status.contacted);
                          const replied = Boolean(status.replied);
                          return (
                            <>
                              <TableCell>{formatDateTime(record.timestamp)}</TableCell>
                              <TableCell className="whitespace-normal" title={record.interviewer}>
                                {record.interviewer}
                              </TableCell>
                              <TableCell className="whitespace-normal" title={record.name}>
                                {record.name}
                              </TableCell>
                              <TableCell className="whitespace-normal" title={record.district}>
                                {record.district}
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
                                  <button
                                    type="button"
                                    className={`min-h-[38px] rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                                      contacted
                                        ? "border-[#FFC800] bg-[#FFC800]/20 text-[#7a5b00]"
                                        : "border-border/60 text-muted-foreground hover:border-[#FFC800]/60 hover:text-[#7a5b00]"
                                    }`}
                                    onClick={() =>
                                      setRecordStatus(record.id, {
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
                                      setRecordStatus(record.id, {
                                        replied: !replied,
                                        contacted: true,
                                      })
                                    }
                                  >
                                    Respondio
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
    </main>
  );
}
