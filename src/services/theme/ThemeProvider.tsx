import React from "react";

import { THEME_STORAGE_KEY, type ThemeMode, resolveThemeClass } from "@/services/theme/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolved: "light" | "dark";
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    return stored ?? "system";
  });

  const [resolved, setResolved] = React.useState<"light" | "dark">(() => resolveThemeClass(mode));

  React.useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);

    const apply = () => {
      const nextResolved = resolveThemeClass(mode);
      setResolved(nextResolved);
      document.documentElement.classList.toggle("dark", nextResolved === "dark");
    };

    apply();
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (mode !== "system" || !mql) return;

    const onChange = () => apply();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [mode]);

  const setMode = React.useCallback((next: ThemeMode) => setModeState(next), []);

  const value = React.useMemo(() => ({ mode, setMode, resolved }), [mode, setMode, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
