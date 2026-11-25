import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { ListSkeleton } from "@/components/shared/list-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/navigation";
import { EducationFormDialog } from "@/features/education/components/education-form-dialog";
import { EducationList } from "@/features/education/components/education-list";

const page = routes.education;

export const metadata: Metadata = { title: page.title };

export default function EducationPage() {
  return (
    <>
      <PageHeader
        title={page.title}
        description={page.description}
        actions={
          <EducationFormDialog
            trigger={
              <Button>
                <Plus data-icon="inline-start" />
                Ajouter
              </Button>
            }
          />
        }
      />
      <Suspense fallback={<ListSkeleton items={2} />}>
        <EducationList />
      </Suspense>
    </>
  );
}
