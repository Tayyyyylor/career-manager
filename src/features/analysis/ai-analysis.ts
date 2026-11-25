import "server-only";

import { z } from "zod";

import type { CandidateData } from "@/features/analysis/candidate";
import { computeCandidateYears } from "@/features/analysis/engine/experience";
import { buildUserContent } from "@/features/analysis/prompt-context";
import type { AnalysisResult } from "@/features/analysis/types";
import { generateStructured } from "@/lib/ai";

/** Critères évalués par l'IA et leur poids dans la note globale. */
const AI_CRITERIA = {
  hard_skills: { label: "Compétences techniques & métier", weight: 0.35 },
  experience: { label: "Expérience pertinente", weight: 0.3 },
  fit: { label: "Adéquation au poste", weight: 0.15 },
  education: { label: "Formation", weight: 0.1 },
  soft_skills: { label: "Savoir-être & langues", weight: 0.1 },
} as const;

type CriterionKey = keyof typeof AI_CRITERIA;
const CRITERION_KEYS = Object.keys(AI_CRITERIA) as [CriterionKey, ...CriterionKey[]];

export const aiAnalysisSchema = z.object({
  criteria: z
    .array(
      z.object({
        key: z.enum(CRITERION_KEYS),
        score: z.number().describe("Note du critère, entier de 0 à 100."),
        comment: z.string().describe("Justification concise (1 à 2 phrases)."),
      }),
    )
    .describe("Exactement un élément par critère."),
  summary: z.string().describe("Synthèse de l'adéquation en 2 ou 3 phrases."),
  matchedSkills: z.array(z.string()).describe("Compétences demandées que le candidat démontre."),
  missingSkills: z.array(z.string()).describe("Compétences demandées absentes ou non démontrées."),
  strengths: z.array(z.string()).describe("3 à 5 points forts de la candidature."),
  gaps: z.array(z.string()).describe("Manques ou points de vigilance."),
  recommendations: z
    .array(z.string())
    .describe("Conseils concrets pour adapter le CV et la candidature, sans rien inventer."),
  missingKeywords: z.array(z.string()).describe("Termes importants de l'annonce absents du CV."),
  requiredYears: z
    .number()
    .nullable()
    .describe("Années d'expérience exigées par l'annonce, ou null si non précisé."),
});

export const ANALYSIS_SYSTEM_PROMPT = `Tu es une recruteuse expérimentée chargée d'évaluer objectivement l'adéquation entre une offre d'emploi et le parcours d'un candidat.

Règles :
- Appuie-toi uniquement sur le CV et le profil fournis. N'invente aucune expérience, compétence ou diplôme : ce qui n'est pas mentionné est considéré comme non démontré.
- Évalue chaque critère de 0 à 100 :
  • hard_skills : compétences techniques et métier exigées par l'offre ;
  • experience : pertinence et durée de l'expérience au regard du poste ;
  • fit : niveau de séniorité, nature des missions, secteur, type de contrat et localisation ;
  • education : diplômes et formations au regard des exigences ;
  • soft_skills : savoir-être et langues demandés.
- Calibrage : 90-100 profil idéal, 70-89 bon profil, 50-69 adéquation partielle, 30-49 faible, moins de 30 inadapté. Sois exigeante mais juste.
- Distingue les exigences obligatoires des compétences simplement appréciées.
- Rédige en français, en tutoyant le candidat, de façon concise et concrète.
- Les recommandations doivent aider à mieux valoriser ce que le candidat possède réellement (reformulation, mise en avant, vocabulaire de l'annonce), jamais à embellir son parcours.`;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export const ANALYSIS_TASK =
  "Évalue l'adéquation entre ce candidat et cette offre selon les critères demandés.";

export type AiAnalysisOutput = z.output<typeof aiAnalysisSchema>;

/** Convertit la réponse du modèle (API ou copier-coller) en résultat d'analyse. */
export function toAnalysisResult(output: AiAnalysisOutput, data: CandidateData): AnalysisResult {
  const byKey = new Map(output.criteria.map((criterion) => [criterion.key, criterion]));
  const criteria = CRITERION_KEYS.flatMap((key) => {
    const item = byKey.get(key);
    if (!item) return [];
    return [
      {
        key,
        label: AI_CRITERIA[key].label,
        score: clampScore(item.score),
        weight: AI_CRITERIA[key].weight,
        comment: item.comment,
      },
    ];
  });

  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  const score =
    totalWeight === 0
      ? 0
      : clampScore(criteria.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight);

  return {
    score,
    details: {
      summary: output.summary,
      criteria,
      matchedSkills: output.matchedSkills,
      missingSkills: output.missingSkills,
      strengths: output.strengths,
      gaps: output.gaps,
      recommendations: output.recommendations,
      keywords: output.missingKeywords.length > 0 ? { found: [], missing: output.missingKeywords } : null,
      experience: {
        requiredYears: output.requiredYears,
        candidateYears:
          data.candidate.experiences.length > 0
            ? computeCandidateYears(data.candidate.experiences)
            : 0,
      },
    },
  };
}

/** Analyse d'une offre par Claude, au même format que le moteur de règles. */
export async function analyzeWithAi(
  userId: string,
  data: CandidateData,
  offer: { title: string; company: string | null; location: string | null; description: string },
): Promise<AnalysisResult & { model: string }> {
  const { data: output, model } = await generateStructured({
    userId,
    kind: "ANALYSIS",
    system: ANALYSIS_SYSTEM_PROMPT,
    schema: aiAnalysisSchema,
    content: buildUserContent(data, offer, ANALYSIS_TASK),
  });
  return { ...toAnalysisResult(output, data), model };
}
