import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

import type { AiRequestKind } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/** L'IA est disponible dès qu'une clé API Anthropic est configurée. */
export function isAiEnabled(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

export function getAiModel(): string {
  return env.ANTHROPIC_MODEL;
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly code: "disabled" | "quota" | "refused" | "invalid_output" | "api",
  ) {
    super(message);
    this.name = "AiError";
  }
}

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new AiError("L'IA n'est pas configurée sur ce serveur.", "disabled");
  }
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 110_000 });
  return client;
}

/** Modèles qui acceptent le repli côté serveur en cas de refus. */
function supportsServerFallback(model: string): boolean {
  return /^claude-(opus-5(-5)?|sonnet-5-5|fable-5-[12])$/.test(model);
}

// ─── Quota ───────────────────────────────────────────────────────────────────

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** `limit` et `remaining` valent `null` quand aucune limite n'est configurée. */
export type AiQuota = { limit: number | null; remaining: number | null };

export async function getAiQuota(userId: string): Promise<AiQuota> {
  const limit = env.AI_DAILY_LIMIT;
  if (limit === null) return { limit: null, remaining: null };

  const used = await db.aiRequest.count({
    where: { userId, createdAt: { gte: startOfTodayUtc() } },
  });
  return { limit, remaining: Math.max(0, limit - used) };
}

/** État de l'IA pour l'utilisateur (affichage dans les formulaires). */
export async function getAiAvailability(userId: string) {
  if (!isAiEnabled()) {
    return { enabled: false, remaining: null, limit: env.AI_DAILY_LIMIT, model: getAiModel() };
  }
  const quota = await getAiQuota(userId);
  return { enabled: true, ...quota, model: getAiModel() };
}

async function assertQuota(userId: string) {
  const { remaining, limit } = await getAiQuota(userId);
  if (remaining !== null && remaining <= 0) {
    throw new AiError(
      `Limite quotidienne atteinte (${limit} demandes IA par jour). Réessaie demain ou utilise l'analyse automatique.`,
      "quota",
    );
  }
}

// ─── Génération structurée ───────────────────────────────────────────────────

type GenerateStructuredOptions<S extends z.ZodType> = {
  userId: string;
  kind: AiRequestKind;
  system: string;
  content: Anthropic.Beta.BetaContentBlockParam[];
  schema: S;
};

export type StructuredResult<T> = { data: T; model: string };

/**
 * Appelle Claude et renvoie une sortie JSON validée par le schéma Zod.
 * Vérifie le quota de l'utilisateur et journalise la consommation de tokens.
 */
export async function generateStructured<S extends z.ZodType>({
  userId,
  kind,
  system,
  content,
  schema,
}: GenerateStructuredOptions<S>): Promise<StructuredResult<z.output<S>>> {
  const anthropic = getClient();
  await assertQuota(userId);

  const model = getAiModel();
  const fallback = supportsServerFallback(model)
    ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
    : {};

  let response;
  try {
    response = await anthropic.beta.messages.parse({
      model,
      max_tokens: 16000,
      system,
      messages: [{ role: "user", content }],
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(schema),
      },
      ...fallback,
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AiError("Clé API Anthropic invalide.", "api");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiError("Trop de demandes vers l'IA, réessaie dans un instant.", "api");
    }
    if (error instanceof Anthropic.APIError) {
      throw new AiError(`Erreur de l'API Anthropic (${error.status ?? "réseau"}).`, "api");
    }
    throw error;
  }

  await db.aiRequest.create({
    data: {
      userId,
      kind,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  });

  if (response.stop_reason === "refusal") {
    throw new AiError("L'IA a refusé de traiter cette demande.", "refused");
  }
  if (response.stop_reason === "max_tokens" || !response.parsed_output) {
    throw new AiError("La réponse de l'IA est incomplète ou invalide.", "invalid_output");
  }

  return { data: response.parsed_output as z.output<S>, model: response.model };
}
