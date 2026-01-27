import { ConsoleShell } from "@/modules/console/ConsoleShell";
import { ConsoleAccessGate } from "@/modules/console/ConsoleAccessGate";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConsoleAccessGate>
      <ConsoleShell>{children}</ConsoleShell>
    </ConsoleAccessGate>
  );
}
