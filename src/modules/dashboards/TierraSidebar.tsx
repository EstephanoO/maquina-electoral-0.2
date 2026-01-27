import { cn } from "@/lib/utils";

export const TierraSidebar = ({ className }: { className?: string }) => {
  return (
    <aside className={cn("space-y-3", className)} />
  );
};
