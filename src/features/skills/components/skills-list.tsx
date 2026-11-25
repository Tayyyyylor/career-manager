import { Pencil, Plus } from "lucide-react";

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
import { deleteSkill } from "@/features/skills/actions";
import { SkillFormDialog } from "@/features/skills/components/skill-form-dialog";
import {
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABELS,
  SKILL_LEVEL_LABELS,
} from "@/features/skills/constants";
import { getSkills } from "@/features/skills/queries";

export async function SkillsList() {
  const skills = await getSkills();

  if (skills.length === 0) {
    return (
      <EmptyState
        icon={routes.skills.icon}
        title="Aucune compétence pour le moment"
        description="Ajoute tes compétences une par une ou colle une liste avec l'ajout rapide. Elles servent de base à l'analyse des offres. Tu peux aussi les remplir automatiquement depuis ton CV."
      >
        <ImportFromCvLink />
      </EmptyState>
    );
  }

  const groups = SKILL_CATEGORIES.map((category) => ({
    category,
    skills: skills.filter((skill) => skill.category === category),
  })).filter((group) => group.skills.length > 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {groups.map(({ category, skills: items }) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{SKILL_CATEGORY_LABELS[category]}</CardTitle>
            <CardDescription>
              {items.length} compétence{items.length > 1 ? "s" : ""}
            </CardDescription>
            <CardAction>
              <SkillFormDialog
                defaultCategory={category}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Ajouter dans cette catégorie">
                    <Plus />
                  </Button>
                }
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="-mx-2 divide-y">
              {items.map((skill) => {
                const usage = skill._count.experiences + skill._count.projects;
                return (
                  <li key={skill.id} className="flex items-center gap-2 px-2 py-2">
                    <span className="min-w-0 flex-1 truncate font-medium">{skill.name}</span>
                    {usage > 0 ? (
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        utilisée {usage}×
                      </span>
                    ) : null}
                    {skill.level ? (
                      <Badge variant="secondary">{SKILL_LEVEL_LABELS[skill.level]}</Badge>
                    ) : null}
                    <SkillFormDialog
                      skill={skill}
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={`Modifier ${skill.name}`}>
                          <Pencil />
                        </Button>
                      }
                    />
                    <ConfirmActionButton
                      action={deleteSkill.bind(null, skill.id)}
                      title={`Supprimer « ${skill.name} » ?`}
                      description="La compétence sera retirée de tes expériences et projets."
                    />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
