import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/navigation";

const page = routes.offers;

export const metadata: Metadata = { title: page.title };

export default function OffersPage() {
  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <EmptyState
        icon={page.icon}
        title="Aucune offre analysée"
        description="Vous pourrez coller le lien ou la description d'une annonce pour obtenir une note de correspondance avec votre CV."
      >
        <Badge variant="secondary">Bientôt disponible</Badge>
      </EmptyState>
    </>
  );
}
