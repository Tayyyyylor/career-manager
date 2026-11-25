import "server-only";

import { inferSkillCategory } from "@/features/analysis/engine/skills";
import { splitSkillNames } from "@/features/skills/schemas";
import { db } from "@/lib/db";

/**
 * Résout la liste finale des compétences à associer : ne garde que les
 * compétences appartenant à l'utilisateur et crée celles saisies librement.
 */
export async function resolveSkillIds(
  userId: string,
  skillIds: readonly string[],
  newSkillNames: string,
): Promise<string[]> {
  const owned = skillIds.length
    ? await db.skill.findMany({
        where: { userId, id: { in: [...skillIds] } },
        select: { id: true },
      })
    : [];
  const ids = new Set(owned.map((skill) => skill.id));

  for (const name of splitSkillNames(newSkillNames)) {
    const existing = await db.skill.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
    const skill =
      existing ??
      (await db.skill.create({
        data: { userId, name, category: inferSkillCategory(name) ?? "TECHNICAL" },
        select: { id: true },
      }));
    ids.add(skill.id);
  }

  return [...ids];
}
