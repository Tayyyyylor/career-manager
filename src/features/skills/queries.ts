import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const getSkills = cache(async () => {
  const user = await requireUser();
  return db.skill.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { experiences: true, projects: true } } },
  });
});

export type SkillWithUsage = Awaited<ReturnType<typeof getSkills>>[number];

/** Liste légère pour les sélecteurs (expériences, projets). */
export const getSkillOptions = cache(async () => {
  const user = await requireUser();
  return db.skill.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  });
});

export type SkillOption = Awaited<ReturnType<typeof getSkillOptions>>[number];
