import * as React from "react";
import { Card } from "@/components/ui/card";
import {
  EventRecordsDialog,
  type EventRecord,
} from "../EventRecordsDialog";
import { EyeToggleButton } from "./EyeToggleButton";

interface CandidateDistributionProps {
  candidateLabels: string[];
  counts: Record<string, number>;
  total: number;
  rows: EventRecord[];
  onEdit: (record: EventRecord) => void;
  onDelete: (record: EventRecord) => void;
  onFocusPoint: (record: EventRecord) => void;
  hiddenCandidates: Set<string>;
  onToggleCandidateVisibility: (candidate: string) => void;
}

export const CandidateDistribution: React.FC<CandidateDistributionProps> = ({
  candidateLabels,
  counts,
  total,
  rows,
  onEdit,
  onDelete,
  onFocusPoint,
  hiddenCandidates,
  onToggleCandidateVisibility,
}) => {
  return (
    <Card className="border-border/60 bg-card/70 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Distribucion por candidato
        </p>
        <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          En tiempo real
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/70 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Total
            </p>
            <span className="text-xs text-muted-foreground">100%</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{total}</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted/40">
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-amber-400/70 via-sky-400/70 to-emerald-400/70" />
          </div>
        </Card>
        {candidateLabels.map((candidate, index) => {
          const totalCandidate = counts[candidate] ?? 0;
          const percent = total > 0 ? Math.round((totalCandidate / total) * 100) : 0;
          const color = index === 0 ? "bg-emerald-500" : index === 1 ? "bg-blue-500" : "bg-orange-500";
          const dot = index === 0 ? "bg-emerald-500" : index === 1 ? "bg-blue-500" : "bg-orange-500";
          return (
            <Card key={candidate} className="border-border/60 bg-card/70 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {candidate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{percent}%</span>
                  <EyeToggleButton
                    candidate={candidate}
                    isHidden={hiddenCandidates.has(candidate)}
                    onToggle={onToggleCandidateVisibility}
                  />
                </div>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-semibold text-foreground">{totalCandidate}</p>
                <EventRecordsDialog
                  rows={rows}
                  title="Registros en campo"
                  triggerLabel="Ver"
                  filterCandidate={candidate}
                  candidateOptions={candidateLabels}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onFocusPoint={onFocusPoint}
                />
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                <div className={`h-1.5 ${color}`} style={{ width: `${percent}%` }} />
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
};