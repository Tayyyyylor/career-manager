import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";
import { routes } from "@/config/navigation";
import { getDashboardStats } from "@/features/dashboard/queries";
import { getScoreScale } from "@/features/profile/queries";
import { formatScore } from "@/lib/format";

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";

export async function DashboardStats() {
  const [stats, scale] = await Promise.all([getDashboardStats(), getScoreScale()]);

  const items = [
    {
      route: routes.skills,
      label: "Compétences",
      value: stats.skills,
      hint: "Compétences référencées",
    },
    {
      route: routes.experiences,
      label: "Expériences",
      value: stats.experiences,
      hint: `${stats.projects} projet${stats.projects > 1 ? "s" : ""} documenté${stats.projects > 1 ? "s" : ""}`,
    },
    {
      route: routes.offers,
      label: "Offres analysées",
      value: stats.offers,
      hint:
        stats.averageScore === null
          ? "Aucune analyse pour l'instant"
          : `Note moyenne : ${formatScore(stats.averageScore, scale)}`,
    },
    {
      route: routes.applications,
      label: "Candidatures en cours",
      value: stats.activeApplications,
      hint: "À envoyer, envoyées, entretiens",
    },
  ];

  return (
    <div className={GRID}>
      {items.map(({ route, label, value, hint }) => (
        <StatCard
          key={route.href}
          label={label}
          value={value}
          hint={hint}
          icon={route.icon}
          href={route.href}
        />
      ))}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className={GRID} aria-busy="true" aria-label="Chargement des statistiques">
      {Array.from({ length: 4 }, (_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>
  );
}
