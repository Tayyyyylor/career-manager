export const THEMES = ["light", "dark", "system"] as const;

export type Theme = (typeof THEMES)[number];
export type ResolvedTheme = Exclude<Theme, "system">;

export const DEFAULT_THEME: Theme = "system";
export const THEME_STORAGE_KEY = "theme";
export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function isTheme(value: unknown): value is Theme {
  return (
    typeof value === "string" && (THEMES as readonly string[]).includes(value)
  );
}

/**
 * Script exécuté dans le <head> avant le premier rendu : il applique le thème
 * enregistré (ou celui du système) pour éviter tout flash de thème au chargement.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=t==="dark"||(t!=="light"&&window.matchMedia(${JSON.stringify(
  DARK_MEDIA_QUERY,
)}).matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
