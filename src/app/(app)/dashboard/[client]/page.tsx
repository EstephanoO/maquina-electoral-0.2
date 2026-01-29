import { DashboardCatalog } from "@/modules/dashboards/DashboardCatalog";

type DashboardPageProps = {
  params: Promise<{ client: string }>;
};

export default async function DashboardClientPage({ params }: DashboardPageProps) {
  const { client } = await params;

  return (
    <DashboardCatalog client={client} />
  );
}
