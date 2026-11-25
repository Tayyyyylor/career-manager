import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const getApplications = cache(async () => {
  const user = await requireUser();
  return db.application.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      jobOffer: {
        select: {
          id: true,
          title: true,
          analyses: { orderBy: { createdAt: "desc" }, take: 1, select: { score: true } },
        },
      },
      resume: { select: { id: true, title: true, kind: true } },
    },
  });
});

export type ApplicationItem = Awaited<ReturnType<typeof getApplications>>[number];

/** Choix possibles pour lier une candidature à une offre ou un CV. */
export const getApplicationLinkOptions = cache(async () => {
  const user = await requireUser();
  const [offers, resumes] = await Promise.all([
    db.jobOffer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, title: true, company: true },
    }),
    db.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);
  return { offers, resumes };
});

export type ApplicationLinkOptions = Awaited<ReturnType<typeof getApplicationLinkOptions>>;
