"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { ArrowLeft, Check, ClipboardPaste, Cpu, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { ManualAiPanel } from "@/components/shared/manual-ai-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { isAiUsable, type AiAvailability } from "@/features/offers/components/method-field";
import {
  applyResumeImport,
  extractFromResume,
  getManualImportPrompt,
  submitManualImport,
} from "@/features/resumes/import/actions";
import {
  educationKey,
  experienceKey,
  PROFILE_FIELD_LABELS,
  PROFILE_FIELDS,
  type ImportData,
  type ImportProposal,
  type ProfileField,
} from "@/features/resumes/import/types";
import { formatPeriod, fromMonthInput } from "@/lib/format";
import { cn } from "@/lib/utils";

type Method = "RULES" | "AI" | "MANUAL";
type Proposal = ImportProposal & { fallbackReason: string | null };

type Selection = {
  profile: Set<ProfileField>;
  skills: Set<number>;
  experiences: Set<number>;
  projects: Set<number>;
  educations: Set<number>;
};

const same = (a: string | null, b: string | null) =>
  (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

/** « 2021-01 », null → « janv. 2021 – aujourd'hui » */
const period = (start: string | null, end: string | null) =>
  formatPeriod(start ? fromMonthInput(start) : null, end ? fromMonthInput(end) : null);

/** Pré-sélection : uniquement ce qui est nouveau. */
function initialSelection({ data, existing }: Proposal): Selection {
  const indexes = <T,>(items: T[], isNew: (item: T) => boolean) =>
    new Set(items.flatMap((item, index) => (isNew(item) ? [index] : [])));

  return {
    profile: new Set(
      PROFILE_FIELDS.filter((field) => data.profile[field] && !existing.profile[field]),
    ),
    skills: indexes(data.skills, (skill) => !existing.skillNames.includes(skill.name.toLowerCase())),
    experiences: indexes(data.experiences, (e) => !existing.experienceKeys.includes(experienceKey(e))),
    projects: indexes(data.projects, (p) => !existing.projectNames.includes(p.name.toLowerCase())),
    educations: indexes(data.educations, (e) => !existing.educationKeys.includes(educationKey(e))),
  };
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function Section({ title, count, children }: { title: string; count?: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="flex items-baseline gap-2 text-sm font-medium">
        {title}
        {count ? <span className="text-xs font-normal text-muted-foreground">{count}</span> : null}
      </h3>
      {children}
    </section>
  );
}

function CheckRow({
  id,
  checked,
  disabled,
  onChange,
  title,
  detail,
  badge,
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  title: ReactNode;
  detail?: ReactNode;
  badge?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50",
        checked && "border-primary/30 bg-primary/5",
        disabled && "cursor-default opacity-60 hover:bg-transparent",
      )}
    >
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
          {title}
          {badge ? <span className="text-xs font-normal text-muted-foreground">({badge})</span> : null}
        </span>
        {detail ? <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span> : null}
      </span>
    </label>
  );
}

type ImportFromResumeDialogProps = {
  resumeId: string;
  ai: AiAvailability;
  trigger?: ReactNode;
  /** Mode contrôlé (ouverture automatique après un import de PDF). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ImportFromResumeDialog({
  resumeId,
  ai,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ImportFromResumeDialogProps) {
  const router = useRouter();
  const aiUsable = isAiUsable(ai);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  // Sans clé API, le copier-coller est la seule façon d'extraire tout le parcours.
  const [method, setMethod] = useState<Method>(aiUsable ? "AI" : "MANUAL");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [manualStep, setManualStep] = useState(false);
  const [manualResponse, setManualResponse] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setProposal(null);
    setSelection(null);
    setManualStep(false);
    setManualResponse("");
    setManualError(null);
  }

  function setOpen(next: boolean) {
    if (pending) return;
    if (!next) reset();
    setInternalOpen(next);
    onOpenChange?.(next);
  }

  function showProposal(next: Proposal) {
    setProposal(next);
    setSelection(initialSelection(next));
  }

  function submitManual() {
    startTransition(async () => {
      const result = await submitManualImport(resumeId, manualResponse);
      if (result.ok) showProposal(result.data);
      else setManualError(result.error);
    });
  }

  function analyze() {
    if (method === "MANUAL") {
      setManualStep(true);
      return;
    }
    startTransition(async () => {
      const result = await extractFromResume(resumeId, method);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.data.fallbackReason) {
        toast.warning(`IA indisponible (${result.data.fallbackReason}) — extraction automatique utilisée.`);
      }
      showProposal(result.data);
    });
  }

  function apply() {
    if (!proposal || !selection) return;
    const { data } = proposal;
    const payload: ImportData = {
      profile: Object.fromEntries(
        PROFILE_FIELDS.map((field) => [field, selection.profile.has(field) ? data.profile[field] : null]),
      ) as ImportData["profile"],
      skills: data.skills.filter((_, index) => selection.skills.has(index)),
      experiences: data.experiences.filter((_, index) => selection.experiences.has(index)),
      projects: data.projects.filter((_, index) => selection.projects.has(index)),
      educations: data.educations.filter((_, index) => selection.educations.has(index)),
    };

    startTransition(async () => {
      const result = await applyResumeImport(payload);
      if (result.ok) {
        toast.success(result.message, {
          action: { label: "Voir mon profil", onClick: () => router.push("/profile") },
        });
        reset();
        setInternalOpen(false);
        onOpenChange?.(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const selectedCount = selection
    ? selection.profile.size +
      selection.skills.size +
      selection.experiences.size +
      selection.projects.size +
      selection.educations.size
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Remplir mon profil depuis ce CV</DialogTitle>
          <DialogDescription>
            {proposal
              ? "Coche ce que tu veux importer. Tu pourras tout modifier ensuite dans chaque rubrique."
              : "Les informations détectées te sont présentées avant tout enregistrement."}
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 min-h-0 overflow-y-auto px-4 py-1">
          {proposal && selection ? (
            <ImportReview proposal={proposal} selection={selection} onChange={setSelection} />
          ) : manualStep ? (
            <ManualAiPanel
              loadPrompt={() => getManualImportPrompt(resumeId)}
              response={manualResponse}
              onResponseChange={(value) => {
                setManualResponse(value);
                setManualError(null);
              }}
              error={manualError}
              disabled={pending}
            />
          ) : (
            <RadioGroup
              value={method}
              onValueChange={(value) => setMethod(value as Method)}
              className="grid gap-2"
              disabled={pending}
            >
              <FieldLabel htmlFor="import-ai" aria-disabled={!aiUsable}>
                <Field orientation="horizontal" data-disabled={!aiUsable}>
                  <FieldContent>
                    <FieldTitle>
                      <Sparkles className="size-4" aria-hidden />
                      Avec l&apos;IA (clé API)
                    </FieldTitle>
                    <FieldDescription>
                      {aiUsable
                        ? "Tout ton parcours : profil, expériences avec dates et réalisations, projets, formations, compétences."
                        : "Indisponible : aucune clé API configurée sur ce serveur."}
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value="AI" id="import-ai" disabled={!aiUsable} />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="import-manual">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>
                      <ClipboardPaste className="size-4" aria-hidden />
                      Via mon abonnement Claude (gratuit)
                    </FieldTitle>
                    <FieldDescription>
                      Tout ton parcours, comme avec l&apos;IA : tu copies une demande dans claude.ai
                      et tu colles la réponse ici.
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value="MANUAL" id="import-manual" />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="import-rules">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>
                      <Cpu className="size-4" aria-hidden />
                      Automatique (gratuit)
                    </FieldTitle>
                    <FieldDescription>
                      Nom, titre, coordonnées, liens et compétences reconnues. Les expériences et
                      formations restent à saisir.
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value="RULES" id="import-rules" />
                </Field>
              </FieldLabel>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Annuler
          </Button>
          {proposal ? null : manualStep ? (
            <>
              <Button type="button" variant="ghost" onClick={() => setManualStep(false)} disabled={pending}>
                <ArrowLeft data-icon="inline-start" />
                Retour
              </Button>
              <Button onClick={submitManual} disabled={pending || !manualResponse.trim()}>
                {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
                Valider la réponse
              </Button>
            </>
          ) : (
            <Button onClick={analyze} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
              {pending
                ? method === "AI"
                  ? "Lecture par l'IA (≈ 30 s)…"
                  : "Lecture du CV…"
                : method === "MANUAL"
                  ? "Continuer"
                  : "Analyser le CV"}
            </Button>
          )}
          {!proposal ? null : (
            <Button onClick={apply} disabled={pending || selectedCount === 0}>
              {pending ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Check data-icon="inline-start" />
              )}
              Importer la sélection ({selectedCount})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportReview({
  proposal,
  selection,
  onChange,
}: {
  proposal: Proposal;
  selection: Selection;
  onChange: (selection: Selection) => void;
}) {
  const { data, existing, method } = proposal;
  const profileFields = PROFILE_FIELDS.filter(
    (field) => data.profile[field] && !same(data.profile[field], existing.profile[field]),
  );
  const isExistingSkill = (name: string) => existing.skillNames.includes(name.toLowerCase());
  const newSkills = data.skills.filter((skill) => !isExistingSkill(skill.name)).length;
  const nothing =
    profileFields.length === 0 &&
    newSkills === 0 &&
    data.experiences.length === 0 &&
    data.projects.length === 0 &&
    data.educations.length === 0;

  return (
    <div className="grid gap-6">
      {method === "RULES" ? (
        <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
          L&apos;extraction automatique ne récupère pas les expériences, projets et formations : la
          mise en page varie trop d&apos;un CV à l&apos;autre. Utilise l&apos;IA ou saisis-les dans leurs
          rubriques.
        </p>
      ) : null}

      {nothing ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Rien de nouveau : tout ce qui a été détecté est déjà dans ton profil.
        </p>
      ) : null}

      {profileFields.length > 0 ? (
        <Section title="Profil">
          <div className="grid gap-1.5">
            {profileFields.map((field) => {
              const current = existing.profile[field];
              return (
                <CheckRow
                  key={field}
                  id={`import-profile-${field}`}
                  checked={selection.profile.has(field)}
                  onChange={() => onChange({ ...selection, profile: toggle(selection.profile, field) })}
                  title={PROFILE_FIELD_LABELS[field]}
                  detail={
                    <>
                      <span className="line-clamp-2 text-foreground/80">{data.profile[field]}</span>
                      {current ? <span className="block">Remplace : {current}</span> : null}
                    </>
                  }
                />
              );
            })}
          </div>
        </Section>
      ) : null}

      {data.skills.length > 0 ? (
        <Section
          title="Compétences"
          count={`${selection.skills.size} sélectionnée(s) · ${data.skills.length - newSkills} déjà présente(s)`}
        >
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill, index) => {
              const known = isExistingSkill(skill.name);
              const selected = selection.skills.has(index);
              return (
                <button
                  key={`${skill.name}-${index}`}
                  type="button"
                  disabled={known}
                  aria-pressed={selected}
                  onClick={() => onChange({ ...selection, skills: toggle(selection.skills, index) })}
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    known
                      ? "border-dashed text-muted-foreground line-through"
                      : selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted",
                  )}
                  title={known ? "Déjà dans tes compétences" : undefined}
                >
                  {selected && !known ? <Check className="size-3" aria-hidden /> : null}
                  {skill.name}
                </button>
              );
            })}
          </div>
        </Section>
      ) : null}

      {data.experiences.length > 0 ? (
        <Section title="Expériences" count={`${selection.experiences.size}/${data.experiences.length}`}>
          <div className="grid gap-1.5">
            {data.experiences.map((experience, index) => {
              const known = existing.experienceKeys.includes(experienceKey(experience));
              return (
                <CheckRow
                  key={index}
                  id={`import-exp-${index}`}
                  checked={selection.experiences.has(index)}
                  disabled={known}
                  badge={known ? "déjà présente" : undefined}
                  onChange={() =>
                    onChange({ ...selection, experiences: toggle(selection.experiences, index) })
                  }
                  title={`${experience.position} — ${experience.company}`}
                  detail={[
                    period(experience.startDate, experience.endDate),
                    experience.achievements.length ? `${experience.achievements.length} réalisation(s)` : null,
                    experience.skills.length ? `${experience.skills.length} compétence(s)` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              );
            })}
          </div>
        </Section>
      ) : null}

      {data.projects.length > 0 ? (
        <Section title="Projets" count={`${selection.projects.size}/${data.projects.length}`}>
          <div className="grid gap-1.5">
            {data.projects.map((project, index) => {
              const known = existing.projectNames.includes(project.name.toLowerCase());
              return (
                <CheckRow
                  key={index}
                  id={`import-project-${index}`}
                  checked={selection.projects.has(index)}
                  disabled={known}
                  badge={known ? "déjà présent" : undefined}
                  onChange={() => onChange({ ...selection, projects: toggle(selection.projects, index) })}
                  title={project.name}
                  detail={[project.role, period(project.startDate, project.endDate)].filter(Boolean).join(" · ")}
                />
              );
            })}
          </div>
        </Section>
      ) : null}

      {data.educations.length > 0 ? (
        <Section title="Formations" count={`${selection.educations.size}/${data.educations.length}`}>
          <div className="grid gap-1.5">
            {data.educations.map((education, index) => {
              const known = existing.educationKeys.includes(educationKey(education));
              return (
                <CheckRow
                  key={index}
                  id={`import-edu-${index}`}
                  checked={selection.educations.has(index)}
                  disabled={known}
                  badge={known ? "déjà présente" : undefined}
                  onChange={() =>
                    onChange({ ...selection, educations: toggle(selection.educations, index) })
                  }
                  title={education.degree}
                  detail={[education.institution, period(education.startDate, education.endDate)]
                    .filter(Boolean)
                    .join(" · ")}
                />
              );
            })}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
