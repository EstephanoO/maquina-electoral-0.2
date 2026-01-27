import type { ReactNode } from "react";
import { ManagementSidebar } from "@/ui/management/ManagementSidebar";
import { ManagementHeader } from "@/ui/management/ManagementHeader";
import type { UserRole } from "@/roles/permissions";

export const ManagementShell = ({
  title,
  userName,
  roleLabel,
  role,
  children,
}: {
  title: string;
  userName: string;
  roleLabel: string;
  role: UserRole;
  children: ReactNode;
}) => {
  return (
    <div className="min-h-screen">
      <ManagementHeader title={title} userName={userName} roleLabel={roleLabel} />
      <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="border-r border-border/60 bg-card/30 px-5 py-6">
          <ManagementSidebar title={title} role={role} />
        </div>
        <div className="space-y-6 px-6 py-6">{children}</div>
      </div>
    </div>
  );
};
