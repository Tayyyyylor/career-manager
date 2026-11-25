import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { ListSkeleton } from "@/components/shared/list-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/navigation";
import {
  ApplicationsList,
  NewApplicationButton,
} from "@/features/applications/components/applications-list";

const page = routes.applications;

export const metadata: Metadata = { title: page.title };

const addButton = (
  <Button>
    <Plus data-icon="inline-start" />
    Ajouter
  </Button>
);

export default function ApplicationsPage() {
  return (
    <>
      <PageHeader
        title={page.title}
        description={page.description}
        actions={
          <Suspense fallback={<Button disabled>Ajouter</Button>}>
            <NewApplicationButton trigger={addButton} />
          </Suspense>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <ApplicationsList />
      </Suspense>
    </>
  );
}
