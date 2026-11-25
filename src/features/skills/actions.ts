"use server";

import { refresh } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import {
  bulkSkillsSchema,
  skillSchema,
  splitSkillNames,
  type BulkSkillsInput,
  type SkillInput,
} from "@/features/skills/schemas";
import { inferSkillCategory } from "@/features/analysis/engine/skills";
import { AUTO_CATEGORY, NO_LEVEL } from "@/features/skills/constants";
import {
  failure,
  parseInput,
  success,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

function toData(input: SkillInput) {
  return {
    name: input.name,
    category: input.category,
    level: input.level === NO_LEVEL ? null : input.level,
  };
}

const DUPLICATE = "Cette compétence existe déjà.";

/** L'unicité en base est sensible à la casse : on vérifie aussi « React » / « react ». */
async function nameTaken(userId: string, name: string, exceptId?: string): Promise<boolean> {
  const existing = await db.skill.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  return existing !== null;
}

export async function createSkill(input: SkillInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseInput(skillSchema, input);
  if (!parsed.ok) return parsed.result;
  if (await nameTaken(user.id, parsed.data.name)) return failure(DUPLICATE, { name: [DUPLICATE] });

  try {
    await db.skill.create({ data: { ...toData(parsed.data), userId: user.id } });
  } catch (error) {
    if (isUniqueViolation(error)) return failure(DUPLICATE, { name: [DUPLICATE] });
    throw error;
  }

  refresh();
  return success(undefined, "Compétence ajoutée.");
}

export async function updateSkill(id: string, input: SkillInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseInput(skillSchema, input);
  if (!parsed.ok) return parsed.result;
  if (await nameTaken(user.id, parsed.data.name, id)) {
    return failure(DUPLICATE, { name: [DUPLICATE] });
  }

  try {
    const { count } = await db.skill.updateMany({
      where: { id, userId: user.id },
      data: toData(parsed.data),
    });
    if (count === 0) return failure("Compétence introuvable.");
  } catch (error) {
    if (isUniqueViolation(error)) return failure(DUPLICATE, { name: [DUPLICATE] });
    throw error;
  }

  refresh();
  return success(undefined, "Compétence mise à jour.");
}

export async function deleteSkill(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const { count } = await db.skill.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return failure("Compétence introuvable.");

  refresh();
  return success(undefined, "Compétence supprimée.");
}

export async function createSkillsBulk(
  input: BulkSkillsInput,
): Promise<ActionResult<{ created: number; skipped: number }>> {
  const user = await requireUser();
  const parsed = parseInput(bulkSkillsSchema, input);
  if (!parsed.ok) return parsed.result;

  const names = splitSkillNames(parsed.data.names);
  if (names.length === 0) return failure("Aucune compétence valide.");

  const existing = await db.skill.findMany({
    where: { userId: user.id },
    select: { name: true },
  });
  const known = new Set(existing.map((skill) => skill.name.toLowerCase()));
  const toCreate = names.filter((name) => !known.has(name.toLowerCase()));

  if (toCreate.length > 0) {
    const { category } = parsed.data;
    await db.skill.createMany({
      data: toCreate.map((name) => ({
        name,
        category:
          category === AUTO_CATEGORY ? (inferSkillCategory(name) ?? "TECHNICAL") : category,
        userId: user.id,
      })),
      skipDuplicates: true,
    });
  }

  refresh();
  const skipped = names.length - toCreate.length;
  return success(
    { created: toCreate.length, skipped },
    `${toCreate.length} compétence(s) ajoutée(s)${skipped ? `, ${skipped} déjà présente(s)` : ""}.`,
  );
}
