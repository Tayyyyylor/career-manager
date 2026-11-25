"use client";

import { useId, type FormEventHandler, type ReactNode } from "react";

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
import { FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
  title: string;
  description?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  submitLabel?: string;
  /** Largeur maximale du dialogue (classe Tailwind). */
  size?: "md" | "lg" | "xl";
  children: ReactNode;
};

const sizes = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
} as const;

/** Dialogue de formulaire : en-tête, champs défilants et pied avec actions. */
export function FormDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  onSubmit,
  pending,
  submitLabel = "Enregistrer",
  size = "lg",
  children,
}: FormDialogProps) {
  const formId = useId();

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className={cn("max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]", sizes[size])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form
          id={formId}
          onSubmit={onSubmit}
          noValidate
          className="-mx-4 min-h-0 overflow-y-auto px-4 py-1"
        >
          <FieldGroup>{children}</FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Annuler
            </Button>
          </DialogClose>
          <SubmitButton form={formId} pending={pending}>
            {submitLabel}
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
