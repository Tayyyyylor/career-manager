import "server-only";

import type { AnalysisMethod } from "@/generated/prisma/enums";
import { analyzeWithAi } from "@/features/analysis/ai-analysis";
import { loadCandidate } from "@/features/analysis/candidate";
import { analyzeOffer } from "@/features/analysis/engine/score";
import type { AnalysisResult } from "@/features/analysis/types";
import { AiError, isAiEnabled } from "@/lib/ai";
import { db } from "@/lib/db";

type OfferForAnalysis = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  description: string;
};

export type RunAnalysisResult = {
  analysisId: string;
  method: AnalysisMethod;
  score: number;
  /** Raison du repli sur le moteur de règles quand l'IA était demandée. */
  fallbackReason?: string;
};

/**
 * Analyse une offre pour un utilisateur et enregistre le résultat.
 * Si l'IA est demandée mais indisponible, bascule sur le moteur de règles.
 */
export async function runAnalysis(
  userId: string,
  offer: OfferForAnalysis,
  resumeId: string | null,
  method: AnalysisMethod,
): Promise<RunAnalysisResult> {
  const data = await loadCandidate(userId, resumeId);

  let result: AnalysisResult | undefined;
  let usedMethod: AnalysisMethod = "RULES";
  let model: string | null = null;
  let fallbackReason: string | undefined;

  if (method === "AI") {
    if (!isAiEnabled()) {
      fallbackReason = "L'IA n'est pas configurée sur ce serveur.";
    } else {
      try {
        const aiResult = await analyzeWithAi(userId, data, offer);
        result = aiResult;
        model = aiResult.model;
        usedMethod = "AI";
      } catch (error) {
        if (!(error instanceof AiError)) throw error;
        fallbackReason = error.message;
      }
    }
  }

  result ??= analyzeOffer({ title: offer.title, description: offer.description }, data.candidate);

  const analysis = await db.offerAnalysis.create({
    data: {
      jobOfferId: offer.id,
      resumeId: data.resume?.id ?? null,
      method: usedMethod,
      model,
      score: result.score,
      details: result.details,
    },
    select: { id: true },
  });

  return { analysisId: analysis.id, method: usedMethod, score: result.score, fallbackReason };
}
