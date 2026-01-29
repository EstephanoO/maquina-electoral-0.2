"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { campaigns } from "@/db/constants";
import { RoleGate } from "@/modules/shared/RoleGate";
import { ClientDashboardConfigCard } from "@/modules/console/ClientDashboardConfigCard";

export default function AdminPage() {
  return (
    <RoleGate action="admin" subject="admin">
      <div className="space-y-6">
        <ClientDashboardConfigCard />
        <Card className="panel fade-rise card-hover p-6 stagger-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Configuracion
          </p>
          <h2 className="text-2xl font-semibold text-foreground">Disenadores</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { label: "Disenadores activos", value: "2" },
              { label: "Solicitudes", value: "4" },
              { label: "Espacios", value: "3" },
            ].map((item) => (
              <Card
                key={item.label}
                className={`border-border/60 bg-background/70 p-4 shadow-sm fade-rise card-hover ${item.label === "Disenadores activos" ? "stagger-1" : item.label === "Solicitudes" ? "stagger-2" : "stagger-3"}`}
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-semibold text-foreground">{item.value}</p>
              </Card>
            ))}
          </div>
        </Card>
        <Card className="panel fade-rise card-hover p-6 stagger-2">
          <p className="text-sm font-semibold text-foreground">Equipo creativo</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disenador</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Campanas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: "Rocio Mena", status: "Activo" },
                { name: "Mateo Diaz", status: "Pendiente" },
                { name: "Equipo interno", status: "Activo" },
              ].map((designer) => (
                <TableRow key={designer.name}>
                  <TableCell>{designer.name}</TableCell>
                  <TableCell>{designer.status}</TableCell>
                  <TableCell>{campaigns.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </RoleGate>
  );
}
