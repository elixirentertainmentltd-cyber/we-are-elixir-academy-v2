import { DEFAULT_THEME } from "./theme";

export interface ThemeSettings {
  mode?: "light" | "dark" | "auto";

  primary?: string;
  secondary?: string;

  background?: string;
  surface?: string;
  card?: string;

  text?: string;
  textSecondary?: string;

  heroBackground?: string;
  heroTitle?: string;
  heroText?: string;

  border?: string;

  buttonBackground?: string;
  buttonText?: string;

  success?: string;
  warning?: string;
  danger?: string;

  font?: string;
  language?: string;
}

function luminance(hex: string): number {
  const rgb = hex.replace("#", "");

  const values = [
    parseInt(rgb.substring(0, 2), 16),
    parseInt(rgb.substring(2, 4), 16),
    parseInt(rgb.substring(4, 6), 16),
  ].map((value) => {
    value /= 255;

    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return (
    values[0] * 0.2126 +
    values[1] * 0.7152 +
    values[2] * 0.0722
  );
}

function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);

  return (
    (Math.max(l1, l2) + 0.05) /
    (Math.min(l1, l2) + 0.05)
  );
}

export function validateTheme(
  theme: Partial<ThemeSettings>
): ThemeSettings {

  const t: ThemeSettings = {
    ...DEFAULT_THEME,
    ...theme,
  };

  if (
    t.background &&
    t.text &&
    contrast(t.background, t.text) < 4.5
  ) {
    t.text = "#0F172A";
  }

  if (
    t.background &&
    t.textSecondary &&
    contrast(t.background, t.textSecondary) < 3
  ) {
    t.textSecondary = "#475569";
  }

  // Hero is always readable
  t.heroTitle = "#FFFFFF";
  t.heroText = "rgba(255,255,255,.92)";
  t.buttonText = "#FFFFFF";

  return t;
}
