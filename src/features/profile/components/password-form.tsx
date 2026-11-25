"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextField } from "@/components/forms/fields";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { changePassword } from "@/features/profile/actions";
import { passwordSchema, type PasswordInput } from "@/features/profile/schemas";
import { applyFieldErrors } from "@/lib/forms";

const defaults: PasswordInput = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function PasswordForm({ accountEmail }: { accountEmail: string }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: defaults,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await changePassword(values);
      if (result.ok) {
        toast.success(result.message);
        form.reset(defaults);
      } else {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Compte & sécurité</CardTitle>
          <CardDescription>
            Connecté avec <span className="font-medium text-foreground">{accountEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-3">
            <TextField
              control={form.control}
              name="currentPassword"
              label="Mot de passe actuel"
              type="password"
              autoComplete="current-password"
            />
            <TextField
              control={form.control}
              name="newPassword"
              label="Nouveau mot de passe"
              type="password"
              autoComplete="new-password"
            />
            <TextField
              control={form.control}
              name="confirmPassword"
              label="Confirmation"
              type="password"
              autoComplete="new-password"
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <SubmitButton pending={pending} variant="outline">
            Changer le mot de passe
          </SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
