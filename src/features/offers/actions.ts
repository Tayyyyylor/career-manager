"use server";

import { refresh } from "next/cache";

import { runAnalysis } from "@/features/analysis/run";
import { fetchOfferFromUrl, OfferFetchError, type FetchedOffer } from "@/features/offers/fetch-offer";
import {
  newOfferSchema,
  NO_RESUME,
  reanalyzeSchema,
  type NewOfferInput,
  type ReanalyzeInput,
} from "@/features/offers/schemas";
import {
  failure,
  parseInput,
  success,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/forms";
import { requireUser } from "@/lib/session";

function firstLine(text: string): string | null {
  const line = text.split("\n").map((value) => value.trim()).find(Boolean);
  return line ? line.slice(0, 160) : null;
}

function analysisMessage(fallbackReason: string | undefined): string {
  return fallbackReason
    ? `Analyse IA indisponible (${fallbackReason}) — analyse automatique utilisée.`
    : "Analyse terminée.";
}

export async function analyzeNewOffer(
  input: NewOfferInput,
): Promise<ActionResult<{ offerId: string; fallback: boolean; manual: boolean }>> {
  const user = await requireUser();
  const parsed = parseInput(newOfferSchema, input);
  if (!parsed.ok) return parsed.result;
  const values = parsed.data;

  let fetched: FetchedOffer | null = null;
  if (values.source === "url") {
    try {
      fetched = await fetchOfferFromUrl(values.url);
    } catch (error) {
      if (error instanceof OfferFetchError) {
        const message = `${error.message} Colle plutôt le texte de l'annonce.`;
        return failure(message, { url: [message] });
      }
      throw error;
    }
  }

  const description = fetched?.description ?? values.description;
  const offer = await db.jobOffer.create({
    data: {
      userId: user.id,
      title: emptyToNull(values.title) ?? fetched?.title ?? firstLine(description) ?? "Offre sans titre",
      company: emptyToNull(values.company) ?? fetched?.company ?? null,
      location: emptyToNull(values.location) ?? fetched?.location ?? null,
      sourceUrl: values.source === "url" ? values.url : null,
      description,
    },
  });

  // En mode copier-coller, on calcule d'abord la note automatique ; l'analyse
  // détaillée se fait ensuite depuis la page de l'offre.
  const manual = values.method === "MANUAL";
  const run = await runAnalysis(
    user.id,
    offer,
    values.resumeId === NO_RESUME ? null : values.resumeId,
    values.method === "MANUAL" ? "RULES" : values.method,
  );

  refresh();
  return success(
    { offerId: offer.id, fallback: Boolean(run.fallbackReason), manual },
    manual ? "Note automatique calculée : affine-la maintenant avec Claude." : analysisMessage(run.fallbackReason),
  );
}

export async function reanalyzeOffer(
  offerId: string,
  input: ReanalyzeInput,
): Promise<ActionResult<{ fallback: boolean }>> {
  const user = await requireUser();
  const parsed = parseInput(reanalyzeSchema, input);
  if (!parsed.ok) return parsed.result;

  const offer = await db.jobOffer.findFirst({ where: { id: offerId, userId: user.id } });
  if (!offer) return failure("Offre introuvable.");

  const run = await runAnalysis(
    user.id,
    offer,
    parsed.data.resumeId === NO_RESUME ? null : parsed.data.resumeId,
    parsed.data.method,
  );

  refresh();
  return success({ fallback: Boolean(run.fallbackReason) }, analysisMessage(run.fallbackReason));
}

export async function deleteOffer(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const { count } = await db.jobOffer.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return failure("Offre introuvable.");

  refresh();
  return success(undefined, "Offre supprimée.");
}
