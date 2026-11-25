"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ManualAiPanel } from "@/components/shared/manual-ai-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/action-result";

type ManualAiDialogProps<T> = {
  title: string;
  description: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  loadPrompt: () => Promise<ActionResult<{ prompt: string }>>;
  submit: (response: string) => Promise<ActionResult<T>>;
  onSuccess?: (data: T) => void;
  submitLabel?: string;
};

/** Dialogue complet du mode copier-coller (analyse d'offre, CV adapté…). */
export function ManualAiDialog<T>({
  title,
  description,
  trigger,
  open: controlledOpen,
  onOpenChange,
  loadPrompt,
  submit,
  onSuccess,
  submitLabel = "Valider la réponse",
}: ManualAiDialogProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setOpen(next: boolean) {
    if (pending) return;
    if (!next) {
      setResponse("");
      setError(null);
    }
    setInternalOpen(next);
    onOpenChange?.(next);
  }

  function validate() {
    startTransition(async () => {
      const result = await submit(response);
      if (result.ok) {
        toast.success(result.message);
        setResponse("");
        setError(null);
        setInternalOpen(false);
        onOpenChange?.(false);
        onSuccess?.(result.data);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="-mx-4 min-h-0 overflow-y-auto px-4 py-1">
          <ManualAiPanel
            loadPrompt={loadPrompt}
            response={response}
            onResponseChange={(value) => {
              setResponse(value);
              setError(null);
            }}
            error={error}
            disabled={pending}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Annuler
          </Button>
          <Button type="button" onClick={validate} disabled={pending || !response.trim()}>
            {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
