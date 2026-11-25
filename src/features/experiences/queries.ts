import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const getExperiences = cache(async () => {
  const user = await requireUser();
  return db.experience.findMany({
    where: { userId: user.id },
    orderBy: [{ endDate: { sort: "desc", nulls: "first" } }, { startDate: "desc" }],
    include: {
      skills: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      _count: { select: { projects: true } },
    },
  });
});

export type ExperienceWithSkills = Awaited<ReturnType<typeof getExperiences>>[number];

/** Liste légère pour le sélecteur d'expérience des projets. */
export const getExperienceOptions = cache(async () => {
  const user = await requireUser();
  return db.experience.findMany({
    where: { userId: user.id },
    orderBy: { startDate: "desc" },
    select: { id: true, position: true, company: true },
  });
});
