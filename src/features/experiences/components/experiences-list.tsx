import { MapPin, Pencil } from "lucide-react";

import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ImportFromCvLink } from "@/components/shared/import-from-cv-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { routes } from "@/config/navigation";
import { deleteExperience } from "@/features/experiences/actions";
import { ExperienceFormDialog } from "@/features/experiences/components/experience-form-dialog";
import { EMPLOYMENT_TYPE_LABELS } from "@/features/experiences/constants";
import {
  getExperiences,
  type ExperienceWithSkills,
} from "@/features/experiences/queries";
import type { ExperienceInput } from "@/features/experiences/schemas";
import { getSkillOptions } from "@/features/skills/queries";
import { formatDuration, formatPeriod, toMonthInput } from "@/lib/format";

function toFormValues(experience: ExperienceWithSkills): ExperienceInput {
  return {
    position: experience.position,
    company: experience.company,
    location: experience.location ?? "",
    employmentType: experience.employmentType ?? "NONE",
    startDate: toMonthInput(experience.startDate),
    current: experience.endDate === null,
    endDate: toMonthInput(experience.endDate),
    description: experience.description ?? "",
    achievements: experience.achievements.join("\n"),
    skillIds: experience.skills.map((skill) => skill.id),
    newSkills: "",
  };
}

export async function ExperiencesList() {
  const [experiences, skills] = await Promise.all([getExperiences(), getSkillOptions()]);

  if (experiences.length === 0) {
    return (
      <EmptyState
        icon={routes.experiences.icon}
        title="Aucune expérience pour le moment"
        description="Ajoute tes postes, stages et missions : ils alimentent l'analyse des offres et la génération de CV adaptés. Tu peux aussi les remplir automatiquement depuis ton CV."
      >
        <ImportFromCvLink />
      </EmptyState>
    );
  }

  return (
    <ol className="grid gap-4">
      {experiences.map((experience) => (
        <li key={experience.id}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{experience.position}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-foreground">{experience.company}</span>
                <span aria-hidden>·</span>
                <span>{formatPeriod(experience.startDate, experience.endDate)}</span>
                <span className="text-xs">({formatDuration(experience.startDate, experience.endDate)})</span>
                {experience.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden />
                    {experience.location}
                  </span>
                ) : null}
              </CardDescription>
              <CardAction className="flex items-center gap-1">
                <ExperienceFormDialog
                  experienceId={experience.id}
                  defaultValues={toFormValues(experience)}
                  skills={skills}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label="Modifier l'expérience">
                      <Pencil />
                    </Button>
                  }
                />
                <ConfirmActionButton
                  action={deleteExperience.bind(null, experience.id)}
                  title="Supprimer cette expérience ?"
                  description={`« ${experience.position} » chez ${experience.company} sera définitivement supprimée.`}
                />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {experience.employmentType || experience.endDate === null ? (
                <div className="flex flex-wrap gap-1.5">
                  {experience.endDate === null ? <Badge>En poste</Badge> : null}
                  {experience.employmentType ? (
                    <Badge variant="outline">{EMPLOYMENT_TYPE_LABELS[experience.employmentType]}</Badge>
                  ) : null}
                </div>
              ) : null}
              {experience.description ? (
                <p className="whitespace-pre-line text-muted-foreground">{experience.description}</p>
              ) : null}
              {experience.achievements.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
                  {experience.achievements.map((achievement, index) => (
                    <li key={index}>{achievement}</li>
                  ))}
                </ul>
              ) : null}
              {experience.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {experience.skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </li>
      ))}
    </ol>
  );
}

/** Bouton « Ajouter » : charge les compétences disponibles (lecture de session). */
export async function NewExperienceButton({ trigger }: { trigger: React.ReactNode }) {
  const skills = await getSkillOptions();
  return <ExperienceFormDialog skills={skills} trigger={trigger} />;
}
