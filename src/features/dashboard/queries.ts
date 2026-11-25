import "server-only";

import { cache } from "react";

import { ACTIVE_STATUSES } from "@/features/applications/constants";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export type DashboardStats = {
  hasProfile: boolean;
  skills: number;
  experiences: number;
  projects: number;
  offers: number;
  activeApplications: number;
  genericResumes: number;
  analyses: number;
  averageScore: number | null;
};

/** Compteurs du tableau de bord de l'utilisateur connecté. */
export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const user = await requireUser();
  const userId = user.id;

  const [
    profile,
    skills,
    experiences,
    projects,
    offers,
    activeApplications,
    genericResumes,
    analysisStats,
  ] = await db.$transaction([
    db.profile.findUnique({ where: { userId }, select: { firstName: true, headline: true } }),
    db.skill.count({ where: { userId } }),
    db.experience.count({ where: { userId } }),
    db.project.count({ where: { userId } }),
    db.jobOffer.count({ where: { userId } }),
    db.application.count({ where: { userId, status: { in: [...ACTIVE_STATUSES] } } }),
    db.resume.count({ where: { userId, kind: "GENERIC" } }),
    db.offerAnalysis.aggregate({
      where: { jobOffer: { userId } },
      _count: { _all: true },
      _avg: { score: true },
    }),
  ]);

  return {
    hasProfile: Boolean(profile?.firstName || profile?.headline),
    skills,
    experiences,
    projects,
    offers,
    activeApplications,
    genericResumes,
    analyses: analysisStats._count._all,
    averageScore: analysisStats._avg.score === null ? null : Math.round(analysisStats._avg.score),
  };
});

/** Dernières offres analysées, avec leur note la plus récente. */
export const getRecentAnalyses = cache(async () => {
  const user = await requireUser();
  const offers = await db.jobOffer.findMany({
    where: { userId: user.id, analyses: { some: {} } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      company: true,
      analyses: { orderBy: { createdAt: "desc" }, take: 1, select: { score: true } },
    },
  });
  return offers.map(({ analyses, ...offer }) => ({ ...offer, score: analyses[0]?.score ?? 0 }));
});
