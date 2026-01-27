"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FormField, FormFieldType, FormSchema } from "@/lib/types";
import { createId } from "@/db/mock-helpers";
import { useFormsStore } from "@/modules/events/forms.store";
import { RoleGate } from "@/modules/shared/RoleGate";
import { toast } from "sonner";

const fieldPalette: { type: FormFieldType; label: string }[] = [
  { type: "location", label: "Ubicacion" },
  { type: "text", label: "Texto" },
  { type: "number", label: "Numero" },
  { type: "radio", label: "Radio" },
  { type: "checkbox", label: "Checkbox" },
  { type: "select", label: "Select" },
  { type: "textarea", label: "Textarea" },
];

const defaultField = (type: FormFieldType): FormField => ({
  id: createId("field"),
  type,
  label: type === "location" ? "Ubicacion" : "Nuevo campo",
  required: type === "location",
  options: ["Opcion 1", "Opcion 2"],
});

export default function EventFormBuilderPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const forms = useFormsStore((state) => state.forms);
  const formFromStore = React.useMemo(
    () => forms.find((form) => form.eventId === eventId),
    [eventId, forms],
  );
  const saveFormSchema = useFormsStore((state) => state.saveFormSchema);
  const [fields, setFields] = React.useState<FormField[]>(
    formFromStore?.fields ?? [],
  );
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(
    fields[0]?.id ?? null,
  );

  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? null;

  const addField = (type: FormFieldType) => {
    const newField = defaultField(type);
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (updates: Partial<FormField>) => {
    if (!selectedField) return;
    setFields((prev) =>
      prev.map((field) =>
        field.id === selectedField.id ? { ...field, ...updates } : field,
      ),
    );
  };

  const removeField = () => {
    if (!selectedField) return;
    const remaining = fields.filter((field) => field.id !== selectedField.id);
    setFields(remaining);
    setSelectedFieldId(remaining[0]?.id ?? null);
  };

  const handleSave = () => {
    const schema: FormSchema = {
      eventId,
      fields,
      updatedAt: new Date().toISOString(),
    };
    saveFormSchema(schema);
    toast.success("Formulario guardado");
  };

  return (
    <RoleGate action="manage" subject="form">
      <div className="space-y-6">
        <Card className="panel fade-rise card-hover p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Form Builder
              </p>
              <h2 className="text-2xl font-semibold text-foreground">Schema del evento</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{fields.length} campos</Badge>
              <Button className="button-glow" onClick={handleSave}>
                Guardar
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
          <Card className="panel fade-rise card-hover p-4 stagger-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Field palette
            </p>
            <div className="mt-4 space-y-2">
              {fieldPalette.map((field) => (
                <Button
                  key={field.type}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addField(field.type)}
                >
                  {field.label}
                </Button>
              ))}
            </div>
          </Card>
          <Card className="panel fade-rise card-hover p-4 stagger-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Campos
            </p>
            <div className="mt-4 space-y-3">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin campos</p>
              ) : (
                fields.map((field) => (
                  <button
                    key={field.id}
                    className={`w-full rounded-xl border border-border/60 p-3 text-left text-sm ${
                      selectedFieldId === field.id
                        ? "bg-primary/10"
                        : "bg-background/60"
                    }`}
                    onClick={() => setSelectedFieldId(field.id)}
                    type="button"
                  >
                    {field.label}
                  </button>
                ))
              )}
            </div>
          </Card>
          <Card className="panel fade-rise card-hover p-4 stagger-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Editor
            </p>
            {selectedField ? (
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <label
                    htmlFor="field-label"
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Label
                  </label>
                  <Input
                    id="field-label"
                    value={selectedField.label}
                    onChange={(event) => updateField({ label: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="field-type"
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Tipo
                  </label>
                  <Select
                    value={selectedField.type}
                    onValueChange={(value) => updateField({ type: value as FormFieldType })}
                  >
                    <SelectTrigger id="field-type">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldPalette.map((field) => (
                        <SelectItem key={field.type} value={field.type}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="field-required"
                    checked={selectedField.required}
                    onCheckedChange={(value) => updateField({ required: Boolean(value) })}
                  />
                  <label htmlFor="field-required" className="text-sm">
                    Requerido
                  </label>
                </div>
                {selectedField.type === "location" ? (
                  <p className="text-xs text-muted-foreground">
                    Captura coordenadas de ubicacion y es requerido.
                  </p>
                ) : null}
                {selectedField.type === "radio" || selectedField.type === "select" ? (
                  <Textarea
                    value={selectedField.options?.join("\n") ?? ""}
                    onChange={(event) =>
                      updateField({ options: event.target.value.split("\n") })
                    }
                    placeholder="Opciones (una por linea)"
                  />
                ) : null}
                <Button variant="outline" onClick={removeField}>
                  Eliminar campo
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Selecciona un campo</p>
            )}
          </Card>
        </div>
        <Card className="panel fade-rise card-hover p-4 stagger-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          <div className="mt-4 space-y-3">
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin campos para previsualizar.</p>
            ) : (
              fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{field.label}</p>
                  <p className="text-xs text-muted-foreground">Tipo: {field.type}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </RoleGate>
  );
}
