"use client";

import * as React from "react";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { SessionHydrator } from "@/modules/shared/SessionHydrator";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <SessionHydrator />
      {children}
    </ThemeProvider>
  );
};
