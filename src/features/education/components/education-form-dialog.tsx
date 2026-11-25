"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { MonthField, TextareaField, TextField } from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";
import { createEducation, updateEducation } from "@/features/education/actions";
import {
  educationSchema,
  emptyEducation,
  type EducationInput,
} from "@/features/education/schemas";
import { applyFieldErrors } from "@/lib/forms";

type EducationFormDialogProps = {
  educationId?: string;
  defaultValues?: EducationInput;
  trigger: ReactNode;
};

export function EducationFormDialog({
  educationId,
  defaultValues = emptyEducation,
  trigger,
}: EducationFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<EducationInput>({
    resolver: zodResolver(educationSchema),
    defaultValues,
  });

  function onOpenChange(next: boolean) {
    if (next) form.reset(defaultValues);
    setOpen(next);
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = educationId
        ? await updateEducation(educationId, values)
        : await createEducation(values);
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
      title={educationId ? "Modifier la formation" : "Nouvelle formation"}
      onSubmit={onSubmit}
      pending={pending}
      size="xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          control={control}
          name="degree"
          label="Diplôme / certification"
          placeholder="Ex. Master Marketing digital"
          className="sm:col-span-2"
          autoFocus
        />
        <TextField control={control} name="institution" label="Établissement / organisme" />
        <TextField control={control} name="fieldOfStudy" label="Spécialité" />
        <MonthField control={control} name="startDate" label="Début (optionnel)" />
        <MonthField control={control} name="endDate" label="Fin / obtention" />
        <TextField control={control} name="location" label="Lieu" className="sm:col-span-2" />
      </div>
      <TextareaField
        control={control}
        name="description"
        label="Détails"
        rows={3}
        placeholder="Mention, matières principales, projet de fin d'études…"
      />
    </FormDialog>
  );
}
