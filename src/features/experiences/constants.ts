import { EmploymentType } from "@/generated/prisma/enums";

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "CDI / temps plein",
  PART_TIME: "Temps partiel",
  FREELANCE: "Freelance",
  INTERNSHIP: "Stage",
  APPRENTICESHIP: "Alternance",
  TEMPORARY: "CDD / intérim",
};

export const NO_EMPLOYMENT_TYPE = "NONE";

export const employmentTypeOptions = [
  { value: NO_EMPLOYMENT_TYPE, label: "Non précisé" },
  ...Object.values(EmploymentType).map((value) => ({
    value,
    label: EMPLOYMENT_TYPE_LABELS[value],
  })),
];
