import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { ListSkeleton } from "@/components/shared/list-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/navigation";
import {
  NewProjectButton,
  ProjectsList,
} from "@/features/projects/components/projects-list";

const page = routes.projects;

export const metadata: Metadata = { title: page.title };

const addButton = (
  <Button>
    <Plus data-icon="inline-start" />
    Ajouter
  </Button>
);

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title={page.title}
        description={page.description}
        actions={
          <Suspense fallback={<Button disabled>Ajouter</Button>}>
            <NewProjectButton trigger={addButton} />
          </Suspense>
        }
      />
      <Suspense fallback={<ListSkeleton items={2} />}>
        <ProjectsList />
      </Suspense>
    </>
  );
}
