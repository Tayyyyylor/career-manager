"use server";

import { refresh } from "next/cache";

import { educationSchema, type EducationInput } from "@/features/education/schemas";
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

function toData(input: EducationInput) {
  return {
    degree: input.degree,
    institution: input.institution,
    fieldOfStudy: emptyToNull(input.fieldOfStudy),
    location: emptyToNull(input.location),
    startDate: input.startDate ? fromMonthInput(input.startDate) : null,
    endDate: input.endDate ? fromMonthInput(input.endDate) : null,
    description: emptyToNull(input.description),
  };
}

export async function createEducation(input: EducationInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseInput(educationSchema, input);
  if (!parsed.ok) return parsed.result;

  await db.education.create({ data: { ...toData(parsed.data), userId: user.id } });
  refresh();
  return success(undefined, "Formation ajoutée.");
}

export async function updateEducation(id: string, input: EducationInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseInput(educationSchema, input);
  if (!parsed.ok) return parsed.result;

  const { count } = await db.education.updateMany({
    where: { id, userId: user.id },
    data: toData(parsed.data),
  });
  if (count === 0) return failure("Formation introuvable.");

  refresh();
  return success(undefined, "Formation mise à jour.");
}

export async function deleteEducation(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const { count } = await db.education.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return failure("Formation introuvable.");

  refresh();
  return success(undefined, "Formation supprimée.");
}
