import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink, FileText, Pencil, ScanSearch } from "lucide-react";

import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { routes } from "@/config/navigation";
import { ScoreBadge } from "@/features/analysis/components/score";
import { deleteApplication } from "@/features/applications/actions";
import { ApplicationFormDialog } from "@/features/applications/components/application-form-dialog";
import { StatusSelect } from "@/features/applications/components/status-select";
import {
  ACTIVE_STATUSES,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
} from "@/features/applications/constants";
import {
  getApplicationLinkOptions,
  getApplications,
  type ApplicationItem,
} from "@/features/applications/queries";
import { NO_LINK, toDateInput, type ApplicationInput } from "@/features/applications/schemas";
import { getScoreScale } from "@/features/profile/queries";
import { formatShortDate } from "@/lib/format";

function toFormValues(application: ApplicationItem): ApplicationInput {
  return {
    company: application.company,
    position: application.position,
    status: application.status,
    appliedAt: toDateInput(application.appliedAt),
    url: application.url ?? "",
    notes: application.notes ?? "",
    jobOfferId: application.jobOfferId ?? NO_LINK,
    resumeId: application.resumeId ?? NO_LINK,
  };
}

export async function ApplicationsList() {
  const [applications, links, scale] = await Promise.all([
    getApplications(),
    getApplicationLinkOptions(),
    getScoreScale(),
  ]);

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={routes.applications.icon}
        title="Aucune candidature suivie"
        description="Ajoute une candidature ici ou depuis l'analyse d'une offre pour suivre son avancement."
      />
    );
  }

  const counts = new Map(APPLICATION_STATUSES.map((status) => [status, 0]));
  for (const application of applications) {
    counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
  }
  const active = applications.filter((application) => ACTIVE_STATUSES.includes(application.status)).length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground">
          {active} en cours
        </span>
        {APPLICATION_STATUSES.map((status) =>
          counts.get(status) ? (
            <span key={status} className="rounded-full border px-3 py-1 text-muted-foreground">
              {APPLICATION_STATUS_LABELS[status]} · {counts.get(status)}
            </span>
          ) : null,
        )}
      </div>

      <Card className="py-0">
        <ul className="divide-y">
          {applications.map((application) => {
            const score = application.jobOffer?.analyses[0]?.score;
            return (
              <li key={application.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{application.position}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {application.company}
                    {application.appliedAt ? ` · envoyée le ${formatShortDate(application.appliedAt)}` : ""}
                  </p>
                  {application.notes ? (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{application.notes}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {score !== undefined ? <ScoreBadge score={score} scale={scale} /> : null}
                  <StatusSelect id={application.id} status={application.status} />
                  {application.jobOffer ? (
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link href={`/offers/${application.jobOffer.id}`} aria-label="Voir l'analyse de l'offre">
                        <ScanSearch />
                      </Link>
                    </Button>
                  ) : null}
                  {application.resume?.kind === "TAILORED" ? (
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link href={`/resumes/${application.resume.id}`} aria-label="Voir le CV utilisé">
                        <FileText />
                      </Link>
                    </Button>
                  ) : null}
                  {application.url ? (
                    <Button variant="ghost" size="icon-sm" asChild>
                      <a href={application.url} target="_blank" rel="noreferrer noopener" aria-label="Ouvrir le lien">
                        <ExternalLink />
                      </a>
                    </Button>
                  ) : null}
                  <ApplicationFormDialog
                    applicationId={application.id}
                    defaultValues={toFormValues(application)}
                    links={links}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Modifier la candidature">
                        <Pencil />
                      </Button>
                    }
                  />
                  <ConfirmActionButton
                    action={deleteApplication.bind(null, application.id)}
                    title="Supprimer cette candidature ?"
                    description={`${application.position} chez ${application.company}.`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

export async function NewApplicationButton({
  trigger,
  defaultValues,
}: {
  trigger: ReactNode;
  defaultValues?: ApplicationInput;
}) {
  const links = await getApplicationLinkOptions();
  return <ApplicationFormDialog links={links} trigger={trigger} defaultValues={defaultValues} />;
}
