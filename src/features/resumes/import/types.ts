import { z } from "zod";

import { EmploymentType, SkillCategory, SkillLevel } from "@/generated/prisma/enums";

/** Mois au format "AAAA-MM". */
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => text(max).nullable();

export const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "headline",
  "summary",
  "email",
  "phone",
  "location",
  "linkedinUrl",
  "githubUrl",
  "websiteUrl",
] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number];

export const PROFILE_FIELD_LABELS: Record<ProfileField, string> = {
  firstName: "Prénom",
  lastName: "Nom",
  headline: "Titre",
  summary: "Présentation",
  email: "Email",
  phone: "Téléphone",
  location: "Localisation",
  linkedinUrl: "LinkedIn",
  githubUrl: "GitHub",
  websiteUrl: "Site / portfolio",
};

const PROFILE_MAX: Record<ProfileField, number> = {
  firstName: 60,
  lastName: 60,
  headline: 120,
  summary: 2000,
  email: 200,
  phone: 30,
  location: 80,
  linkedinUrl: 500,
  githubUrl: 500,
  websiteUrl: 500,
};

export const importedProfileSchema = z.object(
  Object.fromEntries(PROFILE_FIELDS.map((field) => [field, optionalText(PROFILE_MAX[field])])) as {
    [K in ProfileField]: z.ZodNullable<z.ZodString>;
  },
);

export const importedSkillSchema = z.object({
  name: text(60).min(1),
  category: z.enum(SkillCategory),
  level: z.enum(SkillLevel).nullable(),
});

export const importedExperienceSchema = z.object({
  position: text(120).min(1),
  company: text(120).min(1),
  location: optionalText(80),
  employmentType: z.enum(EmploymentType).nullable(),
  startDate: month,
  /** `null` = poste en cours. */
  endDate: month.nullable(),
  description: optionalText(3000),
  achievements: z.array(text(500)).max(20),
  skills: z.array(text(60)).max(40),
});

export const importedProjectSchema = z.object({
  name: text(120).min(1),
  role: optionalText(120),
  description: optionalText(3000),
  url: optionalText(500),
  startDate: month.nullable(),
  endDate: month.nullable(),
  skills: z.array(text(60)).max(40),
});

export const importedEducationSchema = z.object({
  degree: text(160).min(1),
  institution: text(160).min(1),
  fieldOfStudy: optionalText(120),
  location: optionalText(80),
  startDate: month.nullable(),
  endDate: month.nullable(),
  description: optionalText(2000),
});

/** Données extraites d'un CV (proposition) ou sélectionnées pour l'import. */
export const importDataSchema = z.object({
  profile: importedProfileSchema,
  skills: z.array(importedSkillSchema).max(150),
  experiences: z.array(importedExperienceSchema).max(30),
  projects: z.array(importedProjectSchema).max(30),
  educations: z.array(importedEducationSchema).max(20),
});

export type ImportedProfile = z.infer<typeof importedProfileSchema>;
export type ImportedSkill = z.infer<typeof importedSkillSchema>;
export type ImportedExperience = z.infer<typeof importedExperienceSchema>;
export type ImportedProject = z.infer<typeof importedProjectSchema>;
export type ImportedEducation = z.infer<typeof importedEducationSchema>;
export type ImportData = z.infer<typeof importDataSchema>;

export const emptyProfile = (): ImportedProfile =>
  Object.fromEntries(PROFILE_FIELDS.map((field) => [field, null])) as ImportedProfile;

/** Nettoie les valeurs extraites et les tronque à la longueur autorisée. */
export function clampProfile(profile: Record<ProfileField, string | null>): ImportedProfile {
  const result = emptyProfile();
  for (const field of PROFILE_FIELDS) {
    const value = profile[field]?.trim();
    result[field] = value ? value.slice(0, PROFILE_MAX[field]) : null;
  }
  return result;
}

/** Ce qui existe déjà, pour pré-cocher uniquement les nouveautés. */
export type ExistingData = {
  profile: ImportedProfile;
  /** Noms de compétences en minuscules. */
  skillNames: string[];
  /** Clés « poste|entreprise|AAAA-MM » en minuscules. */
  experienceKeys: string[];
  projectNames: string[];
  /** Clés « diplôme|établissement » en minuscules. */
  educationKeys: string[];
};

export const experienceKey = (e: { position: string; company: string; startDate: string }) =>
  `${e.position}|${e.company}|${e.startDate}`.toLowerCase();

export const educationKey = (e: { degree: string; institution: string }) =>
  `${e.degree}|${e.institution}`.toLowerCase();

export type ImportProposal = {
  method: "RULES" | "AI";
  data: ImportData;
  existing: ExistingData;
};
