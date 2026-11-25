"use server";

import { refresh } from "next/cache";

import {
  aiAnalysisSchema,
  ANALYSIS_SYSTEM_PROMPT,
  ANALYSIS_TASK,
  toAnalysisResult,
} from "@/features/analysis/ai-analysis";
import { loadCandidate } from "@/features/analysis/candidate";
import { buildManualBody } from "@/features/analysis/prompt-context";
import { NO_RESUME } from "@/features/offers/schemas";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { buildManualPrompt, MANUAL_MODEL_LABEL, parseManualResponse } from "@/lib/manual-ai";
import { requireUser } from "@/lib/session";

async function loadContext(userId: string, offerId: string, resumeId: string) {
  const offer = await db.jobOffer.findFirst({ where: { id: offerId, userId } });
  if (!offer) return null;
  const data = await loadCandidate(userId, resumeId === NO_RESUME ? null : resumeId);
  return { offer, data };
}

/** Demande d'analyse à coller dans claude.ai. */
export async function getManualAnalysisPrompt(
  offerId: string,
  resumeId: string,
): Promise<ActionResult<{ prompt: string }>> {
  const user = await requireUser();
  const context = await loadContext(user.id, offerId, resumeId);
  if (!context) return failure("Offre introuvable.");

  return success({
    prompt: buildManualPrompt({
      instructions: ANALYSIS_SYSTEM_PROMPT,
      body: buildManualBody(context.data, context.offer, ANALYSIS_TASK),
      schema: aiAnalysisSchema,
    }),
  });
}

/** Enregistre l'analyse collée depuis l'assistant. */
export async function submitManualAnalysis(
  offerId: string,
  resumeId: string,
  response: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const context = await loadContext(user.id, offerId, resumeId);
  if (!context) return failure("Offre introuvable.");

  const parsed = parseManualResponse(response, aiAnalysisSchema);
  if (!parsed.ok) return failure(parsed.error);

  const result = toAnalysisResult(parsed.data, context.data);
  await db.offerAnalysis.create({
    data: {
      jobOfferId: context.offer.id,
      resumeId: context.data.resume?.id ?? null,
      method: "AI",
      model: MANUAL_MODEL_LABEL,
      score: result.score,
      details: result.details,
    },
  });

  refresh();
  return success(undefined, "Analyse enregistrée.");
}
