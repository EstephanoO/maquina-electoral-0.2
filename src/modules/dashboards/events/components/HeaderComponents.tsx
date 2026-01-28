import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  EventRecordsDialog,
  type EventRecord,
} from "../EventRecordsDialog";

interface DashboardHeaderProps {
  eventTitle: string;
  eventSubtitle: string;
  lastUpdated: Date | null;
  rows: EventRecord[];
  candidateLabels: string[];
  total: number;
  onEdit: (record: EventRecord) => void;
  onDelete: (record: EventRecord) => void;
  onFocusPoint: (record: EventRecord) => void;
  onDownloadCSV: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  eventTitle,
  eventSubtitle,
  lastUpdated,
  rows,
  candidateLabels,
  total,
  onEdit,
  onDelete,
  onFocusPoint,
  onDownloadCSV,
}) => {
  return (
    <Card className="border-border/60 bg-card/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Evento en tierra
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{eventTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{eventSubtitle}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              Ultima actualizacion: {lastUpdated ? lastUpdated.toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              }) : "-"}
            </span>
          </div>
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