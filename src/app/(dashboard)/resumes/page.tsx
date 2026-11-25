import type { Metadata } from "next";
import { Suspense } from "react";
import { Upload } from "lucide-react";

import { ListSkeleton } from "@/components/shared/list-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/navigation";
import { ResumesList } from "@/features/resumes/components/resumes-list";
import { UploadResumeDialog } from "@/features/resumes/components/upload-resume-dialog";
import { getAiAvailability } from "@/lib/ai";
import { requireUser } from "@/lib/session";

const page = routes.resumes;

export const metadata: Metadata = { title: page.title };

/** Laisse le temps à une extraction par IA de se terminer. */
export const maxDuration = 60;

const uploadButton = (
  <Button>
    <Upload data-icon="inline-start" />
    Importer un PDF
  </Button>
);

export default function ResumesPage() {
  return (
    <>
      <PageHeader
        title={page.title}
        description={page.description}
        actions={
          <Suspense fallback={<Button disabled>Importer un PDF</Button>}>
            <UploadButton />
          </Suspense>
        }
      />
      <Suspense fallback={<ListSkeleton items={2} />}>
        <ResumesList />
      </Suspense>
    </>
  );
}

async function UploadButton() {
  const user = await requireUser();
  const ai = await getAiAvailability(user.id);
  return <UploadResumeDialog trigger={uploadButton} ai={ai} />;
}
