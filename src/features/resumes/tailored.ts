import { z } from "zod";

/** Contenu structuré d'un CV adapté (stocké dans `Resume.content`). */
export const tailoredResumeSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  skillGroups: z.array(z.object({ label: z.string(), items: z.array(z.string()) })),
  experiences: z.array(
    z.object({
      position: z.string(),
      company: z.string(),
      location: z.string().nullable(),
      period: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      role: z.string().nullable(),
      description: z.string(),
      technologies: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      period: z.string().nullable(),
      details: z.string().nullable(),
    }),
  ),
  /** Conseils pour finaliser le CV (non imprimés). */
  advice: z.array(z.string()),
  /** Ce qui a été adapté par rapport au CV d'origine (non imprimé). */
  changes: z.array(z.string()).default([]),
});

export type TailoredResumeContent = z.infer<typeof tailoredResumeSchema>;

export function parseTailoredContent(value: unknown): TailoredResumeContent | null {
  const parsed = tailoredResumeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
