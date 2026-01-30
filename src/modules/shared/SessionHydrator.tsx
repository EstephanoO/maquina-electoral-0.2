"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/stores/session.store";

type SessionPayload = {
  user: null | {
    id: string;
    email: string;
    name: string;
    role: "admin" | "candidato";
    campaignId: string | null;
    assignedCampaignIds: string[];
  };
};

export const SessionHydrator = () => {
  const setSessionUser = useSessionStore((state) => state.setSessionUser);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return;
        const payload = (await response.json()) as SessionPayload;
        setSessionUser(payload.user);
      } catch (err) {
        setSessionUser(null);
      }
    };

    hydrate();
  }, [setSessionUser]);

  return null;
};
