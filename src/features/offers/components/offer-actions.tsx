"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ClipboardPaste, Cpu, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ManualAiDialog } from "@/components/shared/manual-ai-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getManualAnalysisPrompt, submitManualAnalysis } from "@/features/analysis/manual-actions";
import { reanalyzeOffer } from "@/features/offers/actions";
import { isAiUsable, type AiAvailability } from "@/features/offers/components/method-field";
import { NO_RESUME, type AnalysisMethodInput, type OfferMethodInput } from "@/features/offers/schemas";
import { generateTailoredResume } from "@/features/resumes/actions";
import { getManualTailorPrompt, submitManualTailor } from "@/features/resumes/manual-actions";

type ResumeChoice = { id: string; title: string };

export function GenerateResumeButtons({ offerId, ai }: { offerId: string; ai: AiAvailability }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<AnalysisMethodInput | null>(null);
  const aiUsable = isAiUsable(ai);

  function generate(method: AnalysisMethodInput) {
    setRunning(method);
    startTransition(async () => {
      const result = await generateTailoredResume(offerId, method);
      setRunning(null);
      if (result.ok) {
        toast[result.data.fallback ? "warning" : "success"](result.message);
        router.push(`/resumes/${result.data.resumeId}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ai.enabled ? (
        <Button onClick={() => generate("AI")} disabled={pending || !aiUsable}>
          {running === "AI" ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          {running === "AI" ? "Rédaction en cours…" : "CV adapté avec l'IA"}
        </Button>
      ) : null}
      <ManualAiDialog
        title="CV adapté via ton abonnement Claude"
        description="Claude rédige un CV ciblé pour cette offre à partir de ton parcours, sans rien inventer."
        loadPrompt={() => getManualTailorPrompt(offerId)}
        submit={(response) => submitManualTailor(offerId, response)}
        onSuccess={({ resumeId }) => router.push(`/resumes/${resumeId}`)}
        submitLabel="Créer le CV"
        trigger={
          <Button variant={ai.enabled ? "outline" : "default"} disabled={pending}>
            <ClipboardPaste data-icon="inline-start" />
            CV adapté via mon abonnement
          </Button>
        }
      />
      <Button variant="outline" onClick={() => generate("RULES")} disabled={pending}>
        {running === "RULES" ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <Cpu data-icon="inline-start" />
        )}
        CV adapté automatique
      </Button>
    </div>
  );
}

export function ReanalyzeControls({
  offerId,
  resumes,
  defaultResumeId,
  ai,
  autoOpenManual = false,
}: {
  offerId: string;
  resumes: readonly ResumeChoice[];
  defaultResumeId: string | null;
  ai: AiAvailability;
  /** Ouvre directement le copier-coller (arrivée depuis le formulaire). */
  autoOpenManual?: boolean;
}) {
  const router = useRouter();
  const aiUsable = isAiUsable(ai);
  const [pending, startTransition] = useTransition();
  const [resumeId, setResumeId] = useState(defaultResumeId ?? resumes[0]?.id ?? NO_RESUME);
  const [method, setMethod] = useState<OfferMethodInput>(
    autoOpenManual ? "MANUAL" : aiUsable ? "AI" : "MANUAL",
  );
  const [manualOpen, setManualOpen] = useState(autoOpenManual);

  function onManualOpenChange(open: boolean) {
    setManualOpen(open);
    // Retire « ?manuel=1 » pour ne pas rouvrir le dialogue au rechargement.
    if (!open && autoOpenManual) router.replace(`/offers/${offerId}`);
  }

  function run() {
    if (method === "MANUAL") {
      setManualOpen(true);
      return;
    }
    startTransition(async () => {
      const result = await reanalyzeOffer(offerId, { resumeId, method });
      if (result.ok) toast[result.data.fallback ? "warning" : "success"](result.message);
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select value={resumeId} onValueChange={setResumeId} disabled={pending}>
        <SelectTrigger className="w-full sm:w-56" aria-label="CV de référence">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {resumes.map((resume) => (
            <SelectItem key={resume.id} value={resume.id}>
              {resume.title}
            </SelectItem>
          ))}
          <SelectItem value={NO_RESUME}>Profil uniquement</SelectItem>
        </SelectContent>
      </Select>
      <Select value={method} onValueChange={(value) => setMethod(value as OfferMethodInput)} disabled={pending}>
        <SelectTrigger className="w-full sm:w-56" aria-label="Méthode">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MANUAL">Via mon abonnement Claude</SelectItem>
          <SelectItem value="RULES">Automatique</SelectItem>
          {ai.enabled ? (
            <SelectItem value="AI" disabled={!aiUsable}>
              IA (clé API)
            </SelectItem>
          ) : null}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={run} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <RefreshCw data-icon="inline-start" />}
        Relancer l&apos;analyse
      </Button>

      <ManualAiDialog
        open={manualOpen}
        onOpenChange={onManualOpenChange}
        title="Analyse fine via ton abonnement Claude"
        description="Claude évalue ta candidature comme un recruteur : note par critère, points forts, manques et conseils."
        loadPrompt={() => getManualAnalysisPrompt(offerId, resumeId)}
        submit={(response) => submitManualAnalysis(offerId, resumeId, response)}
        submitLabel="Enregistrer l'analyse"
      />
    </div>
  );
}
