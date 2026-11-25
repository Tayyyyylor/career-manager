"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  CheckboxField,
  MonthField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";
import { createExperience, updateExperience } from "@/features/experiences/actions";
import {
  employmentTypeOptions,
  NO_EMPLOYMENT_TYPE,
} from "@/features/experiences/constants";
import { experienceSchema, type ExperienceInput } from "@/features/experiences/schemas";
import {
  SkillPickerField,
  type PickableSkill,
} from "@/features/skills/components/skill-picker-field";
import { applyFieldErrors } from "@/lib/forms";

export const emptyExperience: ExperienceInput = {
  position: "",
  company: "",
  location: "",
  employmentType: NO_EMPLOYMENT_TYPE,
  startDate: "",
  current: false,
  endDate: "",
  description: "",
  achievements: "",
  skillIds: [],
  newSkills: "",
};

type ExperienceFormDialogProps = {
  experienceId?: string;
  defaultValues?: ExperienceInput;
  skills: readonly PickableSkill[];
  trigger: ReactNode;
};

export function ExperienceFormDialog({
  experienceId,
  defaultValues = emptyExperience,
  skills,
  trigger,
}: ExperienceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<ExperienceInput>({
    resolver: zodResolver(experienceSchema),
    defaultValues,
  });
  const current = useWatch({ control: form.control, name: "current" });

  function onOpenChange(next: boolean) {
    if (next) form.reset(defaultValues);
    setOpen(next);
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = experienceId
        ? await updateExperience(experienceId, values)
        : await createExperience(values);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
      } else {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  const { control } = form;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={experienceId ? "Modifier l'expérience" : "Nouvelle expérience"}
      onSubmit={onSubmit}
      pending={pending}
      size="xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name="position" label="Poste" placeholder="Ex. Chargée de communication" autoFocus />
        <TextField control={control} name="company" label="Entreprise" />
        <TextField control={control} name="location" label="Lieu" placeholder="Ex. Paris / Télétravail" />
        <SelectField control={control} name="employmentType" label="Type de contrat" options={employmentTypeOptions} />
        <MonthField control={control} name="startDate" label="Début" />
        <MonthField control={control} name="endDate" label="Fin" disabled={current} />
      </div>
      <CheckboxField control={control} name="current" label="Poste actuel" />
      <TextareaField
        control={control}
        name="description"
        label="Description"
        rows={3}
        placeholder="Contexte, équipe, missions principales…"
      />
      <TextareaField
        control={control}
        name="achievements"
        label="Réalisations"
        rows={4}
        placeholder={"Une réalisation par ligne, idéalement chiffrée.\nEx. Refonte du site : +30 % de conversions"}
      />
      <SkillPickerField control={control} name="skillIds" skills={skills} />
      <TextField
        control={control}
        name="newSkills"
        label="Autres compétences"
        placeholder="Nouvelles compétences, séparées par des virgules"
        description="Elles seront ajoutées à « Mes compétences »."
      />
    </FormDialog>
  );
}
