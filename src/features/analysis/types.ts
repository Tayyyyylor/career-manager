import { z } from "zod";

/** Un critère de notation, noté sur 100. */
export const criterionSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number(),
  /** Poids relatif du critère dans la note globale. */
  weight: z.number(),
  comment: z.string(),
});

/**
 * Détail d'une analyse d'offre, commun au moteur de règles et à l'IA.
 * Stocké en JSON dans `OfferAnalysis.details`.
 */
export const analysisDetailsSchema = z.object({
  summary: z.string(),
  criteria: z.array(criterionSchema),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendations: z.array(z.string()),
  keywords: z
    .object({ found: z.array(z.string()), missing: z.array(z.string()) })
    .nullable(),
  experience: z
    .object({
      requiredYears: z.number().nullable(),
      candidateYears: z.number().nullable(),
    })
    .nullable(),
});

export type Criterion = z.infer<typeof criterionSchema>;
export type AnalysisDetails = z.infer<typeof analysisDetailsSchema>;

export type AnalysisResult = {
  /** Note globale sur 100. */
  score: number;
  details: AnalysisDetails;
};

/** Lecture tolérante du JSON stocké (anciennes versions, données corrompues). */
export function parseAnalysisDetails(value: unknown): AnalysisDetails | null {
  const parsed = analysisDetailsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// ─── Entrée du moteur ────────────────────────────────────────────────────────

export type CandidateExperience = {
  position: string;
  company: string;
  description: string | null;
  achievements: readonly string[];
  skills: readonly string[];
  startDate: Date;
  endDate: Date | null;
  employmentType: string | null;
};

export type CandidateProfile = {
  headline: string | null;
  summary: string | null;
  skills: readonly { name: string; category: string }[];
  experiences: readonly CandidateExperience[];
  projects: readonly { name: string; description: string | null; role: string | null; skills: readonly string[] }[];
  educations: readonly { degree: string; fieldOfStudy: string | null; institution: string; description: string | null }[];
  /** Texte extrait du CV générique (PDF), s'il existe. */
  resumeText: string | null;
};

export type OfferInput = {
  title: string;
  description: string;
};
