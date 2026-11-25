import { SkillCategory, SkillLevel } from "@/generated/prisma/enums";

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  TECHNICAL: "Techniques",
  TOOL: "Outils & logiciels",
  METHODOLOGY: "Méthodes",
  SOFT: "Savoir-être",
  LANGUAGE: "Langues",
  OTHER: "Autres",
};

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  BEGINNER: "Notions",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

export const SKILL_CATEGORIES = Object.values(SkillCategory);
export const SKILL_LEVELS = Object.values(SkillLevel);

export const skillCategoryOptions = SKILL_CATEGORIES.map((value) => ({
  value,
  label: SKILL_CATEGORY_LABELS[value],
}));

export const NO_LEVEL = "NONE";

/** Ajout rapide : catégorie déduite du nom quand la compétence est connue. */
export const AUTO_CATEGORY = "AUTO";

export const bulkCategoryOptions = [
  { value: AUTO_CATEGORY, label: "Détection automatique" },
  ...skillCategoryOptions,
];

export const skillLevelOptions = [
  { value: NO_LEVEL, label: "Non précisé" },
  ...SKILL_LEVELS.map((value) => ({ value, label: SKILL_LEVEL_LABELS[value] })),
];
