"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DASHBOARD_THEME_STORAGE_KEY,
  DEFAULT_DASHBOARD_THEME,
  type DashboardThemeId,
} from "@/lib/dashboard-preferences";

type DashboardPreferencesContextValue = {
  theme: DashboardThemeId;
  setTheme: (theme: DashboardThemeId) => void;
};

const DashboardPreferencesContext = createContext<DashboardPreferencesContextValue | null>(null);

function applyDashboardTheme(theme: DashboardThemeId) {
  document.documentElement.dataset.dashboardTheme = theme;
}

export function DashboardPreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DashboardThemeId>(DEFAULT_DASHBOARD_THEME);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY) as DashboardThemeId | null;
    const resolvedTheme = storedTheme ?? DEFAULT_DASHBOARD_THEME;
    setThemeState(resolvedTheme);
    applyDashboardTheme(resolvedTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (nextTheme: DashboardThemeId) => {
        setThemeState(nextTheme);
        window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, nextTheme);
        applyDashboardTheme(nextTheme);
      },
    }),
    [theme]
  );

  return <DashboardPreferencesContext.Provider value={value}>{children}</DashboardPreferencesContext.Provider>;
}

export function useDashboardPreferences() {
  const context = useContext(DashboardPreferencesContext);
  if (!context) {
    throw new Error("useDashboardPreferences must be used within DashboardPreferencesProvider");
  }
  return context;
}

