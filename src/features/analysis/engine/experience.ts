import { normalize } from "./text";

const UNIT = "(?:ans|an|annees|annee|years|year|yrs)";

/** Motifs du type « 3 ans d'expérience », « minimum 5 ans », « 2 à 4 years of experience ». */
const PATTERNS: readonly RegExp[] = [
  new RegExp(
    `(\\d{1,2})\\s*(?:\\+|ou plus|et plus)?\\s*(?:(?:a|-|to)\\s*\\d{1,2}\\s*)?${UNIT}\\b[^.;\\n]{0,40}?(?:experience|exp\\b)`,
    "g",
  ),
  new RegExp(
    `(?:experience|exp)\\b[^.;\\n]{0,40}?(?:minimum|min|au moins|d au moins|de)?\\s*(\\d{1,2})\\s*(?:\\+)?\\s*${UNIT}\\b`,
    "g",
  ),
  new RegExp(`(?:minimum|au moins|at least)\\s*(\\d{1,2})\\s*${UNIT}\\b`, "g"),
];

/**
 * Nombre d'années d'expérience exigé par l'annonce (le plus petit seuil
 * mentionné), ou une estimation selon le niveau (junior / senior).
 */
export function extractRequiredYears(offerText: string): number | null {
  const text = normalize(offerText);
  const values: number[] = [];

  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const years = Number(match[1]);
      if (years >= 0 && years <= 25) values.push(years);
    }
  }

  if (values.length > 0) return Math.min(...values);
  if (/\b(debutante?s?|jeunes? diplomee?s?|junior|entry level|graduate)\b/.test(text)) {
    return 0;
  }
  if (/\b(senior|confirme|confirmee|experimente|experimentee|expert|lead)\b/.test(text)) {
    return 5;
  }
  return null;
}

type Period = { startDate: Date; endDate: Date | null; employmentType?: string | null };

/**
 * Années d'expérience cumulées, sans double comptage des périodes qui se
 * chevauchent. Stages et alternances comptent pour moitié.
 */
export function computeCandidateYears(periods: readonly Period[], now = new Date()): number {
  // Les dates sont au 1er du mois : une période terminée inclut son dernier mois.
  const endOf = (date: Date | null) =>
    date
      ? Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
      : now.getTime();

  const weighted = periods.map((period) => ({
    start: period.startDate.getTime(),
    end: Math.max(period.startDate.getTime(), endOf(period.endDate)),
    weight:
      period.employmentType === "INTERNSHIP" || period.employmentType === "APPRENTICESHIP"
        ? 0.5
        : 1,
  }));

  // Fusion par poids : on traite d'abord les périodes « pleines ».
  const merged: { start: number; end: number; weight: number }[] = [];
  for (const period of [...weighted].sort((a, b) => b.weight - a.weight || a.start - b.start)) {
    let segments = [{ start: period.start, end: period.end }];
    for (const existing of merged) {
      segments = segments.flatMap((segment) => {
        if (segment.end <= existing.start || segment.start >= existing.end) return [segment];
        const parts = [];
        if (segment.start < existing.start) parts.push({ start: segment.start, end: existing.start });
        if (segment.end > existing.end) parts.push({ start: existing.end, end: segment.end });
        return parts;
      });
    }
    for (const segment of segments) {
      if (segment.end > segment.start) merged.push({ ...segment, weight: period.weight });
    }
  }

  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  const total = merged.reduce(
    (sum, segment) => sum + ((segment.end - segment.start) / MS_PER_YEAR) * segment.weight,
    0,
  );
  return Math.round(total * 10) / 10;
}
