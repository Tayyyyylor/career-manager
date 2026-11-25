"use server";

import { refresh } from "next/cache";

import { NO_EMPLOYMENT_TYPE } from "@/features/experiences/constants";
import {
  experienceSchema,
  splitLines,
  type ExperienceInput,
} from "@/features/experiences/schemas";
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

async function toData(userId: string, input: ExperienceInput) {
  const skillIds = await resolveSkillIds(userId, input.skillIds, input.newSkills);
  return {
    fields: {
      position: input.position,
      company: input.company,
      location: emptyToNull(input.location),
      employmentType:
        input.employmentType === NO_EMPLOYMENT_TYPE ? null : input.employmentType,
      startDate: fromMonthInput(input.startDate),
      endDate: input.current || !input.endDate ? null : fromMonthInput(input.endDate),
      description: emptyToNull(input.description),
      achievements: splitLines(input.achievements),
    },
    skillIds,
  };
}

export async function createExperience(input: ExperienceInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseInput(experienceSchema, input);
  if (!parsed.ok) return parsed.result;

  const { fields, skillIds } = await toData(user.id, parsed.data);
  await db.experience.create({
    data: {
      ...fields,
      userId: user.id,
      skills: { connect: skillIds.map((id) => ({ id })) },
    },
  });

  refresh();
  return success(undefined, "Expérience ajoutée.");
}

export async function updateExperience(
  id: string,
  input: ExperienceInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseInput(experienceSchema, input);
  if (!parsed.ok) return parsed.result;

  const existing = await db.experience.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return failure("Expérience introuvable.");

  const { fields, skillIds } = await toData(user.id, parsed.data);
  await db.experience.update({
    where: { id },
    data: { ...fields, skills: { set: skillIds.map((skillId) => ({ id: skillId })) } },
  });

  refresh();
  return success(undefined, "Expérience mise à jour.");
}

export async function deleteExperience(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const { count } = await db.experience.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return failure("Expérience introuvable.");

  refresh();
  return success(undefined, "Expérience supprimée.");
}
