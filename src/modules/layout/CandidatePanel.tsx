"use client";

import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/modules/layout/ThemeToggle";
import { campaigns } from "@/db/constants";
import { useCampaignsStore } from "@/modules/campaigns/store";
import { useSessionStore } from "@/stores/session.store";

const fallbackProfile = {
  name: "Guillermo Aliaga",
  party: "Somos Peru",
  role: "Senador Nacional",
  number: "#1",
  image: "/2guillermo.jpg",
  goal: "1.200.000",
};

export const CandidatePanel = () => {
  const activeCampaignId = useSessionStore((state) => state.activeCampaignId);
  const role = useSessionStore((state) => state.currentRole);
  const campaignProfiles = useCampaignsStore((state) => state.campaignProfiles);
  const campaign = campaigns.find((item) => item.id === activeCampaignId) ?? campaigns[0];
  const profile = {
    ...fallbackProfile,
    ...campaignProfiles[campaign.id],
    name: campaign.name,
  };
  const goalValue = Number(profile.goal.replaceAll(".", ""));
  const obtainedValue = 0;
  const progressValue = goalValue > 0 ? Math.round((obtainedValue / goalValue) * 100) : 0;
  const canUpdate = role === "CONSULTOR" || role === "SUPER_ADMIN";

  return (
    <Card className="-mx-6 -mt-8 rounded-none border-x-0 border-t-0 border-border/60 bg-card/70 p-6 shadow-sm shadow-black/5 lg:pr-[300px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-5">
            <img
              src={profile.image}
              alt={profile.name}
              className="h-20 w-20 rounded-3xl object-cover"
            />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Candidatura
              </p>
              <div>
                <h2 className="text-2xl font-semibold text-foreground [font-family:var(--font-display)]">
                  {profile.name}
                </h2>
                <p className="text-sm text-muted-foreground">{profile.party}</p>
                <p className="text-sm text-muted-foreground">
                  {profile.role} · {profile.number}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="min-w-[240px] rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Datos</span>
                <span>Obtenidos / objetivo</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-semibold text-foreground">
                  {obtainedValue} / {profile.goal}
                </p>
                <span className="text-sm font-semibold text-muted-foreground">
                  {progressValue}%
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
            {canUpdate ? (
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11"
                aria-label="Actualizar tablero"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            ) : null}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </Card>
  );
};
