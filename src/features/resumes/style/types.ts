import { z } from "zod";

export const RESUME_TEMPLATES = [
  { key: "modern", label: "Moderne", description: "Deux colonnes, bandeau de couleur" },
  { key: "classic", label: "Classique", description: "Une colonne, titres soulignés" },
  { key: "minimal", label: "Épuré", description: "Sobre, beaucoup d'espace" },
] as const;

export type ResumeTemplate = (typeof RESUME_TEMPLATES)[number]["key"];

/** Polices proposées (chargées via next/font, voir fonts.ts). */
export const RESUME_FONTS = [
  { key: "inter", label: "Inter", serif: false },
  { key: "lato", label: "Lato", serif: false },
  { key: "montserrat", label: "Montserrat", serif: false },
  { key: "poppins", label: "Poppins", serif: false },
  { key: "open-sans", label: "Open Sans", serif: false },
  { key: "roboto", label: "Roboto", serif: false },
  { key: "raleway", label: "Raleway", serif: false },
  { key: "source-serif", label: "Source Serif", serif: true },
  { key: "merriweather", label: "Merriweather", serif: true },
] as const;

export type ResumeFont = (typeof RESUME_FONTS)[number]["key"];

export const ACCENT_PRESETS = [
  "#1d4ed8", // bleu
  "#0f766e", // sarcelle
  "#15803d", // vert
  "#7c3aed", // violet
  "#be185d", // framboise
  "#c2410c", // orange brûlé
  "#334155", // ardoise
  "#111827", // noir
] as const;

const HEX = /^#[0-9a-f]{6}$/i;

export const resumeStyleSchema = z.object({
  template: z.enum(RESUME_TEMPLATES.map((t) => t.key) as [ResumeTemplate, ...ResumeTemplate[]]),
  accent: z.string().regex(HEX),
  font: z.enum(RESUME_FONTS.map((f) => f.key) as [ResumeFont, ...ResumeFont[]]),
});

export type ResumeStyle = z.infer<typeof resumeStyleSchema>;

export const DEFAULT_RESUME_STYLE: ResumeStyle = {
  template: "modern",
  accent: "#1d4ed8",
  font: "inter",
};

/** Style détecté dans un PDF (tout est facultatif). */
export const detectedStyleSchema = z.object({
  accent: z.string().regex(HEX).nullable(),
  font: z.enum(RESUME_FONTS.map((f) => f.key) as [ResumeFont, ...ResumeFont[]]).nullable(),
  /** Nom de la police trouvée dans le PDF, pour information. */
  sourceFont: z.string().nullable(),
});

export type DetectedStyle = z.infer<typeof detectedStyleSchema>;

export function parseResumeStyle(value: unknown): ResumeStyle | null {
  const parsed = resumeStyleSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseDetectedStyle(value: unknown): DetectedStyle | null {
  const parsed = detectedStyleSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Associe une famille de police trouvée dans un PDF à une police proposée. */
export function matchFont(family: string | null, serif: boolean): ResumeFont {
  const key = (family ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const exact = RESUME_FONTS.find((font) => key.startsWith(font.label.toLowerCase().replace(/[^a-z]/g, "")));
  if (exact) return exact.key;
  if (/sourcesans|nunito|manrope|dmsans|worksans|helvetica|arial|calibri|segoe/.test(key)) return "inter";
  if (/garamond|georgia|times|cambria|baskerville|palatino|playfair|lora|crimson/.test(key)) {
    return "source-serif";
  }
  return serif ? "source-serif" : "inter";
}

/** Pile de polices CSS (variables posées par `cvFontVariables`, voir fonts.ts). */
export function cvFontFamily(font: ResumeFont): string {
  const serif = RESUME_FONTS.find((item) => item.key === font)?.serif ?? false;
  return `var(--cv-font-${font}), ${serif ? "Georgia, 'Times New Roman', serif" : "Helvetica, Arial, sans-serif"}`;
}
