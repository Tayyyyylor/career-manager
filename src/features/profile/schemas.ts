import { z } from "zod";

import {
  optionalEmail,
  optionalText,
  optionalUrl,
} from "@/lib/validation";

export const profileSchema = z.object({
  firstName: optionalText(60),
  lastName: optionalText(60),
  headline: optionalText(120),
  summary: optionalText(2000),
  email: optionalEmail,
  phone: optionalText(30),
  location: optionalText(80),
  websiteUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  scoreScale: z.enum(["100", "20"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis."),
    newPassword: z.string().min(8, "Au moins 8 caractères.").max(128),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    error: "Les mots de passe ne correspondent pas.",
  });

export type PasswordInput = z.infer<typeof passwordSchema>;
