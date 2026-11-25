import "server-only";

import type { CandidateProfile } from "@/features/analysis/types";
import { db } from "@/lib/db";

export type CandidateResume = {
  id: string;
  title: string;
  extractedText: string | null;
  fileData: Uint8Array | null;
};

export type CandidateData = {
  candidate: CandidateProfile;
  resume: CandidateResume | null;
  profile: Awaited<ReturnType<typeof loadProfile>>;
  /** Données brutes, pour la génération de CV adaptés. */
  raw: {
    skills: { name: string; category: string; level: string | null }[];
    experiences: Awaited<ReturnType<typeof loadExperiences>>;
    projects: Awaited<ReturnType<typeof loadProjects>>;
    educations: Awaited<ReturnType<typeof loadEducations>>;
  };
};

const loadProfile = (userId: string) => db.profile.findUnique({ where: { userId } });

const loadExperiences = (userId: string) =>
  db.experience.findMany({
    where: { userId },
    orderBy: [{ endDate: { sort: "desc", nulls: "first" } }, { startDate: "desc" }],
    include: { skills: { select: { name: true } } },
  });

const loadProjects = (userId: string) =>
  db.project.findMany({
    where: { userId },
    orderBy: [{ startDate: { sort: "desc", nulls: "last" } }],
    include: { skills: { select: { name: true } } },
  });

const loadEducations = (userId: string) =>
  db.education.findMany({
    where: { userId },
    orderBy: [{ endDate: { sort: "desc", nulls: "first" } }],
  });

async function loadResume(userId: string, resumeId: string | null): Promise<CandidateResume | null> {
  const select = { id: true, title: true, extractedText: true, fileData: true } as const;
  const resume = resumeId
    ? await db.resume.findFirst({ where: { id: resumeId, userId, kind: "GENERIC" }, select })
    : await db.resume.findFirst({
        where: { userId, kind: "GENERIC" },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select,
      });
  if (!resume) return null;
  return {
    ...resume,
    fileData: resume.fileData ? new Uint8Array(resume.fileData) : null,
  };
}

/** Rassemble tout le parcours d'un utilisateur pour l'analyse d'une offre. */
export async function loadCandidate(userId: string, resumeId: string | null): Promise<CandidateData> {
  const [profile, skills, experiences, projects, educations, resume] = await Promise.all([
    loadProfile(userId),
    db.skill.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { name: true, category: true, level: true },
    }),
    loadExperiences(userId),
    loadProjects(userId),
    loadEducations(userId),
    loadResume(userId, resumeId),
  ]);

  const candidate: CandidateProfile = {
    headline: profile?.headline ?? null,
    summary: profile?.summary ?? null,
    skills,
    experiences: experiences.map((experience) => ({
      position: experience.position,
      company: experience.company,
      description: experience.description,
      achievements: experience.achievements,
      skills: experience.skills.map((skill) => skill.name),
      startDate: experience.startDate,
      endDate: experience.endDate,
      employmentType: experience.employmentType,
    })),
    projects: projects.map((project) => ({
      name: project.name,
      description: project.description,
      role: project.role,
      skills: project.skills.map((skill) => skill.name),
    })),
    educations: educations.map((education) => ({
      degree: education.degree,
      fieldOfStudy: education.fieldOfStudy,
      institution: education.institution,
      description: education.description,
    })),
    resumeText: resume?.extractedText ?? null,
  };

  return { candidate, resume, profile, raw: { skills, experiences, projects, educations } };
}
