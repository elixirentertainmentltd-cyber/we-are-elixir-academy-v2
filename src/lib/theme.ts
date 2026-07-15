export interface ThemeSettings {
  mode: "light" | "dark" | "auto";

  primary: string;
  secondary: string;

  background: string;
  surface: string;
  card: string;

  text: string;
  textSecondary: string;

  heroBackground: string;
  heroTitle: string;
  heroText: string;

  border: string;

  buttonBackground: string;
  buttonText: string;

  success: string;
  warning: string;
  danger: string;

  font: string;
  language: string;
}

export const DEFAULT_THEME: ThemeSettings = {
  mode: "light",

  primary: "#2563EB",
  secondary: "#7C3AED",

  background: "#F8FAFC",
  surface: "#FFFFFF",
  card: "#FFFFFF",

  text: "#0F172A",
  textSecondary: "#475569",

  heroBackground:
    "linear-gradient(135deg,#1D4ED8 0%,#2563EB 50%,#7C3AED 100%)",

  heroTitle: "#FFFFFF",
  heroText: "rgba(255,255,255,0.92)",

  border: "#E2E8F0",

  buttonBackground: "#2563EB",
  buttonText: "#FFFFFF",

  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",

  font: "Inter",
  language: "en",
};
