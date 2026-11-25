"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  MonthField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";
import { createProject, updateProject } from "@/features/projects/actions";
import {
  emptyProject,
  NO_EXPERIENCE,
  projectSchema,
  type ProjectInput,
} from "@/features/projects/schemas";
import {
  SkillPickerField,
  type PickableSkill,
} from "@/features/skills/components/skill-picker-field";
import { applyFieldErrors } from "@/lib/forms";

export type ExperienceChoice = { id: string; position: string; company: string };

type ProjectFormDialogProps = {
  projectId?: string;
  defaultValues?: ProjectInput;
  skills: readonly PickableSkill[];
  experiences: readonly ExperienceChoice[];
  trigger: ReactNode;
};

export function ProjectFormDialog({
  projectId,
  defaultValues = emptyProject,
  skills,
  experiences,
  trigger,
}: ProjectFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  });

  function onOpenChange(next: boolean) {
    if (next) form.reset(defaultValues);
    setOpen(next);
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = projectId
        ? await updateProject(projectId, values)
        : await createProject(values);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
      } else {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  const experienceOptions = [
    { value: NO_EXPERIENCE, label: "Projet personnel / indépendant" },
    ...experiences.map((experience) => ({
      value: experience.id,
      label: `${experience.position} — ${experience.company}`,
    })),
  ];

  const { control } = form;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={projectId ? "Modifier le projet" : "Nouveau projet"}
      onSubmit={onSubmit}
      pending={pending}
      size="xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name="name" label="Nom du projet" autoFocus />
        <TextField control={control} name="role" label="Ton rôle" placeholder="Ex. Lead développeur, cheffe de projet…" />
        <SelectField
          control={control}
          name="experienceId"
          label="Contexte"
          options={experienceOptions}
          className="sm:col-span-2"
        />
        <MonthField control={control} name="startDate" label="Début (optionnel)" />
        <MonthField control={control} name="endDate" label="Fin (optionnel)" />
        <TextField control={control} name="url" label="Lien" type="url" placeholder="https://…" />
        <TextField control={control} name="repositoryUrl" label="Dépôt de code" type="url" placeholder="https://github.com/…" />
      </div>
      <TextareaField
        control={control}
        name="description"
        label="Description"
        rows={4}
        placeholder="Objectif, réalisation, résultats…"
      />
      <SkillPickerField control={control} name="skillIds" label="Compétences utilisées" skills={skills} />
      <TextField
        control={control}
        name="newSkills"
        label="Autres compétences"
        placeholder="Nouvelles compétences, séparées par des virgules"
      />
    </FormDialog>
  );
}
