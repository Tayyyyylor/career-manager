import Link from "next/link";
import { WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Raccourci vers l'import automatique depuis le CV (états vides). */
export function ImportFromCvLink() {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href="/resumes">
        <WandSparkles data-icon="inline-start" />
        Remplir depuis mon CV
      </Link>
    </Button>
  );
}
