"use server";

import { refresh } from "next/cache";

import {
  applicationSchema,
  NO_LINK,
  type ApplicationInput,
} from "@/features/applications/schemas";
import { ApplicationStatus } from "@/generated/prisma/enums";
import {
  failure,
  parseInput,
  success,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/lib/db";
import { emptyToNull } from "@/lib/forms";
import { requireUser } from "@/lib/session";

/** Ne conserve que les liens vers des offres / CV appartenant à l'utilisateur. */
async function toData(userId: string, input: ApplicationInput) {
  const [offer, resume] = await Promise.all([
    input.jobOfferId === NO_LINK
      ? null
      : db.jobOffer.findFirst({ where: { id: input.jobOfferId, userId }, select: { id: true } }),
    input.resumeId === NO_LINK
      ? null
      : db.resume.findFirst({ where: { id: input.resumeId, userId }, select: { id: true } }),
  ]);

  // Une candidature envoyée sans date prend la date du jour.
  const appliedAt = input.appliedAt
    ? new Date(`${input.appliedAt}T00:00:00.000Z`)
    : input.status !== "TO_APPLY"
      ? new Date(new Date().toISOString().slice(0, 10))
      : null;

  return {
    company: input.company,
    position: input.position,
    status: input.status,
    appliedAt,
    url: emptyToNull(input.url),
    notes: emptyToNull(input.notes),
    jobOfferId: offer?.id ?? null,
    resumeId: resume?.id ?? null,
  };
}

export async function createApplication(input: ApplicationInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseInput(applicationSchema, input);
  if (!parsed.ok) return parsed.result;

  await db.application.create({ data: { ...(await toData(user.id, parsed.data)), userId: user.id } });
  refresh();
  return success(undefined, "Candidature ajoutée.");
}

export async function updateApplication(id: string, input: ApplicationInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseInput(applicationSchema, input);
  if (!parsed.ok) return parsed.result;

  const { count } = await db.application.updateMany({
    where: { id, userId: user.id },
    data: await toData(user.id, parsed.data),
  });
  if (count === 0) return failure("Candidature introuvable.");

  refresh();
  return success(undefined, "Candidature mise à jour.");
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!Object.values(ApplicationStatus).includes(status)) return failure("Statut invalide.");

  const application = await db.application.findFirst({
    where: { id, userId: user.id },
    select: { appliedAt: true },
  });
  if (!application) return failure("Candidature introuvable.");

  await db.application.update({
    where: { id },
    data: {
      status,
      appliedAt:
        application.appliedAt ??
        (status !== "TO_APPLY" ? new Date(new Date().toISOString().slice(0, 10)) : null),
    },
  });

  refresh();
  return success(undefined, "Statut mis à jour.");
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const { count } = await db.application.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return failure("Candidature introuvable.");

  refresh();
  return success(undefined, "Candidature supprimée.");
}
