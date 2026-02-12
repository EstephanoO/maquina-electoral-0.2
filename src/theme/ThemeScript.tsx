import Script from "next/script";
import { themeStorageKey } from "@/theme/theme";

const themeScript = `(() => {
  window.localStorage.setItem("${themeStorageKey}", "light");
  document.documentElement.classList.remove("dark");
  document.documentElement.dataset.theme = "light";
})();`;

export const ThemeScript = () => (
  <Script id="theme-script" strategy="afterInteractive">
    {themeScript}
  </Script>
);
