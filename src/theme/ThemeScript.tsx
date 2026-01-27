import Script from "next/script";
import { defaultTheme, themeStorageKey } from "@/theme/theme";

const themeScript = `(() => {
  const stored = window.localStorage.getItem("${themeStorageKey}");
  const mode = stored === "light" || stored === "dark" ? stored : "${defaultTheme}";
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.dataset.theme = mode;
})();`;

export const ThemeScript = () => (
  <Script id="theme-script" strategy="afterInteractive">
    {themeScript}
  </Script>
);
