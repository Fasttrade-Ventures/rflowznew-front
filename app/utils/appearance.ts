export const THEME_COLORS = ["pink", "teal", "blue", "orange"] as const;

export type ThemeColor = (typeof THEME_COLORS)[number];

export type FontScale = "xs" | "sm" | "md" | "lg" | "xl";

export type ColorSchemePreference = "light" | "dark" | "system";

const PRIMARY_HEX: Record<ThemeColor, string> = {
  pink: "#e64980",
  teal: "#12b886",
  blue: "#228be6",
  orange: "#fd7e14",
};

export function resolveThemeColor(color: string | undefined): ThemeColor {
  if (color && (THEME_COLORS as readonly string[]).includes(color)) {
    return color as ThemeColor;
  }
  return "blue";
}

export function getScaleMultiplier(scale: FontScale | string | undefined): number {
  switch (scale) {
    case "xs":
      return 1;
    case "sm":
      return 1.05625;
    case "lg":
      return 1.16875;
    case "xl":
      return 1.225;
    case "md":
    default:
      return 1.1125;
  }
}

/** Primary accent only — light/dark surface tokens live in rflowz-v2.css */
export function getPrimaryCssVars(
  colorTheme: string | undefined
): Record<string, string> {
  const color = resolveThemeColor(colorTheme);
  return {
    "--rz-primary": PRIMARY_HEX[color],
    "--rz-primary-foreground": "#ffffff",
  };
}

/** @deprecated Use getPrimaryCssVars + CSS scheme tokens in rflowz-v2.css */
export function getAppearanceCssVars(
  colorTheme: string | undefined,
  resolvedScheme: "light" | "dark"
): Record<string, string> {
  return {
    ...getPrimaryCssVars(colorTheme),
    ...(resolvedScheme === "dark"
      ? {
          "--rz-background": "#09090b",
          "--rz-foreground": "#fafafa",
          "--rz-card": "#18181b",
          "--rz-muted": "#27272a",
          "--rz-muted-foreground": "#a1a1aa",
          "--rz-border": "#3f3f46",
          "--rz-sidebar": "#09090b",
          "--rz-sidebar-accent": "#27272a",
          "--rz-sidebar-border": "#3f3f46",
        }
      : {
          "--rz-background": "#fafafa",
          "--rz-foreground": "#09090b",
          "--rz-card": "#ffffff",
          "--rz-muted": "#f4f4f5",
          "--rz-muted-foreground": "#71717a",
          "--rz-border": "#e4e4e7",
          "--rz-sidebar": "#fafafa",
          "--rz-sidebar-accent": "#f4f4f5",
          "--rz-sidebar-border": "#e4e4e7",
        }),
  };
}

export const FONT_SCALE_MARKS = [
  { value: 0, label: "xs" as const },
  { value: 25, label: "sm" as const },
  { value: 50, label: "md" as const },
  { value: 75, label: "lg" as const },
  { value: 100, label: "xl" as const },
];
