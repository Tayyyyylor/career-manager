"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateApplicationStatus } from "@/features/applications/actions";
import {
  APPLICATION_STATUS_STYLES,
  applicationStatusOptions,
} from "@/features/applications/constants";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

/** Changement rapide du statut d'une candidature. */
export function StatusSelect({ id, status }: { id: string; status: ApplicationStatus }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(status);

  return (
    <Select
      value={optimistic}
      disabled={pending}
      onValueChange={(value) =>
        startTransition(async () => {
          setOptimistic(value as ApplicationStatus);
          const result = await updateApplicationStatus(id, value as ApplicationStatus);
          if (!result.ok) toast.error(result.error);
        })
      }
    >
      <SelectTrigger
        size="sm"
        aria-label="Statut de la candidature"
        className={cn("h-7 rounded-full border-0 ring-1 ring-inset", APPLICATION_STATUS_STYLES[optimistic])}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {applicationStatusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
