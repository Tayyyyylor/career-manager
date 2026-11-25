"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SelectField, TextareaField, TextField } from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";
import { createApplication, updateApplication } from "@/features/applications/actions";
import { applicationStatusOptions } from "@/features/applications/constants";
import {
  applicationSchema,
  emptyApplication,
  NO_LINK,
  type ApplicationInput,
} from "@/features/applications/schemas";
import { applyFieldErrors } from "@/lib/forms";

type LinkChoices = {
  offers: readonly { id: string; title: string; company: string | null }[];
  resumes: readonly { id: string; title: string }[];
};

type ApplicationFormDialogProps = {
  applicationId?: string;
  defaultValues?: ApplicationInput;
  links: LinkChoices;
  trigger: ReactNode;
};

export function ApplicationFormDialog({
  applicationId,
  defaultValues = emptyApplication,
  links,
  trigger,
}: ApplicationFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues,
  });

  function onOpenChange(next: boolean) {
    if (next) form.reset(defaultValues);
    setOpen(next);
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = applicationId
        ? await updateApplication(applicationId, values)
        : await createApplication(values);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
      } else {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  const offerOptions = [
    { value: NO_LINK, label: "Aucune" },
    ...links.offers.map((offer) => ({
      value: offer.id,
      label: offer.company ? `${offer.title} — ${offer.company}` : offer.title,
    })),
  ];
  const resumeOptions = [
    { value: NO_LINK, label: "Non précisé" },
    ...links.resumes.map((resume) => ({ value: resume.id, label: resume.title })),
  ];

  const { control } = form;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={applicationId ? "Modifier la candidature" : "Nouvelle candidature"}
      onSubmit={onSubmit}
      pending={pending}
      size="xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name="company" label="Entreprise" autoFocus />
        <TextField control={control} name="position" label="Poste" />
        <SelectField control={control} name="status" label="Statut" options={applicationStatusOptions} />
        <TextField
          control={control}
          name="appliedAt"
          label="Date d'envoi"
          type="date"
          description="Renseignée automatiquement à l'envoi si vide."
        />
        <SelectField control={control} name="jobOfferId" label="Offre analysée" options={offerOptions} />
        <SelectField control={control} name="resumeId" label="CV utilisé" options={resumeOptions} />
        <TextField
          control={control}
          name="url"
          label="Lien de l'annonce / candidature"
          type="url"
          placeholder="https://…"
          className="sm:col-span-2"
        />
      </div>
      <TextareaField
        control={control}
        name="notes"
        label="Notes"
        rows={4}
        placeholder="Contact, relances, questions d'entretien…"
      />
    </FormDialog>
  );
}
