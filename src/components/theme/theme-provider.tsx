"use client";

import * as React from "react";

import {
  DARK_MEDIA_QUERY,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isTheme,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  /** Choix de l'utilisateur (peut valoir "system"). */
  theme: Theme;
  /** Thème réellement affiché. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

// ─── Stores externes (localStorage + préférence système) ─────────────────────

const themeListeners = new Set<() => void>();

function readStoredTheme(): Theme {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function subscribeToStoredTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}

function readSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
}

function subscribeToSystemTheme(listener: () => void) {
  const media = window.matchMedia(DARK_MEDIA_QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? readSystemTheme() : theme;
}

/** Applique le thème au document en coupant les transitions le temps du changement. */
function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);

  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;

  // Force un recalcul des styles avant de réactiver les transitions.
  void window.getComputedStyle(document.body).opacity;
  window.setTimeout(() => style.remove(), 1);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Le rendu serveur utilise les valeurs par défaut ; le DOM a déjà été
  // corrigé par le script inline du layout racine avant l'hydratation.
  const theme = React.useSyncExternalStore(
    subscribeToStoredTheme,
    readStoredTheme,
    () => DEFAULT_THEME,
  );
  const systemTheme = React.useSyncExternalStore(
    subscribeToSystemTheme,
    readSystemTheme,
    () => "light" as const,
  );

  const setTheme = React.useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Stockage indisponible (navigation privée…) : le thème reste appliqué
      // pour la session en cours.
    }
    applyTheme(resolveTheme(next));
    themeListeners.forEach((listener) => listener());
  }, []);

  // Suit les changements de préférence système et les autres onglets.
  React.useEffect(() => {
    const media = window.matchMedia(DARK_MEDIA_QUERY);
    const sync = () => applyTheme(resolveTheme(readStoredTheme()));
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      sync();
      themeListeners.forEach((listener) => listener());
    };

    media.addEventListener("change", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: theme === "system" ? systemTheme : theme,
      setTheme,
    }),
    [theme, systemTheme, setTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const context = React.use(ThemeContext);
  if (!context) {
    throw new Error("useTheme doit être utilisé dans un <ThemeProvider>.");
  }
  return context;
}
