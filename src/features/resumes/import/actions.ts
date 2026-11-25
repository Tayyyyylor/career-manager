"use server";

import { refresh } from "next/cache";

import { inferSkillCategory } from "@/features/analysis/engine/skills";
import type { Prisma } from "@/generated/prisma/client";
import { failure, parseInput, success, type ActionResult } from "@/lib/action-result";
import { AiError, isAiEnabled } from "@/lib/ai";
import { db } from "@/lib/db";
import { fromMonthInput, toMonthInput } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { optionalEmail, optionalUrl } from "@/lib/validation";

import { buildManualPrompt, parseManualResponse } from "@/lib/manual-ai";

import {
  aiImportSchema,
  buildImportManualBody,
  extractWithAi,
  IMPORT_SYSTEM_PROMPT,
  toImportData,
} from "./ai";
import { extractWithRules } from "./rules";
import {
  educationKey,
  experienceKey,
  importDataSchema,
  PROFILE_FIELDS,
  type ExistingData,
  type ImportData,
  type ImportProposal,
} from "./types";

async function loadExisting(userId: string): Promise<ExistingData> {
  const [profile, skills, experiences, projects, educations] = await Promise.all([
    db.profile.findUnique({ where: { userId } }),
    db.skill.findMany({ where: { userId }, select: { name: true } }),
    db.experience.findMany({ where: { userId }, select: { position: true, company: true, startDate: true } }),
    db.project.findMany({ where: { userId }, select: { name: true } }),
    db.education.findMany({ where: { userId }, select: { degree: true, institution: true } }),
  ]);

  return {
    profile: Object.fromEntries(
      PROFILE_FIELDS.map((field) => [field, profile?.[field] ?? null]),
    ) as ExistingData["profile"],
    skillNames: skills.map((skill) => skill.name.toLowerCase()),
    experienceKeys: experiences.map((experience) =>
      experienceKey({ ...experience, startDate: toMonthInput(experience.startDate) }),
    ),
    projectNames: projects.map((project) => project.name.toLowerCase()),
    educationKeys: educations.map(educationKey),
  };
}

/** Lit un CV générique et propose les données à importer (rien n'est enregistré). */
export async function extractFromResume(
  resumeId: string,
  method: "RULES" | "AI",
): Promise<ActionResult<ImportProposal & { fallbackReason: string | null }>> {
  const user = await requireUser();
  if (method !== "RULES" && method !== "AI") return failure("Méthode invalide.");

  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId: user.id, kind: "GENERIC" },
    select: { extractedText: true, fileData: true },
  });
  if (!resume) return failure("CV introuvable.");

  let data: ImportData | undefined;
  let usedMethod: "RULES" | "AI" = "RULES";
  let fallbackReason: string | null = null;

  if (method === "AI") {
    if (!isAiEnabled()) {
      fallbackReason = "L'IA n'est pas configurée sur ce serveur.";
    } else {
      try {
        data = (
          await extractWithAi(user.id, {
            fileData: resume.fileData ? new Uint8Array(resume.fileData) : null,
            extractedText: resume.extractedText,
          })
        ).data;
        usedMethod = "AI";
      } catch (error) {
        if (!(error instanceof AiError)) throw error;
        fallbackReason = error.message;
      }
    }
  }

  if (!data) {
    if (!resume.extractedText) {
      return failure(
        "Aucun texte n'a pu être lu dans ce PDF (image scannée ?). Seule l'extraction par IA peut le lire.",
      );
    }
    data = extractWithRules(resume.extractedText);
  }

  return success({
    method: usedMethod,
    data,
    existing: await loadExisting(user.id),
    fallbackReason,
  });
}

/** Demande d'extraction à coller dans claude.ai (mode « via mon abonnement »). */
export async function getManualImportPrompt(
  resumeId: string,
): Promise<ActionResult<{ prompt: string }>> {
  const user = await requireUser();
  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId: user.id, kind: "GENERIC" },
    select: { extractedText: true },
  });
  if (!resume) return failure("CV introuvable.");

  return success({
    prompt: buildManualPrompt({
      instructions: IMPORT_SYSTEM_PROMPT,
      body: buildImportManualBody(resume.extractedText),
      schema: aiImportSchema,
    }),
  });
}

/** Valide la réponse collée et renvoie la proposition d'import (rien n'est enregistré). */
export async function submitManualImport(
  resumeId: string,
  response: string,
): Promise<ActionResult<ImportProposal & { fallbackReason: string | null }>> {
  const user = await requireUser();
  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId: user.id, kind: "GENERIC" },
    select: { id: true },
  });
  if (!resume) return failure("CV introuvable.");

  const parsed = parseManualResponse(response, aiImportSchema);
  if (!parsed.ok) return failure(parsed.error);

  return success({
    method: "AI",
    data: toImportData(parsed.data),
    existing: await loadExisting(user.id),
    fallbackReason: null,
  });
}

/** Retourne les identifiants des compétences nommées, en créant celles qui manquent. */
async function skillIdsFor(
  tx: Prisma.TransactionClient,
  userId: string,
  cache: Map<string, string>,
  names: readonly string[],
): Promise<string[]> {
  const ids = new Set<string>();
  for (const raw of names) {
    const name = raw.trim().slice(0, 60);
    const key = name.toLowerCase();
    if (!name) continue;
    let id = cache.get(key);
    if (!id) {
      const created = await tx.skill.create({
        data: { userId, name, category: inferSkillCategory(name) ?? "TECHNICAL" },
        select: { id: true },
      });
      id = created.id;
      cache.set(key, id);
    }
    ids.add(id);
  }
  return [...ids];
}

const isValidEmail = (value: string) => optionalEmail.safeParse(value).success;
const isValidUrl = (value: string) => optionalUrl.safeParse(value).success;

/** Enregistre la sélection faite dans l'aperçu d'import. */
export async function applyResumeImport(
  input: ImportData,
): Promise<ActionResult<{ summary: string }>> {
  const user = await requireUser();
  const parsed = parseInput(importDataSchema, input);
  if (!parsed.ok) return parsed.result;
  const data = parsed.data;
  const existing = await loadExisting(user.id);

  const counts = { profile: 0, skills: 0, experiences: 0, projects: 0, educations: 0 };

  await db.$transaction(async (tx) => {
    // ─── Profil : uniquement les champs sélectionnés et valides ──────────────
    const profileData: Partial<Record<(typeof PROFILE_FIELDS)[number], string>> = {};
    for (const field of PROFILE_FIELDS) {
      const value = data.profile[field];
      if (!value) continue;
      if (field === "email" && !isValidEmail(value)) continue;
      if (field.endsWith("Url") && !isValidUrl(value)) continue;
      profileData[field] = value;
    }
    counts.profile = Object.keys(profileData).length;
    if (counts.profile > 0) {
      await tx.profile.upsert({
        where: { userId: user.id },
        create: { ...profileData, userId: user.id },
        update: profileData,
      });
    }

    // ─── Compétences ─────────────────────────────────────────────────────────
    const owned = await tx.skill.findMany({ where: { userId: user.id }, select: { id: true, name: true } });
    const skillCache = new Map(owned.map((skill) => [skill.name.toLowerCase(), skill.id]));
    for (const skill of data.skills) {
      const key = skill.name.toLowerCase();
      if (skillCache.has(key)) continue;
      const created = await tx.skill.create({
        data: { userId: user.id, name: skill.name, category: skill.category, level: skill.level },
        select: { id: true },
      });
      skillCache.set(key, created.id);
      counts.skills += 1;
    }

    // ─── Expériences ─────────────────────────────────────────────────────────
    const experienceKeys = new Set(existing.experienceKeys);
    for (const experience of data.experiences) {
      const key = experienceKey(experience);
      if (experienceKeys.has(key)) continue;
      experienceKeys.add(key);
      const ids = await skillIdsFor(tx, user.id, skillCache, experience.skills);
      await tx.experience.create({
        data: {
          userId: user.id,
          position: experience.position,
          company: experience.company,
          location: experience.location,
          employmentType: experience.employmentType,
          startDate: fromMonthInput(experience.startDate),
          endDate: experience.endDate ? fromMonthInput(experience.endDate) : null,
          description: experience.description,
          achievements: experience.achievements.filter(Boolean),
          skills: { connect: ids.map((id) => ({ id })) },
        },
      });
      counts.experiences += 1;
    }

    // ─── Projets ─────────────────────────────────────────────────────────────
    const projectNames = new Set(existing.projectNames);
    for (const project of data.projects) {
      const key = project.name.toLowerCase();
      if (projectNames.has(key)) continue;
      projectNames.add(key);
      const ids = await skillIdsFor(tx, user.id, skillCache, project.skills);
      await tx.project.create({
        data: {
          userId: user.id,
          name: project.name,
          role: project.role,
          description: project.description,
          url: project.url && isValidUrl(project.url) ? project.url : null,
          startDate: project.startDate ? fromMonthInput(project.startDate) : null,
          endDate: project.endDate ? fromMonthInput(project.endDate) : null,
          skills: { connect: ids.map((id) => ({ id })) },
        },
      });
      counts.projects += 1;
    }

    // ─── Formations ──────────────────────────────────────────────────────────
    const educationKeys = new Set(existing.educationKeys);
    for (const education of data.educations) {
      const key = educationKey(education);
      if (educationKeys.has(key)) continue;
      educationKeys.add(key);
      await tx.education.create({
        data: {
          userId: user.id,
          degree: education.degree,
          institution: education.institution,
          fieldOfStudy: education.fieldOfStudy,
          location: education.location,
          startDate: education.startDate ? fromMonthInput(education.startDate) : null,
          endDate: education.endDate ? fromMonthInput(education.endDate) : null,
          description: education.description,
        },
      });
      counts.educations += 1;
    }
  }, { timeout: 20_000 });

  const parts = [
    counts.profile ? `${counts.profile} info(s) de profil` : null,
    counts.skills ? `${counts.skills} compétence(s)` : null,
    counts.experiences ? `${counts.experiences} expérience(s)` : null,
    counts.projects ? `${counts.projects} projet(s)` : null,
    counts.educations ? `${counts.educations} formation(s)` : null,
  ].filter(Boolean);

  if (parts.length === 0) return failure("Rien à importer : tout est déjà présent.");

  refresh();
  const summary = `Importé : ${parts.join(", ")}.`;
  return success({ summary }, summary);
}
