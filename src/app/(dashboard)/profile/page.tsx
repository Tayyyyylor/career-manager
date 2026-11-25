import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/navigation";

const page = routes.profile;

export const metadata: Metadata = { title: page.title };

export default function ProfilePage() {
  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <EmptyState
        icon={page.icon}
        title="Profil non renseigné"
        description="Votre identité, vos coordonnées et votre présentation professionnelle pourront être saisies ici."
      >
        <Badge variant="secondary">Bientôt disponible</Badge>
      </EmptyState>
    </>
  );
}
