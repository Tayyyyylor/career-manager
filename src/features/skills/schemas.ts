import { z } from "zod";

import { SkillCategory, SkillLevel } from "@/generated/prisma/enums";
import { AUTO_CATEGORY, NO_LEVEL } from "@/features/skills/constants";

export const skillSchema = z.object({
  name: z.string().trim().min(1, "Nom requis.").max(60, "60 caractères maximum."),
  category: z.enum(SkillCategory),
  level: z.union([z.enum(SkillLevel), z.literal(NO_LEVEL)]),
});

export type SkillInput = z.infer<typeof skillSchema>;

export const bulkSkillsSchema = z.object({
  names: z
    .string()
    .trim()
    .min(1, "Saisis au moins une compétence.")
    .max(2000),
  category: z.union([z.enum(SkillCategory), z.literal(AUTO_CATEGORY)]),
});

export type BulkSkillsInput = z.infer<typeof bulkSkillsSchema>;

/** « React, TypeScript; Node.js\nSQL » → noms uniques, nettoyés. */
export function splitSkillNames(raw: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const part of raw.split(/[,;\n]/)) {
    const name = part.trim().replace(/\s+/g, " ").slice(0, 60);
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  }
  return names;
}
