import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Squelette générique pour une liste de cartes en cours de chargement. */
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: items }, (_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
