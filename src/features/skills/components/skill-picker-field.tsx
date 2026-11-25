"use client";

import { Check } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldTitle,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

export type PickableSkill = { id: string; name: string };

type SkillPickerFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  skills: readonly PickableSkill[];
};

/** Sélection multiple de compétences existantes sous forme de pastilles. */
export function SkillPickerField<T extends FieldValues>({
  control,
  name,
  label = "Compétences mobilisées",
  skills,
}: SkillPickerFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected = new Set((field.value as string[] | undefined) ?? []);
        const toggle = (id: string) => {
          const next = new Set(selected);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          field.onChange([...next]);
        };

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldTitle>{label}</FieldTitle>
            {skills.length === 0 ? (
              <FieldDescription>
                Aucune compétence enregistrée : ajoute-en ci-dessous ou depuis « Mes compétences ».
              </FieldDescription>
            ) : (
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border p-2">
                {skills.map((skill) => {
                  const isSelected = selected.has(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggle(skill.id)}
                      className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {isSelected ? <Check className="size-3" aria-hidden /> : null}
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            )}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
