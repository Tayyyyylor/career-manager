"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type BaseFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: ReactNode;
  className?: string;
};

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  ...inputProps
}: BaseFieldProps<T> &
  Omit<ComponentProps<typeof Input>, "name" | "value" | "onChange" | "onBlur">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            {...inputProps}
            {...field}
            id={field.name}
            value={(field.value as string | undefined) ?? ""}
            aria-invalid={fieldState.invalid}
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  ...textareaProps
}: BaseFieldProps<T> &
  Omit<ComponentProps<typeof Textarea>, "name" | "value" | "onChange" | "onBlur">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Textarea
            {...textareaProps}
            {...field}
            id={field.name}
            value={(field.value as string | undefined) ?? ""}
            aria-invalid={fieldState.invalid}
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export type SelectOption = { value: string; label: string };

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  options,
  placeholder = "Sélectionner…",
}: BaseFieldProps<T> & {
  options: readonly SelectOption[];
  placeholder?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Select
            name={field.name}
            value={(field.value as string | undefined) ?? ""}
            onValueChange={field.onChange}
          >
            <SelectTrigger
              id={field.name}
              aria-invalid={fieldState.invalid}
              className="w-full"
              onBlur={field.onBlur}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
] as const;

const EMPTY = "__empty__";

/**
 * Sélecteur mois + année (valeur "AAAA-MM" ou "").
 * Remplace <input type="month">, mal pris en charge par Safari.
 */
export function MonthField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  minYear = 1970,
}: BaseFieldProps<T> & { disabled?: boolean; minYear?: number }) {
  const maxYear = new Date().getUTCFullYear() + 1;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(maxYear - i));

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = (field.value as string | undefined) ?? "";
        const [year = "", month = ""] = value ? value.split("-") : [];
        const update = (nextYear: string, nextMonth: string) => {
          if (!nextYear && !nextMonth) field.onChange("");
          else field.onChange(`${nextYear || String(maxYear - 1)}-${nextMonth || "01"}`);
        };

        return (
          <Field data-invalid={fieldState.invalid} data-disabled={disabled} className={className}>
            <FieldLabel htmlFor={`${field.name}-month`}>{label}</FieldLabel>
            <div className="grid grid-cols-[1fr_6.5rem] gap-2">
              <Select
                value={month || EMPTY}
                onValueChange={(next) => update(year, next === EMPTY ? "" : next)}
                disabled={disabled}
              >
                <SelectTrigger
                  id={`${field.name}-month`}
                  aria-invalid={fieldState.invalid}
                  aria-label={`${label} — mois`}
                  className="w-full"
                >
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY}>—</SelectItem>
                  {MONTHS.map((monthLabel, index) => (
                    <SelectItem key={monthLabel} value={String(index + 1).padStart(2, "0")}>
                      {monthLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={year || EMPTY}
                onValueChange={(next) => update(next === EMPTY ? "" : next, month)}
                disabled={disabled}
              >
                <SelectTrigger
                  aria-invalid={fieldState.invalid}
                  aria-label={`${label} — année`}
                  className="w-full"
                >
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY}>—</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {description ? <FieldDescription>{description}</FieldDescription> : null}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
}: BaseFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          orientation="horizontal"
          data-invalid={fieldState.invalid}
          className={className}
        >
          <Checkbox
            id={field.name}
            name={field.name}
            checked={Boolean(field.value)}
            onCheckedChange={(checked) => field.onChange(checked === true)}
            aria-invalid={fieldState.invalid}
          />
          <FieldContent>
            <FieldLabel htmlFor={field.name} className="font-normal">
              {label}
            </FieldLabel>
            {description ? <FieldDescription>{description}</FieldDescription> : null}
          </FieldContent>
        </Field>
      )}
    />
  );
}
