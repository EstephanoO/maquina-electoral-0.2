import { redirect } from "next/navigation";
import { campaigns } from "@/db/constants";

type PreviewPageProps = {
  params: Promise<{ campaignId: string; template: string }>;
};

const candidateRoutes: Record<string, string> = {
  "cand-rocio": "rocio",
  "cand-giovanna": "giovanna",
  "cand-guillermo": "guillermo",
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { campaignId, template } = await params;
  const campaign = campaigns.find((item) => item.id === campaignId);
  if (!campaign) {
    redirect("/console/campaigns");
  }

  const clientSlug = candidateRoutes[campaignId] ?? "guillermo";
  const previewQuery = template ? "?preview=1" : "";
  redirect(`/dashboard/${clientSlug}/tierra${previewQuery}`);
}
