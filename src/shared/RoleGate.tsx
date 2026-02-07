"use client";

import type { ReactNode } from "react";
import type { Action, Subject } from "@/lib/rbac";
import { can } from "@/lib/rbac";
import { useSessionStore } from "@/stores/session.store";
import { UnauthorizedState } from "@/ui/shared/UnauthorizedState";

export const RoleGate = ({
  action,
  subject,
  children,
}: {
  action: Action;
  subject: Subject;
  children: ReactNode;
}) => {
  const role = useSessionStore((state) => state.currentRole);
  if (!can(action, subject, role)) {
    return <UnauthorizedState />;
  }
  return <>{children}</>;
};
