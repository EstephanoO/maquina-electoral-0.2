"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { getInfoLoginEmail } from "@/info/auth";

type LoginState = "idle" | "loading" | "error";

export default function InfoLoginPage() {
  const router = useRouter();
  const [state, setState] = React.useState<LoginState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setError(null);

    const email = getInfoLoginEmail(username);
    if (!email) {
      setState("error");
      setError("Usuario no habilitado.");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setState("error");
        setError(
          payload.error === "Password too short"
            ? "La contrasena debe tener al menos 6 caracteres."
            : "Credenciales invalidas.",
        );
        return;
      }

      router.push("/info/dashboard");
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
            <span className="font-[var(--font-display)]">Acceso INFO</span>
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Operadoras habilitadas
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_25px_80px_rgba(16,35,61,0.18)]">
          <div className="flex items-center justify-center gap-3">
            <Badge className="border border-secondary/40 bg-secondary/20 text-secondary-foreground">
              Acceso
            </Badge>
            <p className="text-sm font-semibold text-foreground">Ingresa a INFO</p>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="space-y-2 text-left">
              <label
                htmlFor="info-user"
                className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400"
              >
                Usuario
              </label>
              <Input
                id="info-user"
                type="text"
                className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-secondary"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="dania"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <label
                htmlFor="info-password"
                className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400"
              >
                Contrasena
              </label>
              <Input
                id="info-password"
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
