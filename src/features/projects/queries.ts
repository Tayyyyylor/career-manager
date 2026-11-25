import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const getProjects = cache(async () => {
  const user = await requireUser();
  return db.project.findMany({
    where: { userId: user.id },
    orderBy: [{ startDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    include: {
      skills: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      experience: { select: { id: true, position: true, company: true } },
    },
  });
});

export type ProjectWithRelations = Awaited<ReturnType<typeof getProjects>>[number];
