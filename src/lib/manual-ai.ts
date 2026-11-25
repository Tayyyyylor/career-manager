import { z } from "zod";

/**
 * Mode « via mon abonnement » : au lieu d'appeler l'API, l'application
 * prépare une demande que l'utilisateur colle dans claude.ai (ou un autre
 * assistant), puis elle valide la réponse collée avec le même schéma que
 * le mode API.
 */

export const MANUAL_MODEL_LABEL = "via abonnement (copier-coller)";

/** Taille maximale acceptée pour une réponse collée. */
export const MAX_MANUAL_RESPONSE = 200_000;

type BuildManualPromptOptions = {
  /** Consignes générales (identiques au prompt système du mode API). */
  instructions: string;
  /** Données et tâche. */
  body: string;
  /** Schéma de la réponse attendue. */
  schema: z.ZodType;
};

/** Construit le texte à coller dans l'assistant. */
export function buildManualPrompt({ instructions, body, schema }: BuildManualPromptOptions): string {
  const jsonSchema = JSON.stringify(z.toJSONSchema(schema, { target: "draft-2020-12" }), null, 2);

  return [
    "<consignes>",
    instructions.trim(),
    "</consignes>",
    "",
    body.trim(),
    "",
    "## Format de la réponse",
    "Réponds uniquement avec un objet JSON valide, dans un seul bloc de code ```json, sans aucun texte avant ou après.",
    "Il doit respecter exactement ce schéma JSON (noms de champs et valeurs autorisées compris) :",
    "```json",
    jsonSchema,
    "```",
  ].join("\n");
}

export type ManualParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Extrait l'objet JSON d'une réponse collée (bloc de code ou texte libre).
 * `""` signale un objet ouvert mais jamais fermé (réponse coupée).
 */
function extractJson(response: string): string | null {
  const fenced = response.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? response;
  const start = candidate.indexOf("{");
  if (start < 0) return null;
  const end = candidate.lastIndexOf("}");
  return end > start ? candidate.slice(start, end + 1) : "";
}

function describeIssue(issue: z.core.$ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join(".") : "racine";
  return `${path} : ${issue.message}`;
}

/** Valide la réponse collée avec le schéma attendu. */
export function parseManualResponse<S extends z.ZodType>(
  response: string,
  schema: S,
): ManualParseResult<z.output<S>> {
  const trimmed = response.trim();
  if (!trimmed) return { ok: false, error: "Colle la réponse de l'assistant." };
  if (trimmed.length > MAX_MANUAL_RESPONSE) {
    return { ok: false, error: "La réponse est trop longue." };
  }

  const json = extractJson(trimmed);
  if (json === null) {
    return {
      ok: false,
      error: "Aucun objet JSON trouvé. Copie bien toute la réponse, bloc de code compris.",
    };
  }

  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    // Aussi le cas d'un objet ouvert mais jamais fermé (json === "").
    return {
      ok: false,
      error: "Le JSON est invalide ou incomplet (réponse coupée ?). Demande à l'assistant de le renvoyer en entier.",
    };
  }

  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const details = parsed.error.issues.slice(0, 3).map(describeIssue).join(" ; ");
    return {
      ok: false,
      error: `La réponse ne respecte pas le format attendu (${details}). Redemande à l'assistant de suivre exactement le schéma.`,
    };
  }
  return { ok: true, data: parsed.data };
}
