import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";

export type DashboardStats = {
  hasProfile: boolean;
  skills: number;
  experiences: number;
  projects: number;
  applications: number;
  genericResumes: number;
  analyses: number;
};

/** Compteurs du tableau de bord, dédupliqués au sein d'une même requête. */
export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const [
    profiles,
    skills,
    experiences,
    projects,
    applications,
    genericResumes,
    analyses,
  ] = await db.$transaction([
    db.profile.count(),
    db.skill.count(),
    db.experience.count(),
    db.project.count(),
    db.application.count(),
    db.resume.count({ where: { kind: "GENERIC" } }),
    db.offerAnalysis.count(),
  ]);

  return {
    hasProfile: profiles > 0,
    skills,
    experiences,
    projects,
    applications,
    genericResumes,
    analyses,
  };
});
