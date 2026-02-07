import * as React from "react";
import { Button } from "@/ui/primitives/button";

type MapHierarchyControlsProps = {
  breadcrumb: string[];
  canGoBack: boolean;
  onBack: () => void;
  onReset: () => void;
};

export const MapHierarchyControls = ({
  breadcrumb,
  canGoBack,
  onBack,
  onReset,
}: MapHierarchyControlsProps) => {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/80 p-3 text-xs shadow-sm backdrop-blur">
      <div className="flex flex-col gap-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Navegacion
        </span>
        <span className="text-xs font-semibold text-foreground">
          {breadcrumb.join(" / ")}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onBack} disabled={!canGoBack}>
          Volver
        </Button>
        <Button size="sm" variant="outline" onClick={onReset} disabled={!canGoBack}>
          Salir
        </Button>
      </div>
    </div>
  );
};
