import { z } from "zod";

import {
  optionalMonthString,
  optionalText,
  optionalUrl,
  requiredText,
} from "@/lib/validation";

export const NO_EXPERIENCE = "NONE";

export const projectSchema = z
  .object({
    name: requiredText(120, "Nom du projet requis."),
    role: optionalText(120),
    description: optionalText(3000),
    url: optionalUrl,
    repositoryUrl: optionalUrl,
    startDate: optionalMonthString,
    endDate: optionalMonthString,
    experienceId: z.string(),
    skillIds: z.array(z.string()).max(60),
    newSkills: optionalText(500),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "La date de fin précède la date de début.",
      });
    }
  });

export type ProjectInput = z.infer<typeof projectSchema>;

export const emptyProject: ProjectInput = {
  name: "",
  role: "",
  description: "",
  url: "",
  repositoryUrl: "",
  startDate: "",
  endDate: "",
  experienceId: NO_EXPERIENCE,
  skillIds: [],
  newSkills: "",
};
