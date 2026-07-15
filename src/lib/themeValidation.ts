import {
  DEFAULT_THEME,
  type ThemeSettings,
} from "./theme";

function luminance(hex: string): number {
  const cleaned = hex.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return 0;
  }

  const values = [
    Number.parseInt(cleaned.slice(0, 2), 16),
    Number.parseInt(cleaned.slice(2, 4), 16),
    Number.parseInt(cleaned.slice(4, 6), 16),
  ].map((value) => {
    const channel = value / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return (
    values[0] * 0.2126 +
    values[1] * 0.7152 +
    values[2] * 0.0722
  );
}

function contrast(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);

  return (
    (Math.max(first, second) + 0.05) /
    (Math.min(first, second) + 0.05)
  );
}

export function validateTheme(
  theme: Partial<ThemeSettings>,
): ThemeSettings {
  const validated: ThemeSettings = {
    ...DEFAULT_THEME,
    ...theme,
  };

  if (contrast(validated.background, validated.text) < 4.5) {
    validated.text = DEFAULT_THEME.text;
  }

  if (
    contrast(
      validated.background,
      validated.textSecondary,
    ) < 3
  ) {
    validated.textSecondary =
      DEFAULT_THEME.textSecondary;
  }

  validated.heroTitle = "#FFFFFF";
  validated.heroText = "rgba(255,255,255,0.92)";

  return validated;
}
