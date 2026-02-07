import { redirect } from "next/navigation";

type DashboardClientPageProps = {
  params: Promise<{ client: string }>;
  searchParams?: Promise<{ preview?: string }>;
};

export default async function DashboardClientPage({
  params,
  searchParams,
}: DashboardClientPageProps) {
  const { client } = await params;
  const { preview } = (await searchParams) ?? {};
  const previewQuery = preview === "1" ? "?preview=1" : "";
  redirect(`/dashboard/${client}/tierra${previewQuery}`);
}
