import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

/** Reporte les erreurs de validation renvoyées par une Server Action sur le formulaire. */
export function applyFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldErrors: Record<string, string[] | undefined> | undefined,
) {
  if (!fieldErrors) return;
  for (const [name, messages] of Object.entries(fieldErrors)) {
    const message = messages?.[0];
    if (message) form.setError(name as Path<T>, { type: "server", message });
  }
}

/** Chaîne vide → `null` (champs optionnels côté base). */
export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
