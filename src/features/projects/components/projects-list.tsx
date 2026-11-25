import type { ReactNode } from "react";
import { BriefcaseBusiness, ExternalLink, GitBranch, Pencil } from "lucide-react";

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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { routes } from "@/config/navigation";
import { getExperienceOptions } from "@/features/experiences/queries";
import { deleteProject } from "@/features/projects/actions";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { getProjects, type ProjectWithRelations } from "@/features/projects/queries";
import { NO_EXPERIENCE, type ProjectInput } from "@/features/projects/schemas";
import { getSkillOptions } from "@/features/skills/queries";
import { formatPeriod, toMonthInput } from "@/lib/format";

function toFormValues(project: ProjectWithRelations): ProjectInput {
  return {
    name: project.name,
    role: project.role ?? "",
    description: project.description ?? "",
    url: project.url ?? "",
    repositoryUrl: project.repositoryUrl ?? "",
    startDate: toMonthInput(project.startDate),
    endDate: toMonthInput(project.endDate),
    experienceId: project.experienceId ?? NO_EXPERIENCE,
    skillIds: project.skills.map((skill) => skill.id),
    newSkills: "",
  };
}

export async function ProjectsList() {
  const [projects, skills, experiences] = await Promise.all([
    getProjects(),
    getSkillOptions(),
    getExperienceOptions(),
  ]);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={routes.projects.icon}
        title="Aucun projet pour le moment"
        description="Documente tes projets marquants : ils enrichissent tes CV adaptés et l'analyse des offres. Tu peux aussi les remplir automatiquement depuis ton CV."
      >
        <ImportFromCvLink />
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {projects.map((project) => {
        const period = formatPeriod(project.startDate, project.endDate);
        return (
          <Card key={project.id} className="h-full">
            <CardHeader>
              <CardTitle className="text-base">{project.name}</CardTitle>
              <CardDescription className="flex flex-wrap gap-x-2">
                {project.role ? <span className="font-medium text-foreground">{project.role}</span> : null}
                {project.role && period ? <span aria-hidden>·</span> : null}
                {period ? <span>{period}</span> : null}
              </CardDescription>
              <CardAction className="flex items-center gap-1">
                <ProjectFormDialog
                  projectId={project.id}
                  defaultValues={toFormValues(project)}
                  skills={skills}
                  experiences={experiences}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label="Modifier le projet">
                      <Pencil />
                    </Button>
                  }
                />
                <ConfirmActionButton
                  action={deleteProject.bind(null, project.id)}
                  title="Supprimer ce projet ?"
                  description={`« ${project.name} » sera définitivement supprimé.`}
                />
              </CardAction>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {project.experience ? (
                <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BriefcaseBusiness className="size-3.5" aria-hidden />
                  {project.experience.position} — {project.experience.company}
                </p>
              ) : null}
              {project.description ? (
                <p className="line-clamp-5 whitespace-pre-line text-muted-foreground">
                  {project.description}
                </p>
              ) : null}
              {project.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {project.skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
            {project.url || project.repositoryUrl ? (
              <CardFooter className="gap-2">
                {project.url ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.url} target="_blank" rel="noreferrer noopener">
                      <ExternalLink data-icon="inline-start" />
                      Voir
                    </a>
                  </Button>
                ) : null}
                {project.repositoryUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.repositoryUrl} target="_blank" rel="noreferrer noopener">
                      <GitBranch data-icon="inline-start" />
                      Code
                    </a>
                  </Button>
                ) : null}
              </CardFooter>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

export async function NewProjectButton({ trigger }: { trigger: ReactNode }) {
  const [skills, experiences] = await Promise.all([getSkillOptions(), getExperienceOptions()]);
  return <ProjectFormDialog skills={skills} experiences={experiences} trigger={trigger} />;
}
