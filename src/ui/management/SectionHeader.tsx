import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export const SectionHeader = ({
  eyebrow,
  title,
  tag,
  actions,
}: {
  eyebrow: string;
  title: string;
  tag?: string;
  actions?: ReactNode;
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </p>
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {tag ? <Badge variant="outline">{tag}</Badge> : null}
        </div>
      </div>
      {actions}
    </div>
  );
};
