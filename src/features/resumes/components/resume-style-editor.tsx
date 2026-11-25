"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateResumeStyle } from "@/features/resumes/actions";
import {
  TailoredResumeDocument,
  type ResumeContact,
} from "@/features/resumes/components/tailored-resume-document";
import {
  ACCENT_PRESETS,
  cvFontFamily,
  RESUME_FONTS,
  RESUME_TEMPLATES,
  type DetectedStyle,
  type ResumeFont,
  type ResumeStyle,
} from "@/features/resumes/style/types";
import type { TailoredResumeContent } from "@/features/resumes/tailored";
import { cn } from "@/lib/utils";

type ResumeStyleEditorProps = {
  resumeId: string;
  content: TailoredResumeContent;
  contact: ResumeContact;
  initialStyle: ResumeStyle;
  /** Style repéré dans le CV générique (couleur et police proposées en premier). */
  detected: DetectedStyle | null;
};

function Swatch({
  color,
  selected,
  label,
  onSelect,
}: {
  color: string;
  selected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={cn(
        "flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "ring-2 ring-foreground" : "hover:scale-110",
      )}
      style={{ backgroundColor: color }}
    >
      {selected ? <Check className="size-3.5 text-white mix-blend-difference" aria-hidden /> : null}
    </button>
  );
}

export function ResumeStyleEditor({
  resumeId,
  content,
  contact,
  initialStyle,
  detected,
}: ResumeStyleEditorProps) {
  const [style, setStyle] = useState(initialStyle);
  const [, startTransition] = useTransition();

  function update(patch: Partial<ResumeStyle>) {
    const next = { ...style, ...patch };
    setStyle(next);
    startTransition(async () => {
      const result = await updateResumeStyle(resumeId, next);
      if (!result.ok) toast.error(result.error);
    });
  }

  const presets = ACCENT_PRESETS.filter((color) => color !== detected?.accent);
  const isCustom =
    style.accent !== detected?.accent && !ACCENT_PRESETS.includes(style.accent as (typeof ACCENT_PRESETS)[number]);

  return (
    <>
      <Card size="sm" className="print:hidden">
        <CardContent className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-end">
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-xs font-medium text-muted-foreground">Modèle</legend>
            <div className="inline-flex rounded-lg bg-muted p-0.5">
              {RESUME_TEMPLATES.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  aria-pressed={style.template === template.key}
                  title={template.description}
                  onClick={() => update({ template: template.key })}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    style.template === template.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-xs font-medium text-muted-foreground">Couleur</legend>
            <div className="flex flex-wrap items-center gap-2">
              {detected?.accent ? (
                <span className="flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5">
                  <Swatch
                    color={detected.accent}
                    selected={style.accent === detected.accent}
                    label="Couleur de ton CV"
                    onSelect={() => update({ accent: detected.accent! })}
                  />
                  <span className="text-xs text-muted-foreground">ton CV</span>
                </span>
              ) : null}
              {presets.map((color) => (
                <Swatch
                  key={color}
                  color={color}
                  selected={style.accent === color}
                  label={`Couleur ${color}`}
                  onSelect={() => update({ accent: color })}
                />
              ))}
              <label
                className={cn(
                  "relative flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] ring-offset-2 ring-offset-background",
                  isCustom && "ring-2 ring-foreground",
                )}
                title="Couleur personnalisée"
              >
                <input
                  type="color"
                  value={style.accent}
                  onChange={(event) => update({ accent: event.target.value })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Couleur personnalisée"
                />
              </label>
            </div>
          </fieldset>

          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Police</span>
            <Select value={style.font} onValueChange={(value) => update({ font: value as ResumeFont })}>
              <SelectTrigger className="w-full lg:w-48" aria-label="Police">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESUME_FONTS.map((font) => (
                  <SelectItem key={font.key} value={font.key}>
                    <span style={{ fontFamily: cvFontFamily(font.key) }}>{font.label}</span>
                    {detected?.font === font.key ? (
                      <span className="text-xs text-muted-foreground">
                        (proche de ton CV{detected.sourceFont ? ` : ${detected.sourceFont}` : ""})
                      </span>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <TailoredResumeDocument content={content} contact={contact} style={style} />
    </>
  );
}
