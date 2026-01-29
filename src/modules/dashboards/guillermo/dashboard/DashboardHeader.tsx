import Image from "next/image";
import { CONTACTOS_FORMULARIOS, voteGoal, voteProgress } from "../constants/dashboard";
import { formatNumber } from "../utils/dashboardFormat";

const totalFormContacts = CONTACTOS_FORMULARIOS.reduce(
  (sum, item) => sum + item.leads,
  0,
);

type DashboardHeaderProps = {
  candidateName?: string;
  roleLabel?: string;
  partyLabel?: string;
  imageSrc?: string;
  contactsTotal?: number;
  progressValue?: number;
  goalValue?: number;
};

export default function DashboardHeader({
  candidateName = "Guillermo Aliaga",
  roleLabel = "Senador nacional",
  partyLabel = "Somos Peru",
  imageSrc = "/2guillermo.jpg",
  contactsTotal = totalFormContacts,
  progressValue = voteProgress,
  goalValue = voteGoal,
}: DashboardHeaderProps) {
  const progress = Math.min((progressValue / goalValue) * 100, 100);
  return (
    <header className="bg-card/70 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.18)] backdrop-blur">
      <div className="flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:px-10">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white/80 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.2)] ring-1 ring-black/5">
            <Image
              src={imageSrc}
              alt={candidateName}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {roleLabel}
            </p>
            <h1 className="text-lg font-semibold uppercase tracking-[0.12em] text-foreground">
              {candidateName}
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {partyLabel}
            </p>
          </div>
        </div>
        <div className="ml-auto grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-card/70 px-4 py-3 shadow-sm ring-1 ring-black/5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Contactos conseguidos
            </p>
            <p className="text-lg font-semibold text-foreground">
              {formatNumber(contactsTotal)}
            </p>
            <div className="mt-2 h-2 rounded-full bg-muted/60">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-card/70 px-4 py-3 shadow-sm ring-1 ring-black/5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Proyeccion votos
            </p>
            <p className="text-lg font-semibold text-foreground">
              {formatNumber(progressValue)}
            </p>
            <div className="mt-2 h-2 rounded-full bg-muted/60">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-blue-600"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-2xl bg-card/70 px-4 py-3 shadow-sm ring-1 ring-black/5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Meta total
            </p>
            <p className="text-lg font-semibold text-foreground">
              {formatNumber(goalValue)}
            </p>
            <div className="mt-2 h-2 rounded-full bg-muted/60">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
