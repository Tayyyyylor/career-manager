"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextField } from "@/components/forms/fields";
import { SubmitButton } from "@/components/forms/submit-button";
import { FieldGroup } from "@/components/ui/field";
import { signIn } from "@/features/auth/actions";
import { signInSchema, type SignInInput } from "@/features/auth/schemas";
import { applyFieldErrors } from "@/lib/forms";

export function SignInForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await signIn(values, next);
      // En cas de succès, l'action redirige : seul l'échec revient ici.
      if (!result.ok) {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nom@exemple.fr"
          autoFocus
        />
        <TextField
          control={form.control}
          name="password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
        />
        <SubmitButton pending={pending} pendingLabel="Connexion…" className="w-full">
          Se connecter
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
