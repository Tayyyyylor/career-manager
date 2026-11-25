import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

/** Champs listés (jamais le contenu binaire du PDF). */
const listSelect = {
  id: true,
  title: true,
  kind: true,
  isDefault: true,
  fileName: true,
  fileSize: true,
  method: true,
  createdAt: true,
  updatedAt: true,
  extractedText: true,
  jobOffer: { select: { id: true, title: true, company: true } },
} as const;

export const getResumes = cache(async () => {
  const user = await requireUser();
  return db.resume.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: listSelect,
  });
});

export type ResumeListItem = Awaited<ReturnType<typeof getResumes>>[number];

/** CV génériques importés, pour les sélecteurs d'analyse. */
export const getGenericResumeOptions = cache(async () => {
  const user = await requireUser();
  return db.resume.findMany({
    where: { userId: user.id, kind: "GENERIC" },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true, isDefault: true },
  });
});

/** CV adapté avec son contenu structuré. */
export const getTailoredResume = cache(async (id: string) => {
  const user = await requireUser();
  return db.resume.findFirst({
    where: { id, userId: user.id, kind: "TAILORED" },
    select: {
      id: true,
      title: true,
      content: true,
      method: true,
      createdAt: true,
      jobOffer: { select: { id: true, title: true, company: true } },
    },
  });
});
