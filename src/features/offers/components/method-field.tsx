"use client";

import { ClipboardPaste, Cpu, Sparkles } from "lucide-react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type AiAvailability = {
  enabled: boolean;
  /** `null` = appels illimités. */
  remaining: number | null;
  limit: number | null;
  model: string;
};

export function isAiUsable(ai: AiAvailability): boolean {
  return ai.enabled && (ai.remaining === null || ai.remaining > 0);
}

function aiDescription(ai: AiAvailability): string {
  if (!ai.enabled) return "Nécessite une clé API (non configurée).";
  if (ai.remaining === null) return "Automatique, via l'API : analyse fine et conseils personnalisés.";
  if (ai.remaining > 0) {
    return `Automatique, via l'API · ${ai.remaining}/${ai.limit} restantes aujourd'hui.`;
  }
  return "Limite quotidienne atteinte.";
}

/** Choix de la méthode d'analyse : règles, copier-coller via claude.ai, ou API. */
export function MethodField<T extends FieldValues>({
  control,
  name,
  ai,
  idPrefix,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  ai: AiAvailability;
  idPrefix: string;
}) {
  const aiUsable = isAiUsable(ai);

  const options = [
    {
      value: "RULES",
      icon: Cpu,
      title: "Automatique",
      description: "Gratuit et instantané, par comparaison de mots-clés.",
      disabled: false,
    },
    {
      value: "MANUAL",
      icon: ClipboardPaste,
      title: "Via mon abonnement Claude",
      description: "Gratuit : note automatique, puis analyse fine en copiant-collant dans claude.ai.",
      disabled: false,
    },
    {
      value: "AI",
      icon: Sparkles,
      title: "IA (clé API)",
      description: aiDescription(ai),
      disabled: !aiUsable,
    },
  ];

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FieldSet>
          <FieldLegend variant="label">Méthode d&apos;analyse</FieldLegend>
          <RadioGroup
            value={field.value as string}
            onValueChange={field.onChange}
            className="grid grid-cols-1 gap-2 md:grid-cols-3"
          >
            {options.map(({ value, icon: Icon, title, description, disabled }) => (
              <FieldLabel key={value} htmlFor={`${idPrefix}-${value}`} aria-disabled={disabled}>
                <Field orientation="horizontal" data-disabled={disabled}>
                  <FieldContent>
                    <FieldTitle>
                      <Icon className="size-4" aria-hidden />
                      {title}
                    </FieldTitle>
                    <FieldDescription>{description}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={value} id={`${idPrefix}-${value}`} disabled={disabled} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>
      )}
    />
  );
}
