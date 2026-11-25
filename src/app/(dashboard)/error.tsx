"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: unknown;
  retry: () => void;
};

export default function DashboardError({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : null;

  return (
    <EmptyState
      icon={TriangleAlert}
      title="Une erreur est survenue"
      description="Impossible d'afficher cette page. Vérifie ta connexion, puis réessaie."
    >
      <Button variant="outline" onClick={() => retry()}>
        <RotateCcw data-icon="inline-start" />
        Réessayer
      </Button>
      {digest ? (
        <p className="font-mono text-xs text-muted-foreground">Réf. {digest}</p>
      ) : null}
    </EmptyState>
  );
}
