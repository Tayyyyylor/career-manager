import { ApplicationStatus } from "@/generated/prisma/enums";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  TO_APPLY: "À envoyer",
  APPLIED: "Envoyée",
  INTERVIEW: "Entretien",
  OFFER: "Proposition",
  REJECTED: "Refusée",
  WITHDRAWN: "Abandonnée",
};

export const APPLICATION_STATUSES = Object.values(ApplicationStatus);

export const applicationStatusOptions = APPLICATION_STATUSES.map((value) => ({
  value,
  label: APPLICATION_STATUS_LABELS[value],
}));

/** Classes de couleur (pastille) par statut. */
export const APPLICATION_STATUS_STYLES: Record<ApplicationStatus, string> = {
  TO_APPLY: "bg-muted text-muted-foreground ring-border",
  APPLIED: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  INTERVIEW: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
  OFFER: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  REJECTED: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300",
  WITHDRAWN: "bg-neutral-500/10 text-neutral-600 ring-neutral-500/20 dark:text-neutral-400",
};

/** Statuts « en cours » (pipeline actif). */
export const ACTIVE_STATUSES: readonly ApplicationStatus[] = ["TO_APPLY", "APPLIED", "INTERVIEW", "OFFER"];
