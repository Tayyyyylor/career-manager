import type { Metadata } from "next";
import { Suspense } from "react";
import { ListPlus, Plus } from "lucide-react";

import { ListSkeleton } from "@/components/shared/list-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/navigation";
import { BulkSkillsDialog } from "@/features/skills/components/bulk-skills-dialog";
import { SkillFormDialog } from "@/features/skills/components/skill-form-dialog";
import { SkillsList } from "@/features/skills/components/skills-list";

const page = routes.skills;

export const metadata: Metadata = { title: page.title };

export default function SkillsPage() {
  return (
    <>
      <PageHeader
        title={page.title}
        description={page.description}
        actions={
          <>
            <BulkSkillsDialog
              trigger={
                <Button variant="outline">
                  <ListPlus data-icon="inline-start" />
                  Ajout rapide
                </Button>
              }
            />
            <SkillFormDialog
              trigger={
                <Button>
                  <Plus data-icon="inline-start" />
                  Ajouter
                </Button>
              }
            />
          </>
        }
      />
      <Suspense fallback={<ListSkeleton items={2} />}>
        <SkillsList />
      </Suspense>
    </>
  );
}
