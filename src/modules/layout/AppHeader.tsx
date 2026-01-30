"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session.store";
import { logout } from "@/lib/auth/logout";

export const AppHeader = () => {
  const router = useRouter();
  const setSessionUser = useSessionStore((state) => state.setSessionUser);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setSessionUser(null);
      router.replace("/login");
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-border/60 bg-card/40 px-6 py-3 backdrop-blur">
      <Button variant="ghost" className="text-xs" onClick={handleLogout}>
        Salir
      </Button>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        Consola admin
      </p>
    </header>
  );
};
