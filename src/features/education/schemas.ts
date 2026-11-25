import { z } from "zod";

import {
  optionalMonthString,
  optionalText,
  requiredText,
} from "@/lib/validation";

export const educationSchema = z
  .object({
    degree: requiredText(160, "Intitulé requis."),
    institution: requiredText(160, "Établissement requis."),
    fieldOfStudy: optionalText(120),
    location: optionalText(80),
    startDate: optionalMonthString,
    endDate: optionalMonthString,
    description: optionalText(2000),
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

export type EducationInput = z.infer<typeof educationSchema>;

export const emptyEducation: EducationInput = {
  degree: "",
  institution: "",
  fieldOfStudy: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
};
