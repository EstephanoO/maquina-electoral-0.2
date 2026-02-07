import { redirect } from "next/navigation";
import { AppShell } from "@/ui/layout/AppShell";
import { getSessionUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "candidato" && user.role !== "admin") {
    redirect("/console/campaigns");
  }
  return <AppShell>{children}</AppShell>;
}
