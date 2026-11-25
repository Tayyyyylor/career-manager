import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/navigation";

const page = routes.skills;

export const metadata: Metadata = { title: page.title };

export default function SkillsPage() {
  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <EmptyState
        icon={page.icon}
        title="Aucune compétence enregistrée"
        description="Vous pourrez ajouter vos compétences, les classer par catégorie et indiquer votre niveau de maîtrise."
      >
        <Badge variant="secondary">Bientôt disponible</Badge>
      </EmptyState>
    </>
  );
}
