import {
  CONTACTADOS,
  DATOS,
  DATOS_TOTAL,
  FOLLOWERS_BEFORE,
  FOLLOWERS_NOW,
  SUMMARY_FORMAT,
  TEMAS_CLAVE,
  VOLUNTARIOS,
  VOLUNTARIOS_TOTAL,
  WHATSAPP_FOLLOWERS,
} from "@/dashboards/guillermo/constants/dashboard";
import type { SummaryCard } from "@/dashboards/guillermo/types/dashboard";
import {
  formatNumber,
  formatSeconds,
} from "@/dashboards/guillermo/utils/dashboardFormat";

interface DashboardSidebarProps {
  summaryCards: SummaryCard[];
}

export default function DashboardSidebar({ summaryCards }: DashboardSidebarProps) {
  return (
    <aside
      className="order-2 w-full px-4 py-6 lg:w-[320px] lg:py-8"
      style={{ backgroundColor: "var(--card)" }}
    >
      <div className="space-y-4">
        <section className="space-y-4">
          <div className="rounded-3xl bg-card/70 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-0">
            <div className="flex items-center justify-between gap-2">
              <p
                className="text-sm font-semibold uppercase tracking-[0.24em]"
                style={{ color: "var(--text-1)" }}
              >
                Datos
              </p>
              <span
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: "var(--text-2)" }}
              >
                Total {formatNumber(DATOS_TOTAL)}
              </span>
            </div>
            <div
              className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--text-2)" }}
            >
              <span>Digital</span>
              <span className="text-right">Territorial</span>
            </div>
            <div
              className="mt-2 grid grid-cols-2 gap-3 text-xl font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              <span>{formatNumber(DATOS.digital)}</span>
              <span className="text-right">{formatNumber(DATOS.territorial)}</span>
            </div>
            <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-800" />
            <p
              className="mt-3 text-sm font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--text-1)" }}
            >
              Contactados
            </p>
            <div
              className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--text-2)" }}
            >
              <span>Digital</span>
              <span className="text-right">Territorial</span>
            </div>
            <div
              className="mt-2 grid grid-cols-2 gap-3 text-xl font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              <span>{formatNumber(CONTACTADOS.digital)}</span>
              <span className="text-right">{formatNumber(CONTACTADOS.territorial)}</span>
            </div>
          </div>
          <div className="rounded-3xl bg-card/70 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-0">
            <p
              className="text-sm font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--text-1)" }}
            >
              Voluntarios
            </p>
            <div className="mt-3 grid grid-cols-[1fr_1.2fr] gap-4">
              <div>
                <p className="text-3xl font-semibold" style={{ color: "var(--text-1)" }}>
                  {formatNumber(VOLUNTARIOS_TOTAL)}
                </p>
              </div>
              <div className="space-y-2">
                {VOLUNTARIOS.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs font-semibold"
                    style={{ color: "var(--text-1)" }}
                  >
                    <span className="uppercase tracking-[0.18em]">{item.label}</span>
                    <span>{formatNumber(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.32em]"
            style={{ color: "var(--text-1)" }}
          >
            Crecimiento
          </p>
          <div className="rounded-3xl bg-card/70 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-0">
            <p
              className="text-sm font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--text-1)" }}
            >
              Seguidores
            </p>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: "var(--text-2)" }}
                >
                  Canal WhatsApp
                </span>
                <span className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>
                  {formatNumber(WHATSAPP_FOLLOWERS)}
                </span>
              </div>
              <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-800" />
              <p
                className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: "var(--text-2)" }}
              >
                Seguidores Facebook
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-2)" }}>
                  Antes
                </p>
                <p className="text-[10px] text-right font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-2)" }}>
                  Despues
                </p>
                <p className="text-2xl font-semibold" style={{ color: "var(--text-1)" }}>
                  {formatNumber(FOLLOWERS_BEFORE)}
                </p>
                <p className="text-2xl font-semibold text-right" style={{ color: "var(--text-1)" }}>
                  {formatNumber(FOLLOWERS_NOW)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.32em]"
            style={{ color: "var(--text-1)" }}
          >
            Insights
          </p>
          <div className="rounded-3xl bg-card/70 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-0">
            <p
              className="text-sm font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--text-1)" }}
            >
              Usuarios y eventos
            </p>
            {summaryCards.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {summaryCards.map((item) => (
                  <div key={item.label}>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                      style={{ color: "var(--text-2)" }}
                    >
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold" style={{ color: "var(--text-1)" }}>
                      {item.format === SUMMARY_FORMAT.SECONDS
                        ? formatSeconds(item.value)
                        : formatNumber(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm" style={{ color: "var(--text-2)" }}>
                Sin datos del informe panoramico.
              </p>
            )}
          </div>
          <div className="rounded-3xl bg-card/70 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-0">
            <p
              className="text-sm font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--text-1)" }}
            >
              Temas clave
            </p>
            <div className="mt-3 space-y-2 text-xs" style={{ color: "var(--text-1)" }}>
              {TEMAS_CLAVE.map((tema) => (
                <div key={tema.label} className="flex items-start justify-between gap-3">
                  <span className="text-[11px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                    {tema.label}
                  </span>
                  <span className="text-sm font-semibold">{tema.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-card/70 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-0">
            <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-1)" }}>
              Tendencia de comentarios
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-1)" }}>
              Predomina tono positivo y de apoyo, con picos en publicaciones de campana territorial.
            </p>
          </div>
          <div className="rounded-3xl bg-card/70 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] ring-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-1)" }}>
                Resumen IA
              </p>
              <span
                className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--text-2)", borderColor: "var(--border)" }}
              >
                Insight
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-1)" }}>
              Mayormente positivo y de apoyo al candidato, con mensajes de respaldo y consignas.
            </p>
          </div>
        </section>
      </div>
    </aside>
  );
}
