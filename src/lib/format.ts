/**
 * Formatage partagé (serveur et client). Les dates « calendaires » sont
 * stockées à minuit UTC : on les formate donc toujours en UTC.
 */

const LOCALE = "fr-FR";

const monthYear = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const fullDate = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortDate = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatMonthYear(date: Date): string {
  return monthYear.format(date);
}

export function formatDate(date: Date): string {
  return fullDate.format(date);
}

export function formatShortDate(date: Date): string {
  return shortDate.format(date);
}

/** « janv. 2022 – aujourd'hui » */
export function formatPeriod(start: Date | null, end: Date | null): string {
  if (!start && !end) return "";
  if (!start) return end ? formatMonthYear(end) : "";
  return `${formatMonthYear(start)} – ${end ? formatMonthYear(end) : "aujourd'hui"}`;
}

/** Durée lisible : « 2 ans et 3 mois ». */
export function formatDuration(start: Date, end: Date | null): string {
  const to = end ?? new Date();
  const months =
    (to.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - start.getUTCMonth()) +
    1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} an${years > 1 ? "s" : ""}`);
  if (rest > 0) parts.push(`${rest} mois`);
  return parts.join(" et ") || "moins d'un mois";
}

// ─── Champs <input type="month"> ─────────────────────────────────────────────

/** Date → "AAAA-MM" */
export function toMonthInput(date: Date | null | undefined): string {
  if (!date) return "";
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

/** "AAAA-MM" → premier jour du mois à minuit UTC. */
export function fromMonthInput(value: string): Date {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, 1));
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export type ScoreScale = 100 | 20;

export function toScoreScale(value: number | null | undefined): ScoreScale {
  return value === 20 ? 20 : 100;
}

/** Convertit une note sur 100 vers le barème choisi : « 72/100 » ou « 14,5/20 ». */
export function formatScore(score: number, scale: ScoreScale): string {
  if (scale === 100) return `${Math.round(score)}/100`;
  const value = Math.round((score / 5) * 2) / 2; // arrondi au demi-point
  return `${value.toLocaleString(LOCALE)}/20`;
}

export type ScoreTone = "high" | "medium" | "low";

export function scoreTone(score: number): ScoreTone {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Excellente adéquation";
  if (score >= 70) return "Bonne adéquation";
  if (score >= 50) return "Adéquation partielle";
  if (score >= 30) return "Adéquation faible";
  return "Peu adapté";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} Mo`;
}
