import Link from "next/link";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { RoleGate } from "@/shared/RoleGate";

export default function ConsoleOverviewPage() {
  return (
    <RoleGate action="manage" subject="campaign">
      <div className="space-y-6">
        <Card className="panel fade-rise card-hover p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Overview
          </p>
          <h2 className="heading-display text-2xl font-semibold text-foreground">
            Gestion de campanas
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acceso directo a configuraciones y dashboards.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/console/campaigns">Entrar</Link>
            </Button>
          </div>
        </Card>
      </div>
    </RoleGate>
  );
}
