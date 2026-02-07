"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
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
      const payload = (await meResponse.json()) as {
        user: null | {
          id: string;
          email: string;
          name: string;
          role: "admin" | "candidato";
          campaignId: string | null;
          assignedCampaignIds: string[];
        };
      };

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
      router.push(`/dashboard/${slug ?? "guillermo"}/tierra`);
    } catch (err) {
      setState("error");
      setError("Error de conexion.");
    } finally {
      setState("idle");
    }
  };

  return (
    <div className="auth-shell relative min-h-screen w-full overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,57,96,0.28),_rgba(244,247,251,0.96))]" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(255,200,0,0.12), rgba(22,57,96,0.0) 45%), linear-gradient(180deg, rgba(255,255,255,0.0), rgba(244,247,251,1))",
          }}
        />
        <div className="absolute -right-32 top-16 h-64 w-64 rounded-full bg-[#163960] opacity-20 blur-[140px]" />
        <div className="absolute -left-32 bottom-6 h-64 w-64 rounded-full bg-[#ffc800] opacity-15 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 flex flex-col items-center">
          <img
            src="/isotipo(2).jpg"
            alt="GOBERNA"
            className="h-12 w-12 rounded-full border border-border/60 bg-white"
          />
          <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.5em] text-primary">
            GOBERNA
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            <span className="font-[var(--font-display)]">MAQUINA ELECTORAL</span>
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Powered by GOBERNA
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_25px_80px_rgba(16,35,61,0.18)]">
          <div className="flex items-center justify-center gap-3">
            <Badge className="border border-secondary/40 bg-secondary/20 text-secondary-foreground">
              Acceso
            </Badge>
            <p className="text-sm font-semibold text-foreground">Ingresa al sistema</p>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="space-y-2 text-left">
              <label
                htmlFor="login-email"
                className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400"
              >
                Correo
              </label>
              <Input
                id="login-email"
                type="email"
                className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-secondary"
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
            <div className="space-y-2 text-left">
              <label
                htmlFor="login-password"
                className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400"
              >
                Contrasena
              </label>
              <Input
                id="login-password"
                type="password"
                className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-secondary"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ingresar contrasena"
                required
              />
              {error ? <p className="text-xs font-semibold text-secondary">{error}</p> : null}
            </div>
            <Button
              className="button-glow mt-2 w-full bg-primary text-[0.9rem] font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(22,57,96,0.25)] hover:opacity-95"
              type="submit"
              disabled={state === "loading"}
            >
              {state === "loading" ? "Ingresando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
