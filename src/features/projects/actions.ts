"use server";

import { refresh } from "next/cache";

import {
  NO_EXPERIENCE,
  projectSchema,
  type ProjectInput,
} from "@/features/projects/schemas";
import { resolveSkillIds } from "@/features/skills/server";
import {
  failure,
  parseInput,
  success,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/lib/db";
import { fromMonthInput } from "@/lib/format";
import { emptyToNull } from "@/lib/forms";
import { requireUser } from "@/lib/session";

async function toData(userId: string, input: ProjectInput) {
  let experienceId: string | null = null;
  if (input.experienceId !== NO_EXPERIENCE) {
    const experience = await db.experience.findFirst({
      where: { id: input.experienceId, userId },
      select: { id: true },
    });
    experienceId = experience?.id ?? null;
  }

  return {
    fields: {
      name: input.name,
      role: emptyToNull(input.role),
      description: emptyToNull(input.description),
      url: emptyToNull(input.url),
      repositoryUrl: emptyToNull(input.repositoryUrl),
      startDate: input.startDate ? fromMonthInput(input.startDate) : null,
      endDate: input.endDate ? fromMonthInput(input.endDate) : null,
      experienceId,
    },
    skillIds: await resolveSkillIds(userId, input.skillIds, input.newSkills),
  };
}

export async function createProject(input: ProjectInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseInput(projectSchema, input);
  if (!parsed.ok) return parsed.result;

  const { fields, skillIds } = await toData(user.id, parsed.data);
  await db.project.create({
    data: { ...fields, userId: user.id, skills: { connect: skillIds.map((id) => ({ id })) } },
  });

  refresh();
  return success(undefined, "Projet ajouté.");
}

export async function updateProject(id: string, input: ProjectInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseInput(projectSchema, input);
  if (!parsed.ok) return parsed.result;

  const existing = await db.project.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return failure("Projet introuvable.");

  const { fields, skillIds } = await toData(user.id, parsed.data);
  await db.project.update({
    where: { id },
    data: { ...fields, skills: { set: skillIds.map((skillId) => ({ id: skillId })) } },
  });

  refresh();
  return success(undefined, "Projet mis à jour.");
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const { count } = await db.project.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return failure("Projet introuvable.");

  refresh();
  return success(undefined, "Projet supprimé.");
}
