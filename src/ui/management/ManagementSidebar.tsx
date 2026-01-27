import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasPermission, type PermissionKey, type UserRole } from "@/roles/permissions";

const sections: { label: string; href: string; permission?: PermissionKey }[] = [
  { label: "Resumen", href: "#resumen" },
  { label: "Datos", href: "#datos", permission: "manageDataUploads" },
  { label: "GeoJSON", href: "#geojson", permission: "manageGeojson" },
  { label: "Dashboards", href: "#dashboards", permission: "manageDashboards" },
  { label: "Clientes", href: "#clientes", permission: "manageClients" },
  { label: "Consultores", href: "#consultores", permission: "manageConsultors" },
  { label: "Cronograma", href: "#cronograma", permission: "manageTasks" },
  { label: "Tareas", href: "#tareas", permission: "manageTasks" },
  { label: "Archivos", href: "#archivos", permission: "manageFileSystem" },
];

export const ManagementSidebar = ({
  title,
  role,
}: {
  title: string;
  role: UserRole;
}) => {
  const visibleSections = sections.filter((section) =>
    section.permission ? hasPermission(role, section.permission) : true,
  );

  return (
    <aside className="space-y-4">
      <Card className="border-border/60 bg-card/70 p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Consola
          </p>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Badge className="w-fit bg-secondary text-secondary-foreground">
            Multi cliente
          </Badge>
        </div>
      </Card>
      <Card className="border-border/60 bg-card/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Secciones
        </p>
        <div className="mt-4 space-y-2">
          {visibleSections.map((section) => (
            <Button
              key={section.label}
              variant="ghost"
              className="w-full justify-start text-sm"
              asChild
            >
              <Link href={section.href}>{section.label}</Link>
            </Button>
          ))}
        </div>
      </Card>
    </aside>
  );
};
