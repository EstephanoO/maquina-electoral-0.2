import { useTheme } from "@/theme/ThemeProvider";
import { DASHBOARD_THEME, type DashboardTheme } from "../constants/dashboard";

export const useDashboardTheme = () => {
  const { mode, toggle } = useTheme();
  const theme: DashboardTheme =
    mode === "dark" ? DASHBOARD_THEME.DARK : DASHBOARD_THEME.LIGHT;
  return { theme, toggleTheme: toggle };
};
