import { useTheme } from "#app/routes/resources+/theme-switch";
import { useEffect } from "react";

/** Keeps `html[data-mantine-color-scheme]` in sync with the resolved app theme. */
export function ThemeSync() {
  const theme = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute("data-mantine-color-scheme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return null;
}
