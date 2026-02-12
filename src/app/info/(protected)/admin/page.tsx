"use client";

import * as React from "react";
import useSWR from "swr";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import { Input } from "@/ui/primitives/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/primitives/table";
import { INFO_EMAIL_DOMAIN } from "@/info/auth";

type SessionPayload = {
  user: null | {
    id: string;
    email: string;
    name: string;
    role: "admin" | "candidato";
  };
};

type InfoUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  hasPassword: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type UsersResponse = {
  users: InfoUser[];
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error al cargar");
  return response.json();
};

export default function InfoAdminPage() {
  const { data: sessionData } = useSWR<SessionPayload>("/api/auth/me", fetcher);
  const isAdmin = sessionData?.user?.role === "admin";
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<UsersResponse>(isAdmin ? "/api/info/users" : null, fetcher);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/info/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "No se pudo crear el usuario.");
      }
      setName("");
      setEmail("");
      setMessage("Operadora creada. Debe definir su contrasena al ingresar.");
      await mutate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (userId: string) => {
    if (saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/info/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error("No se pudo resetear la contrasena.");
      setMessage("Contrasena reiniciada. Se pedira una nueva al ingresar.");
      await mutate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,57,96,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,200,0,0.12),_transparent_55%)] text-foreground">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 md:px-6">
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="heading-display text-xl">Acceso restringido</CardTitle>
              <CardDescription>Solo administracion INFO.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,57,96,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,200,0,0.12),_transparent_55%)] text-foreground">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 md:px-6">
        <header className="panel-elevated fade-rise rounded-3xl border border-border/60 px-5 py-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Administracion INFO
              </p>
              <h1 className="heading-display text-2xl font-semibold text-foreground md:text-3xl">
                Operadoras y accesos
              </h1>
              <p className="text-sm text-muted-foreground">
                Crea operadoras y resetea contrasenas cuando sea necesario.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="panel border border-border/70">
            <CardHeader>
              <CardTitle className="heading-display text-xl">Listado</CardTitle>
              <CardDescription>Usuarios INFO registrados.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : error ? (
                <p className="text-sm text-red-500">{String(error)}</p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/60">
                  <Table>
                    <TableHeader className="bg-card/80">
                      <TableRow>
                        <TableHead>Operadora</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.users ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-sm">
                            Sin operadoras.
                          </TableCell>
                        </TableRow>
                      ) : (
                        (data?.users ?? []).map((user) => (
                          <TableRow key={user.id} className="border-border/60">
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  user.hasPassword
                                    ? "border-emerald-500/40 text-emerald-600"
                                    : "border-border/60 text-muted-foreground"
                                }
                              >
                                {user.hasPassword ? "Activa" : "Sin contrasena"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                className="h-9 rounded-full"
                                onClick={() => handleReset(user.id)}
                                disabled={saving}
                              >
                                Reset clave
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="panel border border-border/70">
            <CardHeader>
              <CardTitle className="heading-display text-xl">Nueva operadora</CardTitle>
              <CardDescription>Dominio obligatorio @{INFO_EMAIL_DOMAIN}.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <label
                    htmlFor="info-name"
                    className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Nombre
                  </label>
                  <Input
                    id="info-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="info-email"
                    className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Correo
                  </label>
                  <Input
                    id="info-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={`operadora@${INFO_EMAIL_DOMAIN}`}
                    required
                  />
                </div>
                <Button type="submit" disabled={saving} className="rounded-full">
                  {saving ? "Guardando..." : "Crear operadora"}
                </Button>
                {message ? (
                  <p className="text-xs font-semibold text-muted-foreground">{message}</p>
                ) : null}
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
