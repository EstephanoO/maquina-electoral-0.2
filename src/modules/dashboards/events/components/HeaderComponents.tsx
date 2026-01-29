import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  EventRecordsDialog,
  type EventRecord,
} from "../EventRecordsDialog";

interface DashboardHeaderProps {
  eventTitle?: string;
  eventSubtitle?: string;
  lastUpdated: Date | null;
  rows: EventRecord[];
  candidateLabels: string[];
  total: number;
  goalCurrent?: number | null;
  goalScopeLabel?: string | null;
  dataGoal?: string;
  onEdit: (record: EventRecord) => void;
  onDelete: (record: EventRecord) => void;
  onFocusPoint: (record: EventRecord) => void;
  onDownloadCSV: () => void;
  candidateProfile?: {
    name: string;
    party: string;
    role: string;
    number: string;
    image: string;
  };
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  eventTitle,
  eventSubtitle,
  lastUpdated,
  rows,
  candidateLabels,
  total,
  goalCurrent,
  goalScopeLabel,
  dataGoal,
  onEdit,
  onDelete,
  onFocusPoint,
  onDownloadCSV,
  candidateProfile,
}) => {
  const dataGoalValue = React.useMemo(() => {
    if (!dataGoal) return null;
    const numeric = Number(dataGoal.replace(/[^0-9]/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }, [dataGoal]);
  const dataGoalLabel = dataGoalValue
    ? dataGoalValue.toLocaleString("en-US")
    : dataGoal ?? "-";
  const currentTotal = typeof goalCurrent === "number" ? goalCurrent : total;
  const totalLabel = currentTotal.toLocaleString("en-US");
  const goalProgress = dataGoalValue ? (currentTotal / dataGoalValue) * 100 : 0;
  const goalProgressLabel = dataGoalValue
    ? `${Math.min(goalProgress, 100).toFixed(3)}%`
    : "-";

  return (
    <Card className="border-border/60 bg-card/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {candidateProfile ? (
            <div className="flex flex-wrap items-center gap-4">
              <img
                src={candidateProfile.image}
                alt={candidateProfile.name}
                className="h-20 w-20 rounded-3xl object-cover"
              />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  CANDIDATURA
                </p>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground [font-family:var(--font-display)]">
                    {candidateProfile.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {candidateProfile.party}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {candidateProfile.role} · {candidateProfile.number}
                  </p>
                </div>
              </div>
              {dataGoal ? (
                <div className="min-w-[260px] rounded-xl border border-border/60 bg-muted/20 px-5 py-4 transition-colors">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Objetivo de datos</span>
                    {goalScopeLabel ? (
                      <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-rose-600">
                        {goalScopeLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <p className="text-sm font-semibold text-foreground">
                      {totalLabel}/{dataGoalLabel}
                    </p>
                    <span className="text-xs font-semibold text-foreground">
                      {goalProgressLabel}
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-muted/40">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-lime-400 to-amber-400"
                      style={{ width: `${Math.min(goalProgress, 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onDownloadCSV} 
            disabled={rows.length === 0}
          >
            Descargar CSV
          </Button>
          <EventRecordsDialog
            rows={rows}
            title="Registros en campo"
            triggerLabel="Ver mas"
            candidateOptions={candidateLabels}
            onEdit={onEdit}
            onDelete={onDelete}
            onFocusPoint={onFocusPoint}
          />
        </div>
      </div>
    </Card>
  );
};

interface TotalStatsProps {
  total: number;
  rows: EventRecord[];
  candidateLabels: string[];
  onEdit: (record: EventRecord) => void;
  onDelete: (record: EventRecord) => void;
  onFocusPoint: (record: EventRecord) => void;
}

export const TotalStats: React.FC<TotalStatsProps> = ({
  total,
  rows,
  candidateLabels,
  onEdit,
  onDelete,
  onFocusPoint,
}) => {
  return (
    <Card className="border-border/60 bg-card/70 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Distribucion por candidato
        </p>
        <span className="text-xs text-muted-foreground">Total</span>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-3xl font-semibold text-foreground">{total}</p>
        <EventRecordsDialog
          rows={rows}
          title="Registros en campo"
          triggerLabel="Ver mas"
          candidateOptions={candidateLabels}
          onDelete={onDelete}
          onEdit={onEdit}
          onFocusPoint={onFocusPoint}
        />
      </div>
    </Card>
  );
};
