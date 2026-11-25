"use server";

import { APIError } from "better-auth/api";
import { refresh } from "next/cache";
import { headers } from "next/headers";

import {
  passwordSchema,
  profileSchema,
  type PasswordInput,
  type ProfileInput,
} from "@/features/profile/schemas";
import {
  failure,
  parseInput,
  success,
  type ActionResult,
} from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/forms";
import { requireUser } from "@/lib/session";

export async function saveProfile(input: ProfileInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseInput(profileSchema, input);
  if (!parsed.ok) return parsed.result;

  const { scoreScale, ...fields } = parsed.data;
  const data = {
    firstName: emptyToNull(fields.firstName),
    lastName: emptyToNull(fields.lastName),
    headline: emptyToNull(fields.headline),
    summary: emptyToNull(fields.summary),
    email: emptyToNull(fields.email),
    phone: emptyToNull(fields.phone),
    location: emptyToNull(fields.location),
    websiteUrl: emptyToNull(fields.websiteUrl),
    linkedinUrl: emptyToNull(fields.linkedinUrl),
    githubUrl: emptyToNull(fields.githubUrl),
    scoreScale: Number(scoreScale),
  };

  await db.profile.upsert({
    where: { userId: user.id },
    create: { ...data, userId: user.id },
    update: data,
  });

  refresh();
  return success(undefined, "Profil enregistré.");
}

export async function changePassword(input: PasswordInput): Promise<ActionResult> {
  await requireUser();
  const parsed = parseInput(passwordSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return failure("Mot de passe actuel incorrect.", {
        currentPassword: ["Mot de passe actuel incorrect."],
      });
    }
    throw error;
  }

  return success(undefined, "Mot de passe modifié. Tes autres sessions ont été déconnectées.");
}
