"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextField } from "@/components/forms/fields";
import { SubmitButton } from "@/components/forms/submit-button";
import { FieldGroup } from "@/components/ui/field";
import { signUp } from "@/features/auth/actions";
import { signUpSchema, type SignUpInput } from "@/features/auth/schemas";
import { applyFieldErrors } from "@/lib/forms";

export function SignUpForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", inviteCode: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await signUp(values);
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
          name="name"
          label="Prénom ou pseudo"
          autoComplete="given-name"
          autoFocus
        />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nom@exemple.fr"
        />
        <TextField
          control={form.control}
          name="password"
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          description="8 caractères minimum."
        />
        <TextField
          control={form.control}
          name="inviteCode"
          label="Code d'invitation"
          autoComplete="off"
          description="Communiqué par la personne qui gère l'application."
        />
        <SubmitButton pending={pending} pendingLabel="Création…" className="w-full">
          Créer mon compte
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
