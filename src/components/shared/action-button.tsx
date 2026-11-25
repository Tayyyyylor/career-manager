"use client";

import { useTransition, type ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

type ActionButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  /** Server Action à exécuter (arguments déjà liés). */
  action: () => Promise<ActionResult<unknown>>;
};

/** Bouton qui exécute une Server Action et affiche le résultat en notification. */
export function ActionButton({ action, children, disabled, ...props }: ActionButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      {...props}
      disabled={pending || disabled}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          if (result.ok) {
            if (result.message) toast.success(result.message);
          } else {
            toast.error(result.error);
          }
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
      {children}
    </Button>
  );
}
