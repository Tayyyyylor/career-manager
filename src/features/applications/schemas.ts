import { z } from "zod";

import { ApplicationStatus } from "@/generated/prisma/enums";
import { optionalText, optionalUrl, requiredText } from "@/lib/validation";

export const NO_LINK = "NONE";

export const applicationSchema = z.object({
  company: requiredText(120, "Entreprise requise."),
  position: requiredText(160, "Poste requis."),
  status: z.enum(ApplicationStatus),
  appliedAt: z.union([
    z.literal(""),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  ]),
  url: optionalUrl,
  notes: optionalText(5000),
  jobOfferId: z.string(),
  resumeId: z.string(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const emptyApplication: ApplicationInput = {
  company: "",
  position: "",
  status: "TO_APPLY",
  appliedAt: "",
  url: "",
  notes: "",
  jobOfferId: NO_LINK,
  resumeId: NO_LINK,
};

/** Date → "AAAA-MM-JJ" (UTC). */
export function toDateInput(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}
