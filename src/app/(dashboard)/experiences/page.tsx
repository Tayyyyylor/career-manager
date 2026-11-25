import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { ListSkeleton } from "@/components/shared/list-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/navigation";
import {
  ExperiencesList,
  NewExperienceButton,
} from "@/features/experiences/components/experiences-list";

const page = routes.experiences;

export const metadata: Metadata = { title: page.title };

const addButton = (
  <Button>
    <Plus data-icon="inline-start" />
    Ajouter
  </Button>
);

export default function ExperiencesPage() {
  return (
    <>
      <PageHeader
        title={page.title}
        description={page.description}
        actions={
          <Suspense fallback={<Button disabled>Ajouter</Button>}>
            <NewExperienceButton trigger={addButton} />
          </Suspense>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <ExperiencesList />
      </Suspense>
    </>
  );
}
