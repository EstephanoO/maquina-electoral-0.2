"use client";

import type { ReactNode } from "react";
import { useSessionStore } from "@/stores/session.store";
import { UnauthorizedState } from "@/ui/shared/UnauthorizedState";

export const ConsoleAccessGate = ({ children }: { children: ReactNode }) => {
  const role = useSessionStore((state) => state.currentRole);
  if (role !== "SUPER_ADMIN" && role !== "CONSULTOR") {
    return <UnauthorizedState />;
  }
  return <>{children}</>;
};
