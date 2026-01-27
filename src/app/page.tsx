"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { users } from "@/db/constants";
import { useSessionStore } from "@/stores/session.store";
import { LoadingState } from "@/modules/shared/LoadingState";

const candidateRoutes: Record<string, string> = {
  "cand-rocio": "rocio",
  "cand-giovanna": "giovanna",
  "cand-guillermo": "guillermo",
};

export default function SessionSelectPage() {
  const router = useRouter();
  const hasHydrated = useSessionStore((state) => state._hasHydrated);
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const currentRole = useSessionStore((state) => state.currentRole);
  const activeCampaignId = useSessionStore((state) => state.activeCampaignId);
  const setUser = useSessionStore((state) => state.setUser);

  const activeUser = users.find((user) => user.id === currentUserId) ?? users[0];

  if (!hasHydrated) {
    return <LoadingState title="Cargando sesion" />;
  }

  return (
    <div className="auth-shell flex min-h-screen items-center justify-center px-6">
      <Card className="panel-elevated fade-rise card-hover w-full max-w-xl p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              GOBERNA
            </p>
            <h1 className="heading-display text-3xl font-semibold text-foreground">
              Ingresar al sistema
            </h1>
          </div>
          <Badge className="bg-secondary text-secondary-foreground">
            MVP UI
          </Badge>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Selecciona el perfil para acceder a la vista correspondiente.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-1">
          <div className="space-y-2">
            <label
              htmlFor="session-user"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Usuario / Perfil
            </label>
            <Select value={currentUserId} onValueChange={setUser}>
              <SelectTrigger id="session-user" className="h-11">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Sesion activa: {activeUser.name} · {currentRole}
          </p>
          <Button
            className="button-glow"
            onClick={() => {
              if (currentRole === "SUPER_ADMIN") {
                router.push("/console/admin");
                return;
              }
              if (currentRole === "CONSULTOR") {
                router.push("/console");
                return;
              }
              const candidateSlug = candidateRoutes[activeCampaignId] ?? "guillermo";
              router.push(`/dashboard/${candidateSlug}`);
            }}
          >
            Entrar
          </Button>
        </div>
      </Card>
    </div>
  );
}
