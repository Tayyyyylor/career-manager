"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SelectField, TextField } from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";
import type { SkillCategory, SkillLevel } from "@/generated/prisma/enums";
import { createSkill, updateSkill } from "@/features/skills/actions";
import {
  NO_LEVEL,
  skillCategoryOptions,
  skillLevelOptions,
} from "@/features/skills/constants";
import { skillSchema, type SkillInput } from "@/features/skills/schemas";
import { applyFieldErrors } from "@/lib/forms";

type EditableSkill = {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel | null;
};

type SkillFormDialogProps = {
  skill?: EditableSkill;
  defaultCategory?: SkillCategory;
  trigger: ReactNode;
};

function toFormValues(skill?: EditableSkill, category?: SkillCategory): SkillInput {
  return {
    name: skill?.name ?? "",
    category: skill?.category ?? category ?? "TECHNICAL",
    level: skill?.level ?? NO_LEVEL,
  };
}

export function SkillFormDialog({ skill, defaultCategory, trigger }: SkillFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<SkillInput>({
    resolver: zodResolver(skillSchema),
    defaultValues: toFormValues(skill, defaultCategory),
  });

  function onOpenChange(next: boolean) {
    if (next) form.reset(toFormValues(skill, defaultCategory));
    setOpen(next);
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = skill ? await updateSkill(skill.id, values) : await createSkill(values);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
      } else {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={skill ? "Modifier la compétence" : "Nouvelle compétence"}
      onSubmit={onSubmit}
      pending={pending}
      size="md"
    >
      <TextField
        control={form.control}
        name="name"
        label="Nom"
        placeholder="Ex. TypeScript, Gestion de projet, Anglais…"
        autoFocus
      />
      <SelectField
        control={form.control}
        name="category"
        label="Catégorie"
        options={skillCategoryOptions}
      />
      <SelectField
        control={form.control}
        name="level"
        label="Niveau"
        options={skillLevelOptions}
      />
    </FormDialog>
  );
}
