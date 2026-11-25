"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SelectField, TextareaField } from "@/components/forms/fields";
import { FormDialog } from "@/components/forms/form-dialog";
import { createSkillsBulk } from "@/features/skills/actions";
import { AUTO_CATEGORY, bulkCategoryOptions } from "@/features/skills/constants";
import { bulkSkillsSchema, type BulkSkillsInput } from "@/features/skills/schemas";
import { applyFieldErrors } from "@/lib/forms";

const defaults: BulkSkillsInput = { names: "", category: AUTO_CATEGORY };

export function BulkSkillsDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<BulkSkillsInput>({
    resolver: zodResolver(bulkSkillsSchema),
    defaultValues: defaults,
  });

  function onOpenChange(next: boolean) {
    if (next) form.reset(defaults);
    setOpen(next);
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createSkillsBulk(values);
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
      title="Ajout rapide"
      description="Colle une liste de compétences séparées par des virgules ou des retours à la ligne."
      onSubmit={onSubmit}
      pending={pending}
      submitLabel="Ajouter"
    >
      <TextareaField
        control={form.control}
        name="names"
        label="Compétences"
        rows={6}
        placeholder={"TypeScript, React, Node.js\nPostgreSQL\nDocker"}
        autoFocus
      />
      <SelectField
        control={form.control}
        name="category"
        label="Catégorie"
        options={bulkCategoryOptions}
        description="La détection reconnaît les compétences courantes (langues, outils, méthodes…). Tu pourras ajuster ensuite."
      />
    </FormDialog>
  );
}
