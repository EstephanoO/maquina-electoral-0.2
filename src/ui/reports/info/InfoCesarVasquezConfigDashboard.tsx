"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/ui/primitives/badge";
import { Input } from "@/ui/primitives/input";
import { Textarea } from "@/ui/primitives/textarea";
import { applyTheme } from "@/theme/theme";
import {
  CESAR_VASQUEZ_CONFIG_STORAGE_KEY,
  CESAR_VASQUEZ_CONFIG_URL,
  DEFAULT_CESAR_VASQUEZ_CONFIG,
  type CesarVasquezConfig,
  normalizeCesarVasquezConfig,
} from "@/ui/reports/info/cesarVasquezConfig";

type SaveState = "idle" | "saved" | "error";

const createDownload = (payload: CesarVasquezConfig) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cesar-vasquez.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function InfoCesarVasquezConfigDashboard() {
  const headerRef = React.useRef<HTMLElement | null>(null);
  const previousThemeRef = React.useRef<"light" | "dark" | null>(null);
  const [baseConfig, setBaseConfig] = React.useState<CesarVasquezConfig>(
    DEFAULT_CESAR_VASQUEZ_CONFIG,
  );
  const [config, setConfig] = React.useState<CesarVasquezConfig>(
    DEFAULT_CESAR_VASQUEZ_CONFIG,
  );
  const [saveState, setSaveState] = React.useState<SaveState>("idle");

  React.useLayoutEffect(() => {
    if (!headerRef.current) return;
    const updateHeaderHeight = () => {
      const height = headerRef.current?.getBoundingClientRect().height ?? 0;
      document.documentElement.style.setProperty(
        "--info-config-header",
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

      let mergedConfig = nextConfig;
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(CESAR_VASQUEZ_CONFIG_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Partial<CesarVasquezConfig>;
            mergedConfig = normalizeCesarVasquezConfig(parsed, nextConfig);
          } catch (error) {
            window.localStorage.removeItem(CESAR_VASQUEZ_CONFIG_STORAGE_KEY);
          }
        }
      }

      if (!active) return;
      setBaseConfig(nextConfig);
      setConfig(mergedConfig);
    };

    void loadConfig();
    return () => {
      active = false;
    };
  }, []);

  const updateField = React.useCallback(
    <K extends keyof CesarVasquezConfig>(key: K, value: CesarVasquezConfig[K]) => {
      setConfig((current) => ({ ...current, [key]: value }));
      setSaveState("idle");
    },
    [],
  );

  const handleSave = React.useCallback(() => {
    try {
      window.localStorage.setItem(
        CESAR_VASQUEZ_CONFIG_STORAGE_KEY,
        JSON.stringify(config, null, 2),
      );
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1600);
    } catch (error) {
      setSaveState("error");
    }
  }, [config]);

  const handleReset = React.useCallback(() => {
    setConfig(baseConfig);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CESAR_VASQUEZ_CONFIG_STORAGE_KEY);
    }
    setSaveState("idle");
  }, [baseConfig]);

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-foreground">
      <header
        ref={headerRef}
        className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,200,0,0.22),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,34,61,0.92),_rgba(15,34,61,0.96))] px-6 py-8 text-white"
      >
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/20">
              <Image
                src={config.logoSrc}
                alt={config.logoAlt}
                width={48}
                height={48}
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
                  Configuracion rapida
                </span>
              </div>
              <h1 className="heading-display text-3xl font-semibold text-white md:text-4xl">
                Personaliza el demo
              </h1>
              <p className="text-sm text-white/70">
                Guarda overrides locales o descarga el JSON para reusar.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={`border-white/20 text-xs uppercase tracking-[0.18em] text-white/80 ${
                saveState === "saved" ? "bg-[#25D366]/20 text-[#d6ffe5]" : "bg-white/10"
              }`}
            >
              {saveState === "saved" ? "Guardado" : "Sin cambios"}
            </Badge>
            <Link
              href="/info/cesar-vasquez.json"
              className="min-h-[42px] rounded-full border border-white/20 bg-white/10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:bg-white/20"
            >
              Ver datos
            </Link>
            <Link
              href="/info/cesar-vasquez"
              className="min-h-[42px] rounded-full border border-white/20 bg-white/10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:bg-white/20"
            >
              Ver inboxs
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-6 pb-10 pt-[calc(var(--info-config-header)+24px)]">
        <section className="panel fade-rise rounded-3xl border border-border/70 bg-white/92 px-6 py-6 shadow-[0_20px_50px_rgba(15,34,61,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="heading-display text-2xl font-semibold">Datos editables</h2>
              <p className="text-sm text-muted-foreground">
                Ajusta nombre, partido, logo y mensaje sin tocar codigo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="min-h-[40px] rounded-full border border-[#163960]/50 bg-[#163960]/10 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#163960] transition hover:border-[#163960] hover:bg-[#163960]/20"
              >
                Guardar en navegador
              </button>
              <button
                type="button"
                onClick={() => createDownload(config)}
                className="min-h-[40px] rounded-full border border-border/70 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-[#163960]/50 hover:text-[#163960]"
              >
                Descargar JSON
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[40px] rounded-full border border-border/70 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-[#163960]/50 hover:text-[#163960]"
              >
                Restaurar defaults
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="config-brand"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Marca
                  </label>
                  <Input
                    id="config-brand"
                    value={config.brandName}
                    onChange={(event) => updateField("brandName", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
                <div>
                  <label
                    htmlFor="config-logo-src"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Logo (src)
                  </label>
                  <Input
                    id="config-logo-src"
                    value={config.logoSrc}
                    onChange={(event) => updateField("logoSrc", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
                <div>
                  <label
                    htmlFor="config-logo-alt"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Logo (alt)
                  </label>
                  <Input
                    id="config-logo-alt"
                    value={config.logoAlt}
                    onChange={(event) => updateField("logoAlt", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
                <div>
                  <label
                    htmlFor="config-kicker"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Kicker
                  </label>
                  <Input
                    id="config-kicker"
                    value={config.reportKicker}
                    onChange={(event) => updateField("reportKicker", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="config-title"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Titulo del reporte
                  </label>
                  <Input
                    id="config-title"
                    value={config.reportTitle}
                    onChange={(event) => updateField("reportTitle", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
                <div>
                  <label
                    htmlFor="config-date"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Fecha
                  </label>
                  <Input
                    id="config-date"
                    value={config.dateLabel}
                    onChange={(event) => updateField("dateLabel", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
                <div>
                  <label
                    htmlFor="config-candidate"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Candidato
                  </label>
                  <Input
                    id="config-candidate"
                    value={config.candidateName}
                    onChange={(event) => updateField("candidateName", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
                <div>
                  <label
                    htmlFor="config-party"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Partido
                  </label>
                  <Input
                    id="config-party"
                    value={config.partyName}
                    onChange={(event) => updateField("partyName", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
                <div>
                  <label
                    htmlFor="config-position"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Puesto
                  </label>
                  <Input
                    id="config-position"
                    value={config.positionLabel}
                    onChange={(event) => updateField("positionLabel", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="config-meta-data-current"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Meta datos (actual)
                  </label>
                  <Input
                    id="config-meta-data-current"
                    value={config.metaDataCurrent}
                    onChange={(event) => updateField("metaDataCurrent", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
                <div>
                  <label
                    htmlFor="config-meta-data-total"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Meta datos (total)
                  </label>
                  <Input
                    id="config-meta-data-total"
                    value={config.metaDataTotal}
                    onChange={(event) => updateField("metaDataTotal", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
                <div>
                  <label
                    htmlFor="config-meta-votes-current"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Meta votos (actual)
                  </label>
                  <Input
                    id="config-meta-votes-current"
                    value={config.metaVotesCurrent}
                    onChange={(event) => updateField("metaVotesCurrent", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
                <div>
                  <label
                    htmlFor="config-meta-votes-total"
                    className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Meta votos (total)
                  </label>
                  <Input
                    id="config-meta-votes-total"
                    value={config.metaVotesTotal}
                    onChange={(event) => updateField("metaVotesTotal", event.target.value)}
                    className="mt-2 h-11 rounded-2xl border-border/60 bg-white/80"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="config-message"
                  className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                >
                  Mensaje WhatsApp
                </label>
                <Textarea
                  id="config-message"
                  value={config.messageTemplate}
                  onChange={(event) => updateField("messageTemplate", event.target.value)}
                  className="mt-2 min-h-[140px] rounded-2xl border-border/60 bg-white"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Usa {"{nombre}"} para insertar el nombre del entrevistado.
                </p>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-border/70 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,34,61,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#163960] p-2">
                    <Image
                      src={config.logoSrc}
                      alt={config.logoAlt}
                      width={40}
                      height={40}
                      className="h-full w-full rounded-lg object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {config.brandName}
                    </p>
                    <h3 className="heading-display text-lg">{config.reportTitle}</h3>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="text-foreground">{config.candidateName}</div>
                  <div>{config.partyName}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#163960]">
                    {config.positionLabel}
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {config.dateLabel}
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Meta datos: {config.metaDataCurrent} / {config.metaDataTotal}
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Meta votos: {config.metaVotesCurrent} / {config.metaVotesTotal}
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-border/70 bg-[#f8f6f1] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Vista previa mensaje
                </p>
                <p className="mt-3 text-sm text-foreground">
                  {config.messageTemplate}
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
