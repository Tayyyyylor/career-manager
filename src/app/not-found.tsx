import Link from "next/link";
import { Compass } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        icon={Compass}
        title="Page introuvable"
        description="Cette page n'existe pas ou a été déplacée."
        className="max-w-md flex-none"
      >
        <Button asChild>
          <Link href="/">Retour au tableau de bord</Link>
        </Button>
      </EmptyState>
    </main>
  );
}
