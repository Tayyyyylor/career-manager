import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/navigation";

const page = routes.applications;

export const metadata: Metadata = { title: page.title };

export default function ApplicationsPage() {
  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <EmptyState
        icon={page.icon}
        title="Aucune candidature suivie"
        description="Vous pourrez suivre chaque candidature : entreprise, poste, statut, date d'envoi et CV utilisé."
      >
        <Badge variant="secondary">Bientôt disponible</Badge>
      </EmptyState>
    </>
  );
}
