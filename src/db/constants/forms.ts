import type { FormSchema } from "@/lib/types";

export const forms: FormSchema[] = [
  {
    eventId: "event-rocio-01",
    updatedAt: "2026-01-18T10:20:00Z",
    fields: [
      {
        id: "field-location",
        type: "location",
        label: "Ubicacion",
        required: true,
      },
      {
        id: "field-name",
        type: "text",
        label: "Nombre del entrevistado",
        required: true,
      },
      {
        id: "field-age",
        type: "number",
        label: "Edad",
        required: true,
      },
      {
        id: "field-intent",
        type: "radio",
        label: "Intencion de voto",
        required: true,
        options: ["Alta", "Media", "Baja"],
      },
    ],
  },
  {
    eventId: "event-giovanna-01",
    updatedAt: "2026-01-20T08:15:00Z",
    fields: [
      {
        id: "field-location",
        type: "location",
        label: "Ubicacion",
        required: true,
      },
      {
        id: "field-neighborhood",
        type: "text",
        label: "Barrio",
        required: true,
      },
      {
        id: "field-main-topic",
        type: "select",
        label: "Tema principal",
        required: true,
        options: ["Seguridad", "Transporte", "Salud", "Educacion"],
      },
      {
        id: "field-notes",
        type: "textarea",
        label: "Notas",
        required: false,
      },
    ],
  },
];
