"use client";

import { ConsoleSidebar } from "@/modules/console/ConsoleSidebar";
import { ConsoleTopbar } from "@/modules/console/ConsoleTopbar";

export const ConsoleShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="app-shell console-shell text-foreground">
      <ConsoleTopbar />
      <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
        <ConsoleSidebar />
        <main className="px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
};
