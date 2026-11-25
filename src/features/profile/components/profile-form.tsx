"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SelectField, TextareaField, TextField } from "@/components/forms/fields";
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
import { saveProfile } from "@/features/profile/actions";
import { profileSchema, type ProfileInput } from "@/features/profile/schemas";
import { applyFieldErrors } from "@/lib/forms";

const scaleOptions = [
  { value: "100", label: "Sur 100 (ex. 72/100)" },
  { value: "20", label: "Sur 20 (ex. 14,5/20)" },
];

export function ProfileForm({ defaultValues }: { defaultValues: ProfileInput }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveProfile(values);
      if (result.ok) {
        toast.success(result.message);
        form.reset(values);
      } else {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  const { control } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
          <CardDescription>Ces informations apparaissent en tête de tes CV.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <TextField control={control} name="firstName" label="Prénom" autoComplete="given-name" />
            <TextField control={control} name="lastName" label="Nom" autoComplete="family-name" />
            <TextField
              control={control}
              name="headline"
              label="Titre professionnel"
              placeholder="Ex. Développeuse full-stack"
              className="sm:col-span-2"
            />
            <TextareaField
              control={control}
              name="summary"
              label="Présentation"
              rows={5}
              placeholder="Quelques lignes sur ton parcours, tes points forts et ce que tu recherches."
              className="sm:col-span-2"
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées & liens</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <TextField control={control} name="email" label="Email de contact" type="email" autoComplete="email" />
            <TextField control={control} name="phone" label="Téléphone" type="tel" autoComplete="tel" />
            <TextField
              control={control}
              name="location"
              label="Localisation"
              placeholder="Ex. Lyon, France"
              className="sm:col-span-2"
            />
            <TextField control={control} name="linkedinUrl" label="LinkedIn" type="url" placeholder="https://linkedin.com/in/…" />
            <TextField control={control} name="githubUrl" label="GitHub" type="url" placeholder="https://github.com/…" />
            <TextField
              control={control}
              name="websiteUrl"
              label="Site web / portfolio"
              type="url"
              placeholder="https://…"
              className="sm:col-span-2"
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Préférences</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <SelectField
              control={control}
              name="scoreScale"
              label="Barème des notes"
              options={scaleOptions}
              description="Utilisé pour afficher les notes d'analyse des offres."
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <SubmitButton pending={pending} disabled={!form.formState.isDirty}>
            Enregistrer le profil
          </SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
