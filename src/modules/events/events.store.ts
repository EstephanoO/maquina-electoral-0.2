import { create } from "zustand";
import type { CampaignEvent, EventStatus } from "@/lib/types";
import { events as seedEvents } from "@/db/constants";
import { createId } from "@/db/mock-helpers";

type EventsState = {
  events: CampaignEvent[];
};

type EventsActions = {
  createEvent: (payload: Omit<CampaignEvent, "id">) => string;
  updateEvent: (eventId: string, updates: Partial<CampaignEvent>) => void;
  closeEvent: (eventId: string) => void;
  removeEvent: (eventId: string) => void;
  getEventsByCampaign: (campaignId: string) => CampaignEvent[];
  getEventById: (eventId: string) => CampaignEvent | undefined;
};

export const useEventsStore = create<EventsState & EventsActions>()(
  (set, get) => ({
    events: seedEvents,
    createEvent: (payload) => {
      const id = createId("event");
      set((state) => ({
        events: [
          ...state.events,
          {
            ...payload,
            id,
          },
        ],
      }));
      return id;
    },
    updateEvent: (eventId, updates) =>
      set((state) => ({
        events: state.events.map((event) =>
          event.id === eventId ? { ...event, ...updates } : event,
        ),
      })),
    closeEvent: (eventId) =>
      set((state) => ({
        events: state.events.map((event) =>
          event.id === eventId
            ? { ...event, status: "CLOSED" as EventStatus, endDate: new Date().toISOString().slice(0, 10) }
            : event,
        ),
      })),
    removeEvent: (eventId) =>
      set((state) => ({
        events: state.events.filter((event) => event.id !== eventId),
      })),
    getEventsByCampaign: (campaignId) =>
      get().events.filter((event) => event.campaignId === campaignId),
    getEventById: (eventId) => get().events.find((event) => event.id === eventId),
  }),
);
