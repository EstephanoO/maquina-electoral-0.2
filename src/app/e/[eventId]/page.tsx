"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormsStore } from "@/modules/events/forms.store";
import { useResponsesStore } from "@/modules/events/responses.store";
import type { FormField } from "@/lib/types";
import { EmptyState } from "@/modules/shared/EmptyState";
import { toast } from "sonner";

const cooldownMs = 10000;

export default function InterviewerPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const forms = useFormsStore((state) => state.forms);
  const form = React.useMemo(
    () => forms.find((item) => item.eventId === eventId),
    [eventId, forms],
  );
  const submitResponse = useResponsesStore((state) => state.submitResponse);
  const [answers, setAnswers] = React.useState<Record<string, string | number>>({});
  const [gps, setGps] = React.useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [cooldownUntil, setCooldownUntil] = React.useState<number>(0);
  const [isCooldownActive, setIsCooldownActive] = React.useState(false);

  const handleChange = (field: FormField, value: string) => {
    setAnswers((prev) => ({ ...prev, [field.id]: value }));
  };

  const handleGps = () => {
    const next = {
      lat: -34.6 + Math.random() * 0.2,
      lng: -58.4 + Math.random() * 0.2,
      accuracy: Math.floor(10 + Math.random() * 20),
    };
    setGps(next);
    toast.success("GPS simulado capturado");
  };

  const handleSubmit = () => {
    if (!form) {
      return;
    }
    if (Date.now() < cooldownUntil) {
      toast.error("Espera antes de enviar otra respuesta");
      return;
    }

    const missing = form.fields.filter((field) => field.required && !answers[field.id]);
    if (missing.length > 0) {
      toast.error("Completa los campos requeridos");
      return;
    }

    submitResponse({
      eventId,
      answers,
      location: gps ?? undefined,
    });
    setAnswers({});
    setGps(null);
    setCooldownUntil(Date.now() + cooldownMs);
    toast.success("Respuesta guardada");
  };

  React.useEffect(() => {
    if (!cooldownUntil) {
      setIsCooldownActive(false);
      return;
    }
    const remaining = cooldownUntil - Date.now();
    if (remaining <= 0) {
      setIsCooldownActive(false);
      return;
    }
    setIsCooldownActive(true);
    const timer = setTimeout(() => setIsCooldownActive(false), remaining);
    return () => clearTimeout(timer);
  }, [cooldownUntil]);

  if (!form) {
    return (
      <div className="auth-shell flex min-h-screen items-center justify-center px-6">
        <EmptyState
          title="Formulario no disponible"
          description="No hay schema para este evento."
        />
      </div>
    );
  }

  return (
    <div className="auth-shell min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="panel fade-rise card-hover p-6 stagger-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Captura
              </p>
              <h1 className="text-2xl font-semibold text-foreground">Evento {eventId}</h1>
            </div>
            <Badge className="bg-secondary text-secondary-foreground">Offline mode</Badge>
          </div>
        </Card>

        <Card className="panel fade-rise card-hover p-6 stagger-2">
          <div className="space-y-4">
            {form.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label
                  htmlFor={`field-${field.id}`}
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={`field-${field.id}`}
                    value={String(answers[field.id] ?? "")}
                    onChange={(event) => handleChange(field, event.target.value)}
                  />
                ) : null}
                {field.type === "select" || field.type === "radio" ? (
                  <Select
                    value={String(answers[field.id] ?? "")}
                    onValueChange={(value) => handleChange(field, value)}
                  >
                    <SelectTrigger id={`field-${field.id}`}>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {field.type === "text" || field.type === "number" ? (
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    id={`field-${field.id}`}
                    value={String(answers[field.id] ?? "")}
                    onChange={(event) => handleChange(field, event.target.value)}
                  />
                ) : null}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={handleGps}>
                Obtener GPS
              </Button>
              {gps ? (
                <span className="text-xs text-muted-foreground">
                  {gps.lat.toFixed(3)}, {gps.lng.toFixed(3)} (±{gps.accuracy}m)
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button className="button-glow" onClick={handleSubmit}>
                Enviar respuesta
              </Button>
              <Button variant="ghost">Finalizar</Button>
              {isCooldownActive ? (
                <Badge variant="outline">Cooldown activo</Badge>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
