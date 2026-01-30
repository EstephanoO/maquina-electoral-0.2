"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/stores/session.store";

type LoginState = "idle" | "loading" | "error";

const campaignToSlug: Record<string, string> = {
  "cand-rocio": "rocio",
  "cand-giovanna": "giovanna",
  "cand-guillermo": "guillermo",
};

export default function LoginPage() {
  const router = useRouter();
  const setSessionUser = useSessionStore((state) => state.setSessionUser);
  const [state, setState] = React.useState<LoginState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setState("error");
        setError("Credenciales invalidas.");
        return;
      }

      const meResponse = await fetch("/api/auth/me");
      const payload = (await meResponse.json()) as { user: null | {
        id: string;
        email: string;
        name: string;
        role: "admin" | "candidato";
        campaignId: string | null;
        assignedCampaignIds: string[];
      } };

      if (!payload.user) {
        setState("error");
        setError("No se pudo iniciar sesion.");
        return;
      }

      setSessionUser(payload.user);
      if (payload.user.role === "admin") {
        router.push("/console/campaigns");
        return;
      }
      const campaignId = payload.user.campaignId ?? payload.user.assignedCampaignIds[0];
      const slug = campaignId ? campaignToSlug[campaignId] : "guillermo";
      router.push(`/dashboard/${slug ?? "guillermo"}`);
    } catch (err) {
      setState("error");
      setError("Error de conexion.");
    } finally {
      setState("idle");
    }
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
          <Badge className="bg-secondary text-secondary-foreground">Acceso seguro</Badge>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Usa tu correo y contrasena asignada para entrar.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Correo
            </label>
            <Input
              id="login-email"
              type="email"
              className="h-11"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
              }}
              placeholder="correo@campana.pe"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Contrasena
            </label>
            <Input
              id="login-password"
              type="password"
              className="h-11"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Ingresar contrasena"
              required
            />
            {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Acceso limitado a roles autorizados.
            </p>
            <Button className="button-glow" type="submit" disabled={state === "loading"}>
              {state === "loading" ? "Ingresando..." : "Entrar"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
