import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoleGate } from "@/modules/shared/RoleGate";

export default function ConsoleOverviewPage() {
  return (
    <RoleGate action="manage" subject="campaign">
      <div className="space-y-6">
        <Card className="panel fade-rise card-hover p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Overview
          </p>
          <h2 className="heading-display text-2xl font-semibold text-foreground">
            Evento 28 de enero
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Salida de campo con los tres candidatos activos.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/eventos/28-enero">Entrar</Link>
            </Button>
          </div>
        </Card>
      </div>
    </RoleGate>
  );
}
