"use server";

import { refresh } from "next/cache";

import { loadCandidate } from "@/features/analysis/candidate";
import { buildManualBody } from "@/features/analysis/prompt-context";
import {
  aiTailorSchema,
  TAILOR_SYSTEM_PROMPT,
  TAILOR_TASK,
  toTailoredContent,
} from "@/features/resumes/tailor";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { buildManualPrompt, parseManualResponse } from "@/lib/manual-ai";
import { requireUser } from "@/lib/session";

/** Offre + parcours, avec le CV utilisé lors de la dernière analyse. */
async function loadContext(userId: string, offerId: string) {
  const offer = await db.jobOffer.findFirst({
    where: { id: offerId, userId },
    include: { analyses: { orderBy: { createdAt: "desc" }, take: 1, select: { resumeId: true } } },
  });
  if (!offer) return null;
  const data = await loadCandidate(userId, offer.analyses[0]?.resumeId ?? null);
  return { offer, data };
}

/** Demande de CV adapté à coller dans claude.ai. */
export async function getManualTailorPrompt(offerId: string): Promise<ActionResult<{ prompt: string }>> {
  const user = await requireUser();
  const context = await loadContext(user.id, offerId);
  if (!context) return failure("Offre introuvable.");

  return success({
    prompt: buildManualPrompt({
      instructions: TAILOR_SYSTEM_PROMPT,
      body: buildManualBody(context.data, context.offer, TAILOR_TASK),
      schema: aiTailorSchema,
    }),
  });
}

/** Crée le CV adapté à partir de la réponse collée. */
export async function submitManualTailor(
  offerId: string,
  response: string,
): Promise<ActionResult<{ resumeId: string }>> {
  const user = await requireUser();
  const context = await loadContext(user.id, offerId);
  if (!context) return failure("Offre introuvable.");

  const parsed = parseManualResponse(response, aiTailorSchema);
  if (!parsed.ok) return failure(parsed.error);

  const { offer } = context;
  const resume = await db.resume.create({
    data: {
      userId: user.id,
      kind: "TAILORED",
      title: `CV — ${offer.title}${offer.company ? ` (${offer.company})` : ""}`.slice(0, 160),
      method: "AI",
      jobOfferId: offer.id,
      content: toTailoredContent(parsed.data, context.data),
    },
    select: { id: true },
  });

  refresh();
  return success({ resumeId: resume.id }, "CV adapté créé.");
}
