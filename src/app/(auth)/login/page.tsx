"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      router.push(`/dashboard/${slug ?? "guillermo"}`);
    } catch (err) {
      setState("error");
      setError("Error de conexion.");
    } finally {
      setState("idle");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05070d] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(10,32,78,0.62),_rgba(5,7,13,0.96))]" />
        <div className="absolute inset-0 opacity-60" style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(212,175,55,0.08), rgba(11,19,35,0.0) 45%), linear-gradient(180deg, rgba(10,18,35,0.0), rgba(5,7,13,1))",
        }} />
        <div className="absolute -right-32 top-16 h-64 w-64 rounded-full bg-[#1b2d57] opacity-35 blur-[120px]" />
        <div className="absolute -left-32 bottom-6 h-64 w-64 rounded-full bg-[#3a2a09] opacity-25 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8">
          <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[#d5b153]">GOBERNA</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-100 md:text-5xl">
            <span className="font-[var(--font-fraunces)]">MAQUINA ELECTORAL</span>
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-400">
            Powered by Goberna
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-[#222a3c] bg-[#0a0f1a]/70 p-8 shadow-[0_25px_80px_rgba(3,6,12,0.6)]">
          <div className="flex items-center justify-center gap-3">
            <Badge className="border border-[#e1c16e]/30 bg-[#e1c16e]/10 text-[#f5d47b]">Acceso</Badge>
            <p className="text-sm font-semibold text-slate-100">Ingresa al sistema</p>
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
                className="h-11 border-[#2a3245] bg-[#070b14] text-slate-100 placeholder:text-slate-600 focus-visible:ring-[#e1c16e]"
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
                className="h-11 border-[#2a3245] bg-[#070b14] text-slate-100 placeholder:text-slate-600 focus-visible:ring-[#e1c16e]"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ingresar contrasena"
                required
              />
              {error ? <p className="text-xs font-semibold text-[#f3c16d]">{error}</p> : null}
            </div>
            <Button
              className="button-glow mt-2 w-full bg-gradient-to-r from-[#f6d47b] via-[#d8a94b] to-[#b3822a] text-[0.9rem] font-semibold text-[#12151d] shadow-[0_12px_30px_rgba(217,167,70,0.35)] hover:opacity-90"
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
