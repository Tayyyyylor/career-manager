import { z } from "zod";

import { optionalText } from "@/lib/validation";

export const NO_RESUME = "NONE";
export const MIN_OFFER_LENGTH = 200;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const analysisMethodSchema = z.enum(["RULES", "AI"]);
export type AnalysisMethodInput = z.infer<typeof analysisMethodSchema>;

/** Méthodes proposées dans le formulaire : MANUAL = copier-coller via claude.ai. */
export const offerMethodSchema = z.enum(["RULES", "AI", "MANUAL"]);
export type OfferMethodInput = z.infer<typeof offerMethodSchema>;

export const newOfferSchema = z
  .object({
    source: z.enum(["url", "text"]),
    url: z.string().trim().max(2000),
    title: optionalText(160),
    company: optionalText(120),
    location: optionalText(120),
    description: z.string().trim().max(30_000, "30 000 caractères maximum."),
    resumeId: z.string(),
    method: offerMethodSchema,
  })
  .superRefine((value, ctx) => {
    if (value.source === "url" && !isHttpUrl(value.url)) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Colle un lien valide (https://…)." });
    }
    if (value.source === "text" && value.description.length < MIN_OFFER_LENGTH) {
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: `Colle la description complète de l'annonce (${MIN_OFFER_LENGTH} caractères minimum).`,
      });
    }
  });

export type NewOfferInput = z.infer<typeof newOfferSchema>;

export const reanalyzeSchema = z.object({
  resumeId: z.string(),
  method: analysisMethodSchema,
});

export type ReanalyzeInput = z.infer<typeof reanalyzeSchema>;
