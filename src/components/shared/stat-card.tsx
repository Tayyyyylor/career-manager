import type { Route } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  /** Rend la carte cliquable vers la page correspondante. */
  href?: Route;
};

export function StatCard({ label, value, hint, icon: Icon, href }: StatCardProps) {
  const card = (
    <Card
      className={cn(
        "h-full gap-3",
        href && "transition-shadow group-hover/stat:ring-foreground/20",
      )}
    >
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </CardTitle>
        <CardAction>
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover/stat:text-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
        </CardAction>
      </CardHeader>
      {hint ? (
        <p className="px-(--card-spacing) text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="group/stat block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {card}
    </Link>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="gap-3">
      <CardHeader>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-1 h-8 w-12" />
        <CardAction>
          <Skeleton className="size-9 rounded-lg" />
        </CardAction>
      </CardHeader>
      <div className="px-(--card-spacing)">
        <Skeleton className="h-3 w-32" />
      </div>
    </Card>
  );
}
