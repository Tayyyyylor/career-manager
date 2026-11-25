import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { routes } from "@/config/navigation";
import { ScoreBadge } from "@/features/analysis/components/score";
import { getOffers } from "@/features/offers/queries";
import { getScoreScale } from "@/features/profile/queries";
import { formatShortDate } from "@/lib/format";

export async function OffersList() {
  const [offers, scale] = await Promise.all([getOffers(), getScoreScale()]);

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={routes.offers.icon}
        title="Aucune offre analysée"
        description="Tes analyses apparaîtront ici, avec leur note et les CV adaptés générés."
      />
    );
  }

  return (
    <section className="grid gap-3" aria-labelledby="offers-history">
      <h2 id="offers-history" className="text-sm font-medium text-muted-foreground">
        Offres analysées ({offers.length})
      </h2>
      <Card className="py-0">
        <ul className="divide-y">
          {offers.map((offer) => (
            <li key={offer.id}>
              <Link
                href={`/offers/${offer.id}`}
                className="group flex items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{offer.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[offer.company, offer.location, formatShortDate(offer.createdAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                {offer.latest?.method === "AI" ? (
                  <Sparkles className="size-4 shrink-0 text-muted-foreground" aria-label="Analyse IA" />
                ) : null}
                {offer.latest ? <ScoreBadge score={offer.latest.score} scale={scale} /> : null}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
