import { Badge } from "@/components/ui/badge";

export const ManagementHeader = ({
  title,
  userName,
  roleLabel,
}: {
  title: string;
  userName: string;
  roleLabel: string;
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-card/40 px-6 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          MAQUINA-ELECTORAL
        </p>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <Badge className="bg-secondary text-secondary-foreground">Online</Badge>
      </div>
    </div>
  );
};
