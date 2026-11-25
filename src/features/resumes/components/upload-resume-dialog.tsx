"use client";

import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AiAvailability } from "@/features/offers/components/method-field";
import { uploadResume } from "@/features/resumes/actions";
import { ImportFromResumeDialog } from "@/features/resumes/components/import-from-resume-dialog";

const MAX_BYTES = 4 * 1024 * 1024;

export function UploadResumeDialog({ trigger, ai }: { trigger: ReactNode; ai: AiAvailability }) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  /** CV fraîchement importé : on propose aussitôt de remplir le profil. */
  const [importResumeId, setImportResumeId] = useState<string | null>(null);

  function onOpenChange(next: boolean) {
    if (pending) return;
    if (next) {
      setError(null);
      formRef.current?.reset();
    }
    setOpen(next);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Sélectionne un fichier PDF.");
      return;
    }
    if (file.type && file.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Le fichier dépasse 4 Mo.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await uploadResume(formData);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        setImportResumeId(result.data.resumeId);
      } else {
        setError(result.fieldErrors?.file?.[0] ?? result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <>
    {importResumeId ? (
      <ImportFromResumeDialog
        resumeId={importResumeId}
        ai={ai}
        open
        onOpenChange={(next) => {
          if (!next) setImportResumeId(null);
        }}
      />
    ) : null}
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importer un CV</DialogTitle>
          <DialogDescription>
            Ton CV générique au format PDF. Son texte est extrait pour l&apos;analyse des offres.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} ref={formRef} onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor={`${formId}-file`}>Fichier PDF</FieldLabel>
              <Input
                id={`${formId}-file`}
                name="file"
                type="file"
                accept="application/pdf,.pdf"
                aria-invalid={Boolean(error)}
              />
              <FieldDescription>4 Mo maximum. Un PDF « texte » (pas une image scannée).</FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${formId}-title`}>Nom (optionnel)</FieldLabel>
              <Input id={`${formId}-title`} name="title" placeholder="Ex. CV 2026" maxLength={120} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Annuler
            </Button>
          </DialogClose>
          <SubmitButton form={formId} pending={pending} pendingLabel="Import…">
            Importer
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
