import { z } from "zod";

import { EmploymentType } from "@/generated/prisma/enums";
import { NO_EMPLOYMENT_TYPE } from "@/features/experiences/constants";
import {
  monthString,
  optionalMonthString,
  optionalText,
  requiredText,
} from "@/lib/validation";

export const experienceSchema = z
  .object({
    position: requiredText(120, "Intitulé du poste requis."),
    company: requiredText(120, "Entreprise requise."),
    location: optionalText(80),
    employmentType: z.union([z.enum(EmploymentType), z.literal(NO_EMPLOYMENT_TYPE)]),
    startDate: monthString,
    current: z.boolean(),
    endDate: optionalMonthString,
    description: optionalText(3000),
    /** Une réalisation par ligne. */
    achievements: optionalText(5000),
    skillIds: z.array(z.string()).max(60),
    newSkills: optionalText(500),
  })
  .superRefine((value, ctx) => {
    if (value.current) return;
    if (!value.endDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Date de fin requise (ou coche « Poste actuel »).",
      });
    } else if (value.endDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "La date de fin précède la date de début.",
      });
    }
  });

export type ExperienceInput = z.infer<typeof experienceSchema>;

/** « - a\n• b\n\nc » → ["a", "b", "c"] */
export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.replace(/^\s*[-•*–]\s*/, "").trim())
    .filter(Boolean);
}
