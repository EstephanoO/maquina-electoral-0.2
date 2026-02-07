import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

const campaignToSlug: Record<string, string> = {
  "cand-rocio": "rocio",
  "cand-giovanna": "giovanna",
  "cand-guillermo": "guillermo",
};

export default async function EntryPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === "admin") {
    redirect("/console/campaigns");
  }

  const campaignId = user.campaignId ?? user.assignedCampaignIds[0] ?? "cand-guillermo";
  const slug = campaignToSlug[campaignId] ?? "guillermo";
  redirect(`/dashboard/${slug}/tierra`);
}
