"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { users } from "@/db/constants";
import { useSessionStore } from "@/stores/session.store";
import { LoadingState } from "@/modules/shared/LoadingState";

const candidateRoutes: Record<string, string> = {
  "cand-rocio": "rocio",
  "cand-giovanna": "giovanna",
  "cand-guillermo": "guillermo",
};

const loginTargets: Record<string, string> = {
  guillermo: "user-guillermo",
  rocio: "user-rocio",
  giovanna: "user-giovanna",
  admin: "user-super",
};

export default function SessionSelectPage() {
  const router = useRouter();
  const [loginValue, setLoginValue] = React.useState("");
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const hasHydrated = useSessionStore((state) => state._hasHydrated);
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const currentRole = useSessionStore((state) => state.currentRole);
  const setUser = useSessionStore((state) => state.setUser);

  const activeUser = users.find((user) => user.id === currentUserId) ?? users[0];

  if (!hasHydrated) {
    return <LoadingState title="Cargando sesion" />;
  }

  const handleLogin = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const normalizedValue = loginValue.trim().toLowerCase();
    const targetUserId = loginTargets[normalizedValue];
    if (!targetUserId) {
      setLoginError("Usuario no valido. Usa guillermo, rocio, giovanna o admin.");
      return;
    }

    const nextUser = users.find((user) => user.id === targetUserId) ?? users[0];
    setUser(nextUser.id);
    setLoginError(null);

    if (nextUser.role === "SUPER_ADMIN") {
      router.push("/console/campaigns");
      return;
    }
    if (nextUser.role === "CONSULTOR") {
      router.push("/console");
      return;
    }
    const assignedCampaignId = nextUser.assignedCampaignIds[0] ?? "cand-guillermo";
    const candidateSlug = candidateRoutes[assignedCampaignId] ?? "guillermo";
    router.push(`/dashboard/${candidateSlug}`);
  };

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
          Escribe el usuario para acceder a la vista correspondiente.
        </p>
        <form className="mt-6 grid gap-4 md:grid-cols-1" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label
              htmlFor="session-user"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Usuario
            </label>
            <Input
              id="session-user"
              className="h-11"
              value={loginValue}
              onChange={(event) => {
                setLoginValue(event.target.value);
                if (loginError) {
                  setLoginError(null);
                }
              }}
              placeholder="Ingresa tu nombre/usuario"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={Boolean(loginError)}
            />
            {loginError ? (
              <p className="text-xs font-semibold text-destructive">{loginError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Sesion activa: {activeUser.name} · {currentRole}
            </p>
            <Button className="button-glow" type="submit">
              Entrar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
