import { redirect } from "next/navigation";

type DashboardPageProps = {
  params: Promise<{ client: string }>;
};

export default async function DashboardClientPage({ params }: DashboardPageProps) {
  const { client } = await params;
  redirect(`/dashboard/${client}/tierra`);
}
