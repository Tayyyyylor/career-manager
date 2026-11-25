"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useId, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link2, TextCursorInput } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyzeNewOffer } from "@/features/offers/actions";
import { isAiUsable, MethodField, type AiAvailability } from "@/features/offers/components/method-field";
import { newOfferSchema, NO_RESUME, type NewOfferInput } from "@/features/offers/schemas";
import { applyFieldErrors } from "@/lib/forms";

export type ResumeChoice = { id: string; title: string; isDefault: boolean };

export function NewOfferForm({
  resumes,
  ai,
}: {
  resumes: readonly ResumeChoice[];
  ai: AiAvailability;
}) {
  const router = useRouter();
  const idPrefix = useId();
  const [pending, startTransition] = useTransition();
  const defaultResume = resumes.find((resume) => resume.isDefault) ?? resumes[0];

  const form = useForm<NewOfferInput>({
    resolver: zodResolver(newOfferSchema),
    defaultValues: {
      source: "url",
      url: "",
      title: "",
      company: "",
      location: "",
      description: "",
      resumeId: defaultResume?.id ?? NO_RESUME,
      method: isAiUsable(ai) ? "AI" : "RULES",
    },
  });
  const source = useWatch({ control: form.control, name: "source" });
  const method = useWatch({ control: form.control, name: "method" });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await analyzeNewOffer(values);
      if (result.ok) {
        if (result.data.fallback) toast.warning(result.message);
        else toast.success(result.message);
        router.push(
          result.data.manual
            ? (`/offers/${result.data.offerId}?manuel=1` as Route)
            : `/offers/${result.data.offerId}`,
        );
      } else {
        applyFieldErrors(form, result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  const resumeOptions = [
    ...resumes.map((resume) => ({
      value: resume.id,
      label: resume.isDefault ? `${resume.title} (par défaut)` : resume.title,
    })),
    { value: NO_RESUME, label: "Aucun — profil uniquement" },
  ];

  const { control } = form;

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle analyse</CardTitle>
          <CardDescription>
            Colle le lien d&apos;une annonce ou son texte : tu obtiens une note de correspondance et des
            conseils pour adapter ta candidature.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Tabs
              value={source}
              onValueChange={(value) =>
                form.setValue("source", value === "text" ? "text" : "url", { shouldValidate: false })
              }
            >
              <TabsList>
                <TabsTrigger value="url">
                  <Link2 />
                  Lien de l&apos;annonce
                </TabsTrigger>
                <TabsTrigger value="text">
                  <TextCursorInput />
                  Texte de l&apos;annonce
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {source === "url" ? (
              <TextField
                control={control}
                name="url"
                label="Lien"
                type="url"
                inputMode="url"
                placeholder="https://www.exemple.com/offre/…"
                description="Certains sites (LinkedIn connecté, Indeed…) bloquent la lecture : colle alors le texte."
              />
            ) : (
              <TextareaField
                control={control}
                name="description"
                label="Description de l'annonce"
                rows={10}
                placeholder="Colle ici l'intégralité de l'annonce : missions, profil recherché, compétences…"
              />
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <TextField control={control} name="title" label="Intitulé (optionnel)" placeholder="Détecté automatiquement" />
              <TextField control={control} name="company" label="Entreprise (optionnel)" />
              <TextField control={control} name="location" label="Lieu (optionnel)" />
            </div>

            <SelectField
              control={control}
              name="resumeId"
              label="CV de référence"
              options={resumeOptions}
              description={
                resumes.length === 0
                  ? "Aucun CV importé : l'analyse s'appuie sur ton profil (compétences, expériences…)."
                  : undefined
              }
            />

            <MethodField control={control} name="method" ai={ai} idPrefix={idPrefix} />
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <SubmitButton
            pending={pending}
            pendingLabel={method === "AI" ? "Analyse IA en cours (≈ 30 s)…" : "Analyse…"}
          >
            Analyser l&apos;offre
          </SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
