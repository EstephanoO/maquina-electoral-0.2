import { redirect } from "next/navigation";

type DashboardPageProps = {
  params: Promise<{ client: string; template: string }>;
  searchParams?: Promise<{ preview?: string }>;
};

export default async function DashboardTemplatePage({
  params,
  searchParams,
}: DashboardPageProps) {
  const { client } = await params;
  const { preview } = (await searchParams) ?? {};
  const previewQuery = preview === "1" ? "?preview=1" : "";
  redirect(`/dashboard/${client}/tierra${previewQuery}`);
}
