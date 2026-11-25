import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Lightbulb, ScanSearch, WandSparkles } from "lucide-react";

import { ListSkeleton } from "@/components/shared/list-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile } from "@/features/profile/queries";
import { PrintButton } from "@/features/resumes/components/print-button";
import { ResumeStyleEditor } from "@/features/resumes/components/resume-style-editor";
import { cvFontVariables } from "@/features/resumes/style/fonts";
import { getUserDetectedStyle, initialTailoredStyle } from "@/features/resumes/style/server";
import { parseResumeStyle } from "@/features/resumes/style/types";
import { getTailoredResume } from "@/features/resumes/queries";
import { parseTailoredContent } from "@/features/resumes/tailored";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "CV adapté" };

export default function TailoredResumePage({ params }: PageProps<"/resumes/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton items={1} />}>
      <TailoredResumeView params={params} />
    </Suspense>
  );
}

async function TailoredResumeView({ params }: { params: PageProps<"/resumes/[id]">["params"] }) {
  const { id } = await params;
  const [resume, profile, user] = await Promise.all([
    getTailoredResume(id),
    getProfile(),
    requireUser(),
  ]);
  if (!resume) notFound();
  const [detected, style] = await Promise.all([
    getUserDetectedStyle(user.id),
    // CV adaptés créés avant les modèles : style par défaut de l'utilisateur.
    parseResumeStyle(resume.style) ?? initialTailoredStyle(user.id),
  ]);

  const content = parseTailoredContent(resume.content);
  if (!content) notFound();

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || user.name;
  const links = [profile?.linkedinUrl, profile?.githubUrl, profile?.websiteUrl].filter(
    (link): link is string => Boolean(link),
  );

  return (
    <div className={`grid gap-6 print:block ${cvFontVariables}`}>
      <div className="grid gap-6 print:hidden">
        <PageHeader
          title={resume.title}
          description={`Généré le ${formatDate(resume.createdAt)}${resume.method === "AI" ? " avec l'IA" : " automatiquement"}.`}
          actions={
            <>
              <Button variant="ghost" asChild>
                <Link href="/resumes">
                  <ArrowLeft data-icon="inline-start" />
                  Mes CV
                </Link>
              </Button>
              {resume.jobOffer ? (
                <Button variant="outline" asChild>
                  <Link href={`/offers/${resume.jobOffer.id}`}>
                    <ScanSearch data-icon="inline-start" />
                    Analyse
                  </Link>
                </Button>
              ) : null}
              <PrintButton />
            </>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
        {content.changes.length > 0 ? (
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WandSparkles className="size-4 text-sky-500" aria-hidden />
                Ce qui a été adapté pour l&apos;offre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {content.changes.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
        {content.advice.length > 0 ? (
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="size-4 text-amber-500" aria-hidden />
                Avant d&apos;envoyer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {content.advice.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
                <li>
                  Pour obtenir un PDF : « Imprimer / PDF », puis choisis « Enregistrer au format PDF »,
                  désactive les en-têtes et pieds de page et active les graphiques d&apos;arrière-plan.
                </li>
              </ul>
            </CardContent>
          </Card>
        ) : null}
        </div>
      </div>

      <ResumeStyleEditor
        resumeId={resume.id}
        content={content}
        initialStyle={style}
        detected={detected}
        contact={{
          fullName,
          email: profile?.email ?? user.email,
          phone: profile?.phone ?? null,
          location: profile?.location ?? null,
          links,
        }}
      />
    </div>
  );
}
