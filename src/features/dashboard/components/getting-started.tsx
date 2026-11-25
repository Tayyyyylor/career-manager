import type { Route } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight, Circle, CircleCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/navigation";
import {
  getDashboardStats,
  type DashboardStats,
} from "@/features/dashboard/queries";
import { cn } from "@/lib/utils";

type Step = {
  label: string;
  description: string;
  href: Route;
  done: boolean;
};

function buildSteps(stats: DashboardStats): Step[] {
  return [
    {
      label: "Compléter mon profil",
      description: "Identité, coordonnées et présentation professionnelle.",
      href: routes.profile.href,
      done: stats.hasProfile,
    },
    {
      label: "Ajouter mes compétences",
      description: "Technologies, outils, méthodes et langues.",
      href: routes.skills.href,
      done: stats.skills > 0,
    },
    {
      label: "Renseigner mes expériences",
      description: "Postes occupés, missions et réalisations.",
      href: routes.experiences.href,
      done: stats.experiences > 0,
    },
    {
      label: "Importer mon CV générique",
      description: "Le PDF de référence pour les versions adaptées.",
      href: routes.resumes.href,
      done: stats.genericResumes > 0,
    },
    {
      label: "Analyser une première offre",
      description: "Mesurer la correspondance entre une annonce et votre CV.",
      href: routes.offers.href,
      done: stats.analyses > 0,
    },
  ];
}

export async function GettingStarted() {
  await connection();
  const steps = buildSteps(await getDashboardStats());
  const completed = steps.filter((step) => step.done).length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Bien démarrer</CardTitle>
        <CardDescription>
          {completed} sur {steps.length} étapes complétées
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress
          value={(completed / steps.length) * 100}
          aria-label="Progression de la configuration"
        />
        <ol className="-mx-2 space-y-1">
          {steps.map((step) => (
            <li key={step.href}>
              <Link
                href={step.href}
                className="group/step flex items-center gap-3 rounded-lg px-2 py-2 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {step.done ? (
                  <CircleCheck className="size-5 shrink-0 text-primary" aria-hidden />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground/60" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      step.done && "text-muted-foreground line-through",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {step.description}
                  </span>
                </span>
                <span className="sr-only">{step.done ? "(terminé)" : "(à faire)"}</span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/step:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function GettingStartedSkeleton() {
  return (
    <Card className="h-full" aria-busy="true">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-44" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-1 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-5 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
