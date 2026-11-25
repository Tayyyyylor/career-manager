import { formatScore, scoreLabel, scoreTone, type ScoreScale, type ScoreTone } from "@/lib/format";
import { cn } from "@/lib/utils";

const toneText: Record<ScoreTone, string> = {
  high: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-red-600 dark:text-red-400",
};

const toneBg: Record<ScoreTone, string> = {
  high: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  medium: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  low: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300",
};

const toneBar: Record<ScoreTone, string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-red-500",
};

const toneStroke: Record<ScoreTone, string> = {
  high: "stroke-emerald-500",
  medium: "stroke-amber-500",
  low: "stroke-red-500",
};

/** Pastille compacte « 72/100 ». */
export function ScoreBadge({
  score,
  scale,
  className,
}: {
  score: number;
  scale: ScoreScale;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap tabular-nums ring-1 ring-inset",
        toneBg[scoreTone(score)],
        className,
      )}
    >
      {formatScore(score, scale)}
    </span>
  );
}

/** Jauge circulaire de la note globale. */
export function ScoreGauge({ score, scale }: { score: number; scale: ScoreScale }) {
  const tone = scoreTone(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  const [value, max] = formatScore(score, scale).split("/");

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-36">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-muted" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-[stroke-dashoffset] duration-700", toneStroke[tone])}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-4xl font-semibold tracking-tight tabular-nums", toneText[tone])}>
            {value}
          </span>
          <span className="text-xs text-muted-foreground">sur {max}</span>
        </div>
      </div>
      <span className={cn("text-sm font-medium", toneText[tone])}>{scoreLabel(score)}</span>
    </div>
  );
}

/** Barre horizontale d'un critère. */
export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
      <div
        className={cn("h-full rounded-full", toneBar[scoreTone(score)])}
        style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
      />
    </div>
  );
}
