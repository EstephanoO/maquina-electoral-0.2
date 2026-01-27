import type { ResponseRecord } from "@/lib/types";

export const responses: ResponseRecord[] = [
  {
    id: "resp-rocio-01",
    eventId: "event-rocio-01",
    submittedAt: "2026-01-19T09:12:00Z",
    answers: {
      "field-name": "Maria Gonzalez",
      "field-age": 38,
      "field-intent": "Alta",
    },
    location: { lat: -34.6037, lng: -58.3816, accuracy: 12 },
  },
  {
    id: "resp-rocio-02",
    eventId: "event-rocio-01",
    submittedAt: "2026-01-19T09:24:00Z",
    answers: {
      "field-name": "Javier Paz",
      "field-age": 52,
      "field-intent": "Media",
    },
    location: { lat: -34.61, lng: -58.39, accuracy: 20 },
  },
  {
    id: "resp-giovanna-01",
    eventId: "event-giovanna-01",
    submittedAt: "2026-01-20T10:05:00Z",
    answers: {
      "field-neighborhood": "San Miguel",
      "field-main-topic": "Salud",
      "field-notes": "Solicitan mas centros medicos.",
    },
    location: { lat: -31.4135, lng: -64.1811, accuracy: 25 },
  },
];
