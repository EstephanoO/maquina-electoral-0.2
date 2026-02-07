"use client";

import { Button } from "@/ui/primitives/button";
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
      <div className="flex items-center gap-3">
        <img
          src="/isotipo(2).jpg"
          alt="GOBERNA"
          className="h-8 w-8 rounded-full border border-border/60 bg-white"
        />
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-primary">
            GOBERNA
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Consola admin
          </p>
        </div>
      </div>
      <Button variant="ghost" className="text-xs" onClick={handleLogout}>
        Salir
      </Button>
    </header>
  );
};
