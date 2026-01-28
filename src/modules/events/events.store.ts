import { create } from "zustand";
import type { CampaignEvent, EventStatus } from "@/lib/types";
import { events as seedEvents } from "@/db/constants";
import { createId } from "@/db/mock-helpers";

type EventsState = {
  events: CampaignEvent[];
  loaded: boolean;
};

type EventsActions = {
  createEvent: (payload: Omit<CampaignEvent, "id"> & { id?: string }) => string;
  setEvents: (events: CampaignEvent[]) => void;
  loadEvents: (options?: { campaignId?: string; eventId?: string }) => Promise<boolean>;
  updateEvent: (eventId: string, updates: Partial<CampaignEvent>) => void;
  closeEvent: (eventId: string) => void;
  removeEvent: (eventId: string) => void;
  getEventsByCampaign: (campaignId: string) => CampaignEvent[];
  getEventById: (eventId: string) => CampaignEvent | undefined;
};

export const useEventsStore = create<EventsState & EventsActions>()(
  (set, get) => ({
    events: seedEvents,
    loaded: false,
    createEvent: (payload) => {
      const id = payload.id ?? createId("event");
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
    setEvents: (events) => set({ events }),
    loadEvents: async (options) => {
      const params = new URLSearchParams();
      if (options?.campaignId) {
        params.set("campaignId", options.campaignId);
      }
      if (options?.eventId) {
        params.set("id", options.eventId);
      }
      const url = params.toString() ? `/api/events?${params.toString()}` : "/api/events";
      try {
        const response = await fetch(url);
        if (!response.ok) {
          return false;
        }
        const data = (await response.json()) as { events?: CampaignEvent[] };
        set({ events: data.events ?? [], loaded: true });
        return true;
      } catch {
        return false;
      }
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
