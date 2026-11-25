import { z } from "zod";

/** Texte optionnel (chaîne vide autorisée) avec longueur maximale. */
export const optionalText = (max: number) =>
  z.string().trim().max(max, `${max} caractères maximum.`);

/** Texte requis avec longueur maximale. */
export const requiredText = (max: number, message = "Champ requis.") =>
  z.string().trim().min(1, message).max(max, `${max} caractères maximum.`);

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** URL http(s) optionnelle. */
export const optionalUrl = z
  .string()
  .trim()
  .max(500, "500 caractères maximum.")
  .refine((value) => value === "" || isHttpUrl(value), "URL invalide (ex. https://…).");

/** Email optionnel. */
export const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Adresse email invalide.",
  );

/** Mois au format "AAAA-MM" (champ <input type="month">). */
export const monthString = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Date invalide.");

export const optionalMonthString = z.union([z.literal(""), monthString]);
