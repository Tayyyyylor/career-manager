import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, FileText, MapPin, Send, Trash2 } from "lucide-react";

import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnalysisView } from "@/features/analysis/components/analysis-view";
import { ScoreBadge } from "@/features/analysis/components/score";
import { NewApplicationButton } from "@/features/applications/components/applications-list";
import { APPLICATION_STATUS_LABELS } from "@/features/applications/constants";
import { NO_LINK } from "@/features/applications/schemas";
import { deleteOffer } from "@/features/offers/actions";
import {
  GenerateResumeButtons,
  ReanalyzeControls,
} from "@/features/offers/components/offer-actions";
import { getOfferDetail } from "@/features/offers/queries";
import { getScoreScale } from "@/features/profile/queries";
import { getGenericResumeOptions } from "@/features/resumes/queries";
import { getAiAvailability } from "@/lib/ai";
import { formatShortDate } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Analyse d'offre" };

/** Laisse le temps aux actions IA (analyse, CV adapté) de se terminer. */
export const maxDuration = 60;

export default function OfferPage({ params, searchParams }: PageProps<"/offers/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton items={2} />}>
      <OfferView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OfferView({
  params,
  searchParams,
}: {
  params: PageProps<"/offers/[id]">["params"];
  searchParams: PageProps<"/offers/[id]">["searchParams"];
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const [offer, scale, resumes, ai] = await Promise.all([
    getOfferDetail(id),
    getScoreScale(),
    getGenericResumeOptions(),
    getAiAvailability(user.id),
  ]);
  if (!offer) notFound();

  const [latest, ...previous] = offer.analyses;
  const latestTailored = offer.resumes[0];

  return (
    <>
      <PageHeader
        title={offer.title}
        description={[offer.company, offer.location, `ajoutée le ${formatShortDate(offer.createdAt)}`]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link href="/offers">
                <ArrowLeft data-icon="inline-start" />
                Offres
              </Link>
            </Button>
            {offer.sourceUrl ? (
              <Button variant="outline" asChild>
                <a href={offer.sourceUrl} target="_blank" rel="noreferrer noopener">
                  <ExternalLink data-icon="inline-start" />
                  Annonce
                </a>
              </Button>
            ) : null}
            <ConfirmActionButton
              action={deleteOffer.bind(null, offer.id)}
              title="Supprimer cette offre ?"
              description="L'offre et ses analyses seront supprimées. Les CV adaptés et candidatures liés sont conservés."
              redirectTo="/offers"
              trigger={
                <Button variant="ghost" size="icon" aria-label="Supprimer l'offre">
                  <Trash2 />
                </Button>
              }
            />
          </>
        }
      />

      {latest?.details ? (
        <AnalysisView
          score={latest.score}
          scale={scale}
          details={latest.details}
          method={latest.method}
          model={latest.model}
          resumeTitle={latest.resume?.title ?? null}
          createdAt={latest.createdAt}
        />
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Aucune analyse disponible pour cette offre : relance-la ci-dessous.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Passer à l&apos;action</CardTitle>
          <CardDescription>
            Génère un CV adapté à cette offre puis suis ta candidature.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <p className="text-sm font-medium">CV adapté</p>
            <GenerateResumeButtons offerId={offer.id} ai={ai} />
            {offer.resumes.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-2">
                {offer.resumes.map((resume) => (
                  <li key={resume.id}>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/resumes/${resume.id}`}>
                        <FileText data-icon="inline-start" />
                        {resume.method === "AI" ? "IA" : "Auto"} · {formatShortDate(resume.createdAt)}
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Candidature</p>
            <div className="flex flex-wrap items-center gap-2">
              <Suspense fallback={<Button disabled>Créer la candidature</Button>}>
                <NewApplicationButton
                  trigger={
                    <Button variant="outline">
                      <Send data-icon="inline-start" />
                      Créer la candidature
                    </Button>
                  }
                  defaultValues={{
                    company: offer.company ?? "",
                    position: offer.title,
                    status: "TO_APPLY",
                    appliedAt: "",
                    url: offer.sourceUrl ?? "",
                    notes: "",
                    jobOfferId: offer.id,
                    resumeId: latestTailored?.id ?? NO_LINK,
                  }}
                />
              </Suspense>
              {offer.applications.map((application) => (
                <Button key={application.id} variant="secondary" size="sm" asChild>
                  <Link href="/applications">
                    {APPLICATION_STATUS_LABELS[application.status]} · {formatShortDate(application.createdAt)}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Nouvelle analyse</p>
            <ReanalyzeControls
              offerId={offer.id}
              resumes={resumes}
              defaultResumeId={latest?.resumeId ?? null}
              ai={ai}
              autoOpenManual={query.manuel === "1"}
            />
          </div>
        </CardContent>
      </Card>

      {previous.length > 0 ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Analyses précédentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {previous.map((analysis) => (
                <li key={analysis.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    {formatShortDate(analysis.createdAt)} · {analysis.method === "AI" ? "IA" : "Automatique"}
                    {analysis.resume ? ` · ${analysis.resume.title}` : ""}
                  </span>
                  <ScoreBadge score={analysis.score} scale={scale} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Texte de l&apos;annonce
            {offer.location ? (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <MapPin className="size-3" aria-hidden />
                {offer.location}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground select-none">
              Afficher le texte analysé ({offer.description.length.toLocaleString("fr-FR")} caractères)
            </summary>
            <p className="mt-3 max-h-[28rem] overflow-y-auto whitespace-pre-line text-sm">
              {offer.description}
            </p>
          </details>
        </CardContent>
      </Card>
    </>
  );
}
