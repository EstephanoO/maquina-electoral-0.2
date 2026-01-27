import { create } from "zustand";
import type { ResponseRecord } from "@/lib/types";
import { responses as seedResponses } from "@/db/constants";
import { createId } from "@/db/mock-helpers";

type ResponseSummary = {
  total: number;
  coverage: number;
  quality: number;
  pace: number;
};

type ResponsesState = {
  responses: ResponseRecord[];
};

type ResponsesActions = {
  submitResponse: (response: Omit<ResponseRecord, "id" | "submittedAt">) => void;
  getSummaryByEvent: (eventId: string) => ResponseSummary;
  getPointsByEvent: (eventId: string) => ResponseRecord[];
  getPointsByCampaign: (eventIds: string[]) => ResponseRecord[];
};

export const useResponsesStore = create<ResponsesState & ResponsesActions>()(
  (set, get) => ({
    responses: seedResponses,
    submitResponse: (response) =>
      set((state) => ({
        responses: [
          ...state.responses,
          {
            ...response,
            id: createId("resp"),
            submittedAt: new Date().toISOString(),
          },
        ],
      })),
    getSummaryByEvent: (eventId) => {
      const entries = get().responses.filter((item) => item.eventId === eventId);
      const total = entries.length;
      return {
        total,
        coverage: Math.min(100, total * 4),
        quality: Math.min(100, 60 + total * 2),
        pace: Math.min(100, 40 + total * 3),
      };
    },
    getPointsByEvent: (eventId) =>
      get().responses.filter((item) => item.eventId === eventId),
    getPointsByCampaign: (eventIds) =>
      get().responses.filter((item) => eventIds.includes(item.eventId)),
  }),
);
