import "server-only";

import { z } from "zod";

/** Une variable vide (`FOO=""`) est traitée comme absente. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requise."),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET doit contenir au moins 32 caractères."),
  BETTER_AUTH_URL: optional(z.url()),
  /** Fourni automatiquement par Vercel. */
  VERCEL_PROJECT_PRODUCTION_URL: optional(z.string()),
  VERCEL_URL: optional(z.string()),
  INVITE_CODE: optional(z.string().min(4)),

  ANTHROPIC_API_KEY: optional(z.string()),
  ANTHROPIC_MODEL: optional(z.string()),
  AI_DAILY_LIMIT: optional(z.coerce.number().int().positive()),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Configuration invalide (voir .env.example) :\n${details}`,
    );
  }
  return result.data;
}

const raw = parseEnv();

/** URL publique de l'application (sans slash final). */
function resolveAppUrl(): string | undefined {
  if (raw.BETTER_AUTH_URL) return raw.BETTER_AUTH_URL.replace(/\/$/, "");
  if (raw.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${raw.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return undefined;
}

/** Variables d'environnement serveur, validées au démarrage. */
export const env = {
  NODE_ENV: raw.NODE_ENV,
  DATABASE_URL: raw.DATABASE_URL,
  BETTER_AUTH_SECRET: raw.BETTER_AUTH_SECRET,
  APP_URL: resolveAppUrl(),
  PREVIEW_URL: raw.VERCEL_URL ? `https://${raw.VERCEL_URL}` : undefined,
  INVITE_CODE: raw.INVITE_CODE,
  ANTHROPIC_API_KEY: raw.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: raw.ANTHROPIC_MODEL ?? "claude-opus-5-5",
  /** `null` = aucune limite d'appels IA. */
  AI_DAILY_LIMIT: raw.AI_DAILY_LIMIT ?? null,
} as const;
