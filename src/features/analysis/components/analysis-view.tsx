import { CheckCircle2, CircleAlert, Lightbulb, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScoreBar, ScoreGauge } from "@/features/analysis/components/score";
import type { AnalysisDetails } from "@/features/analysis/types";
import { formatDate, type ScoreScale } from "@/lib/format";

type AnalysisViewProps = {
  score: number;
  scale: ScoreScale;
  details: AnalysisDetails;
  method: "RULES" | "AI";
  model: string | null;
  resumeTitle: string | null;
  createdAt: Date;
};

function BulletCard({
  title,
  icon: Icon,
  iconClassName,
  items,
  empty,
}: {
  title: string;
  icon: typeof CheckCircle2;
  iconClassName: string;
  items: readonly string[];
  empty: string;
}) {
  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`size-4 ${iconClassName}`} aria-hidden />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Affichage complet d'une analyse (règles ou IA). */
export function AnalysisView({
  score,
  scale,
  details,
  method,
  model,
  resumeTitle,
  createdAt,
}: AnalysisViewProps) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr]">
        <Card className="items-center text-center">
          <CardContent className="flex flex-col items-center gap-4 pt-2">
            <ScoreGauge score={score} scale={scale} />
            <p className="text-sm text-muted-foreground">{details.summary}</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              <Badge variant="secondary">
                {method === "AI" ? <Sparkles data-icon="inline-start" /> : null}
                {method === "AI" ? `IA${model ? ` · ${model}` : ""}` : "Analyse automatique"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {resumeTitle ? `CV : ${resumeTitle} · ` : "Sans CV PDF · "}
              {formatDate(createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détail de la note</CardTitle>
            <CardDescription>Chaque critère est noté sur 100 puis pondéré.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4">
              {details.criteria.map((criterion) => (
                <li key={criterion.key} className="grid gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">
                      {criterion.label}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        poids {Math.round(criterion.weight * 100)} %
                      </span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{Math.round(criterion.score)}/100</span>
                  </div>
                  <ScoreBar score={criterion.score} />
                  <p className="text-xs text-muted-foreground">{criterion.comment}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {details.matchedSkills.length > 0 || details.missingSkills.length > 0 ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Compétences demandées</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {details.matchedSkills.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-muted-foreground">Présentes</span>
                {details.matchedSkills.map((skill) => (
                  <Badge key={skill} className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : null}
            {details.missingSkills.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-muted-foreground">Manquantes</span>
                {details.missingSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="border-red-500/30 text-red-700 dark:text-red-300">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : null}
            {details.keywords && details.keywords.missing.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-muted-foreground">Mots-clés absents de ton CV</span>
                {details.keywords.missing.map((keyword) => (
                  <Badge key={keyword} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BulletCard
          title="Points forts"
          icon={CheckCircle2}
          iconClassName="text-emerald-500"
          items={details.strengths}
          empty="Aucun point fort identifié."
        />
        <BulletCard
          title="Points de vigilance"
          icon={CircleAlert}
          iconClassName="text-amber-500"
          items={details.gaps}
          empty="Aucun manque majeur détecté."
        />
        <BulletCard
          title="Recommandations"
          icon={Lightbulb}
          iconClassName="text-sky-500"
          items={details.recommendations}
          empty="Rien à signaler."
        />
      </div>
    </div>
  );
}
