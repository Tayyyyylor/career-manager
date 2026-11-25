import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { routes } from "@/config/navigation";
import { ScoreBadge } from "@/features/analysis/components/score";
import { getRecentAnalyses } from "@/features/dashboard/queries";
import { getScoreScale } from "@/features/profile/queries";

const Icon = routes.offers.icon;

export async function RecentAnalyses() {
  const [offers, scale] = await Promise.all([getRecentAnalyses(), getScoreScale()]);

  return (
    <Card className="h-full">
      <CardHeader>
        {offers.length === 0 ? (
          <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
        <CardTitle>{offers.length === 0 ? "Analyser une offre" : "Dernières analyses"}</CardTitle>
        <CardDescription>
          {offers.length === 0
            ? "Colle le lien ou le texte d'une annonce pour mesurer sa correspondance avec ton CV et obtenir une note."
            : "Tes offres les plus récentes et leur note."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {offers.length > 0 ? (
          <ul className="-mx-2 grid grid-cols-1 gap-0.5">
            {offers.map((offer) => (
              <li key={offer.id}>
                <Link
                  href={`/offers/${offer.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{offer.title}</span>
                    {offer.company ? (
                      <span className="block truncate text-xs text-muted-foreground">{offer.company}</span>
                    ) : null}
                  </span>
                  <ScoreBadge score={offer.score} scale={scale} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Compétences attendues vs. maîtrisées</li>
            <li>• Expérience demandée vs. acquise</li>
            <li>• Note sur 100 ou sur 20, avec conseils</li>
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={routes.offers.href}>
            {offers.length === 0 ? "Analyser une offre" : "Nouvelle analyse"}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
