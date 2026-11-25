import Link from "next/link";
import { ExternalLink, FileText, Sparkles, Star, WandSparkles } from "lucide-react";

import { ActionButton } from "@/components/shared/action-button";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AiAvailability } from "@/features/offers/components/method-field";
import { deleteResume, setDefaultResume } from "@/features/resumes/actions";
import { ImportFromResumeDialog } from "@/features/resumes/components/import-from-resume-dialog";
import { getResumes, type ResumeListItem } from "@/features/resumes/queries";
import { getAiAvailability } from "@/lib/ai";
import { formatFileSize, formatShortDate } from "@/lib/format";
import { requireUser } from "@/lib/session";

function wordCount(text: string | null): number {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function GenericResumeCard({ resume, ai }: { resume: ResumeListItem; ai: AiAvailability }) {
  const words = wordCount(resume.extractedText);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {resume.title}
          {resume.isDefault ? <Badge>Par défaut</Badge> : null}
        </CardTitle>
        <CardDescription className="flex flex-wrap gap-x-2">
          <span>{resume.fileName}</span>
          {resume.fileSize ? <span>· {formatFileSize(resume.fileSize)}</span> : null}
          <span>· importé le {formatShortDate(resume.createdAt)}</span>
        </CardDescription>
        <CardAction>
          <ConfirmActionButton
            action={deleteResume.bind(null, resume.id)}
            title="Supprimer ce CV ?"
            description="Le fichier et son texte extrait seront supprimés. Les analyses passées sont conservées."
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {words > 0 ? (
          <details className="group rounded-lg border bg-muted/30 text-xs">
            <summary className="cursor-pointer px-3 py-2 font-medium text-muted-foreground select-none">
              Texte extrait ({words} mots) — vérifie qu&apos;il est lisible
            </summary>
            <pre className="max-h-64 overflow-auto px-3 pb-3 font-sans whitespace-pre-wrap text-muted-foreground">
              {resume.extractedText}
            </pre>
          </details>
        ) : (
          <p className="text-sm text-destructive">
            Aucun texte extrait : ce PDF est probablement une image. Exporte ton CV en PDF « texte »
            depuis Word, Google Docs ou Canva.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <ImportFromResumeDialog
          resumeId={resume.id}
          ai={ai}
          trigger={
            <Button size="sm">
              <WandSparkles data-icon="inline-start" />
              Remplir mon profil
            </Button>
          }
        />
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/resumes/${resume.id}/file`} target="_blank" rel="noreferrer">
            <ExternalLink data-icon="inline-start" />
            Ouvrir le PDF
          </a>
        </Button>
        {!resume.isDefault ? (
          <ActionButton variant="ghost" size="sm" action={setDefaultResume.bind(null, resume.id)}>
            <Star data-icon="inline-start" />
            Définir par défaut
          </ActionButton>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function TailoredResumeRow({ resume }: { resume: ResumeListItem }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FileText className="size-4" aria-hidden />
      </span>
      <Link href={`/resumes/${resume.id}`} className="min-w-0 flex-1 outline-none hover:underline focus-visible:underline">
        <span className="block truncate font-medium">{resume.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {resume.jobOffer
            ? `${resume.jobOffer.title}${resume.jobOffer.company ? ` — ${resume.jobOffer.company}` : ""}`
            : "Offre supprimée"}
          {" · "}
          {formatShortDate(resume.createdAt)}
        </span>
      </Link>
      {resume.method === "AI" ? (
        <Badge variant="secondary" className="hidden sm:inline-flex">
          <Sparkles data-icon="inline-start" />
          IA
        </Badge>
      ) : null}
      <ConfirmActionButton
        action={deleteResume.bind(null, resume.id)}
        title="Supprimer ce CV adapté ?"
        description="Tu pourras en générer un nouveau depuis l'analyse de l'offre."
      />
    </li>
  );
}

export async function ResumesList() {
  const user = await requireUser();
  const [resumes, ai] = await Promise.all([getResumes(), getAiAvailability(user.id)]);
  const generic = resumes.filter((resume) => resume.kind === "GENERIC");
  const tailored = resumes.filter((resume) => resume.kind === "TAILORED");

  return (
    <div className="grid gap-8">
      <section className="grid gap-4" aria-labelledby="generic-resumes">
        <h2 id="generic-resumes" className="text-sm font-medium text-muted-foreground">
          CV génériques
        </h2>
        {generic.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun CV importé"
            description="Importe ton CV actuel au format PDF : il sert de base à l'analyse des offres et aux CV adaptés."
          />
        ) : (
          <div className="grid gap-4">
            {generic.map((resume) => (
              <GenericResumeCard key={resume.id} resume={resume} ai={ai} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4" aria-labelledby="tailored-resumes">
        <h2 id="tailored-resumes" className="text-sm font-medium text-muted-foreground">
          CV adaptés aux offres
        </h2>
        {tailored.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Génère un CV adapté depuis l&apos;analyse d&apos;une offre : il apparaîtra ici.
          </p>
        ) : (
          <Card className="py-0">
            <ul className="divide-y">
              {tailored.map((resume) => (
                <TailoredResumeRow key={resume.id} resume={resume} />
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
