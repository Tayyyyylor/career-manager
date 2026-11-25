import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const getEducations = cache(async () => {
  const user = await requireUser();
  return db.education.findMany({
    where: { userId: user.id },
    orderBy: [{ endDate: { sort: "desc", nulls: "first" } }, { startDate: "desc" }],
  });
});

export type EducationItem = Awaited<ReturnType<typeof getEducations>>[number];
