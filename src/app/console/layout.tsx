import { redirect } from "next/navigation";
import { ConsoleShell } from "@/modules/console/ConsoleShell";
import { ConsoleAccessGate } from "@/modules/console/ConsoleAccessGate";
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
