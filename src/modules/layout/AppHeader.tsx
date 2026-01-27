import Link from "next/link";
import { Button } from "@/components/ui/button";

export const AppHeader = () => {
  return (
    <header className="flex items-center justify-between border-b border-border/60 bg-card/40 px-6 py-3 backdrop-blur">
      <Button variant="ghost" className="text-xs" asChild>
        <Link href="/login">Salir</Link>
      </Button>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        Consola admin
      </p>
    </header>
  );
};
