import type { UserRole } from "@/roles/permissions";
import { hasPermission } from "@/roles/permissions";
import { RoleOverviewCard } from "@/ui/management/RoleOverviewCard";
import { DataIngestionCard } from "@/ui/management/DataIngestionCard";
import { GeojsonCard } from "@/ui/management/GeojsonCard";
import { DashboardAdminCard } from "@/ui/management/DashboardAdminCard";
import { ClientListCard } from "@/ui/management/ClientListCard";
import { ConsultorManagementCard } from "@/ui/management/ConsultorManagementCard";
import { CalendarBoardCard } from "@/ui/management/CalendarBoardCard";
import { FileSystemCard } from "@/ui/management/FileSystemCard";
import { TaskBoardCard } from "@/ui/management/TaskBoardCard";

export const AdminConsole = ({ role }: { role: UserRole }) => {
  return (
    <div className="space-y-6">
      <section id="resumen">
        <RoleOverviewCard role={role} />
      </section>
      <section id="datos">
        <DataIngestionCard />
      </section>
      <section id="geojson">
        <GeojsonCard />
      </section>
      <section id="dashboards">
        <DashboardAdminCard />
      </section>
      <section id="clientes">
        <ClientListCard canAssignConsultor={hasPermission(role, "manageConsultors")} />
      </section>
      {hasPermission(role, "manageConsultors") ? (
        <section id="consultores">
          <ConsultorManagementCard />
        </section>
      ) : null}
      <section id="cronograma">
        <CalendarBoardCard />
      </section>
      <section id="tareas">
        <TaskBoardCard />
      </section>
      <section id="archivos">
        <FileSystemCard />
      </section>
    </div>
  );
};
