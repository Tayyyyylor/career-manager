import { Pencil } from "lucide-react";

import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ImportFromCvLink } from "@/components/shared/import-from-cv-link";
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
import { deleteEducation } from "@/features/education/actions";
import { EducationFormDialog } from "@/features/education/components/education-form-dialog";
import { getEducations, type EducationItem } from "@/features/education/queries";
import type { EducationInput } from "@/features/education/schemas";
import { formatPeriod, toMonthInput } from "@/lib/format";

function toFormValues(education: EducationItem): EducationInput {
  return {
    degree: education.degree,
    institution: education.institution,
    fieldOfStudy: education.fieldOfStudy ?? "",
    location: education.location ?? "",
    startDate: toMonthInput(education.startDate),
    endDate: toMonthInput(education.endDate),
    description: education.description ?? "",
  };
}

export async function EducationList() {
  const educations = await getEducations();

  if (educations.length === 0) {
    return (
      <EmptyState
        icon={routes.education.icon}
        title="Aucune formation pour le moment"
        description="Ajoute tes diplômes, certifications et formations professionnelles. Tu peux aussi les remplir automatiquement depuis ton CV."
      >
        <ImportFromCvLink />
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-4">
      {educations.map((education) => {
        const period = formatPeriod(education.startDate, education.endDate);
        return (
          <Card key={education.id}>
            <CardHeader>
              <CardTitle className="text-base">{education.degree}</CardTitle>
              <CardDescription className="flex flex-wrap gap-x-2">
                <span className="font-medium text-foreground">{education.institution}</span>
                {education.fieldOfStudy ? <span>· {education.fieldOfStudy}</span> : null}
                {period ? <span>· {period}</span> : null}
                {education.location ? <span>· {education.location}</span> : null}
              </CardDescription>
              <CardAction className="flex items-center gap-1">
                <EducationFormDialog
                  educationId={education.id}
                  defaultValues={toFormValues(education)}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label="Modifier la formation">
                      <Pencil />
                    </Button>
                  }
                />
                <ConfirmActionButton
                  action={deleteEducation.bind(null, education.id)}
                  title="Supprimer cette formation ?"
                  description={`« ${education.degree} » sera définitivement supprimée.`}
                />
              </CardAction>
            </CardHeader>
            {education.description ? (
              <CardContent>
                <p className="whitespace-pre-line text-muted-foreground">{education.description}</p>
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
