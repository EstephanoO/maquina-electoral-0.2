"use client";

import * as React from "react";
import { ThemeProvider } from "@/theme/ThemeProvider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};
