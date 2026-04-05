export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "musics.theme";

export function resolveThemeClass(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}
