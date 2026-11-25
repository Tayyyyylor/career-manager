import { z } from "zod";

export const signInSchema = z.object({
  email: z.email({ error: "Adresse email invalide." }),
  password: z.string().min(1, "Mot de passe requis."),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Au moins 2 caractères.").max(80),
  email: z.email({ error: "Adresse email invalide." }),
  password: z
    .string()
    .min(8, "Au moins 8 caractères.")
    .max(128, "128 caractères maximum."),
  inviteCode: z.string().trim().min(1, "Code d'invitation requis."),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

/** N'accepte que des chemins internes pour la redirection après connexion. */
export function safeRedirectPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
}
