"use client";

import { useState, useTransition } from "react";
import { Check, ClipboardCopy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

type ManualAiPanelProps = {
  /** Server Action qui prépare la demande à coller. */
  loadPrompt: () => Promise<ActionResult<{ prompt: string }>>;
  response: string;
  onResponseChange: (value: string) => void;
  error: string | null;
  disabled?: boolean;
};

function Step({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[1.75rem_1fr] gap-3">
      <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {index}
      </span>
      <div className="grid min-w-0 gap-2">
        <p className="pt-1 text-sm font-medium">{title}</p>
        {children}
      </div>
    </li>
  );
}

/**
 * Mode « via mon abonnement » : copier la demande, la coller dans claude.ai,
 * puis coller la réponse ici. Aucun appel API, aucun coût.
 */
export function ManualAiPanel({
  loadPrompt,
  response,
  onResponseChange,
  error,
  disabled,
}: ManualAiPanelProps) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, startLoading] = useTransition();

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Demande copiée : colle-la dans claude.ai.");
    } catch {
      setShowPrompt(true);
      toast.error("Copie automatique impossible : sélectionne le texte ci-dessous et copie-le.");
    }
  }

  function prepare() {
    startLoading(async () => {
      const result = await loadPrompt();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPrompt(result.data.prompt);
      await copy(result.data.prompt);
    });
  }

  return (
    <ol className="grid gap-5">
      <Step index={1} title="Copie la demande préparée">
        {prompt === null ? (
          <Button type="button" onClick={prepare} disabled={loading || disabled} className="w-fit">
            {loading ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <ClipboardCopy data-icon="inline-start" />
            )}
            Préparer et copier la demande
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant={copied ? "secondary" : "default"} onClick={() => copy(prompt)}>
              {copied ? <Check data-icon="inline-start" /> : <ClipboardCopy data-icon="inline-start" />}
              {copied ? "Copiée" : "Copier la demande"}
            </Button>
            <span className="text-xs text-muted-foreground">
              {prompt.length.toLocaleString("fr-FR")} caractères
            </span>
            <Button type="button" variant="link" size="sm" onClick={() => setShowPrompt((value) => !value)}>
              {showPrompt ? "Masquer" : "Afficher"} la demande
            </Button>
          </div>
        )}
        {prompt !== null && showPrompt ? (
          <Textarea
            readOnly
            value={prompt}
            rows={6}
            onFocus={(event) => event.currentTarget.select()}
            className="font-mono text-xs"
            aria-label="Demande à copier"
          />
        ) : null}
      </Step>

      <Step index={2} title="Colle-la dans une nouvelle conversation Claude">
        <p className="text-xs text-muted-foreground">
          Ton abonnement Claude suffit (un compte gratuit aussi). Ça marche également avec ChatGPT.
          Si un message te demande de joindre le PDF de ton CV, ajoute-le à la conversation.
        </p>
        <Button type="button" variant="outline" size="sm" asChild className="w-fit">
          <a href="https://claude.ai/new" target="_blank" rel="noreferrer noopener">
            <ExternalLink data-icon="inline-start" />
            Ouvrir claude.ai
          </a>
        </Button>
      </Step>

      <Step index={3} title="Colle ici la réponse complète">
        <Textarea
          value={response}
          onChange={(event) => onResponseChange(event.target.value)}
          rows={7}
          disabled={disabled}
          placeholder="Colle ici tout le bloc ```json renvoyé par Claude…"
          className={cn("font-mono text-xs", error && "border-destructive")}
          aria-invalid={Boolean(error)}
          aria-label="Réponse de l'assistant"
        />
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Astuce : utilise le bouton « Copier » sous la réponse de Claude pour ne rien oublier.
          </p>
        )}
      </Step>
    </ol>
  );
}
