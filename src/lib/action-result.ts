import { z } from "zod";

/** Résultat standard d'une Server Action, sérialisable vers le client. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export function success<T = undefined>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data: data as T, message };
}

export function failure(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Valide une entrée avec un schéma Zod et renvoie un échec lisible si besoin. */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
):
  | { ok: true; data: z.output<S> }
  | { ok: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };

  const { fieldErrors } = z.flattenError(parsed.error);
  return {
    ok: false,
    result: failure(
      "Certains champs sont invalides.",
      fieldErrors as Record<string, string[] | undefined>,
    ),
  };
}
