import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
import { routes } from "@/config/navigation";

const Icon = routes.offers.icon;

export function OfferAnalysisCta() {
  return (
    <Card className="h-full">
      <CardHeader>
        <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <CardAction>
          <Badge variant="secondary">Bientôt</Badge>
        </CardAction>
        <CardTitle>Analyser une offre</CardTitle>
        <CardDescription>
          Collez le lien ou le texte d&apos;une annonce pour mesurer sa
          correspondance avec votre CV et obtenir une note.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Compétences attendues vs. maîtrisées</li>
          <li>• Expériences pertinentes mises en avant</li>
          <li>• Score de cohérence sur un barème défini</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={routes.offers.href}>
            Ouvrir l&apos;analyse
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
