import { redirect } from "next/navigation";
import { ConsoleShell } from "@/ui/console/ConsoleShell";
import { ConsoleAccessGate } from "@/ui/console/ConsoleAccessGate";
import { getSessionUser } from "@/lib/auth/session";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return (
    <ConsoleAccessGate>
      <ConsoleShell>{children}</ConsoleShell>
    </ConsoleAccessGate>
  );
}
