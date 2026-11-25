import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/navigation";

const page = routes.projects;

export const metadata: Metadata = { title: page.title };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <EmptyState
        icon={page.icon}
        title="Aucun projet enregistré"
        description="Vous pourrez documenter vos projets, leur contexte, votre rôle et les technologies utilisées."
      >
        <Badge variant="secondary">Bientôt disponible</Badge>
      </EmptyState>
    </>
  );
}
