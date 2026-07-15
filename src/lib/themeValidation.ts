import { DEFAULT_THEME } from "./theme";

function luminance(hex: string) {
  const rgb = hex.replace("#", "");

  const values = [
    parseInt(rgb.substring(0, 2), 16),
    parseInt(rgb.substring(2, 4), 16),
    parseInt(rgb.substring(4, 6), 16),
  ].map(v => {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return (
    values[0] * 0.2126 +
    values[1] * 0.7152 +
    values[2] * 0.0722
  );
}

function contrast(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);

  return (
    (Math.max(l1, l2) + 0.05) /
    (Math.min(l1, l2) + 0.05)
  );
}

export function validateTheme(theme: any) {
  const t = { ...DEFAULT_THEME, ...theme };

  if (contrast(t.background, t.text) < 4.5) {
    t.text = "#0F172A";
  }

  if (contrast(t.background, t.textSecondary) < 3) {
    t.textSecondary = "#475569";
  }

  t.heroTitle = "#FFFFFF";
  t.heroText = "rgba(255,255,255,0.92)";
  t.buttonText = "#FFFFFF";

  return t;
}
