import { connection } from "next/server";

import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";
import { routes } from "@/config/navigation";
import { getDashboardStats } from "@/features/dashboard/queries";

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";

export async function DashboardStats() {
  // Données lues à chaque requête, jamais pendant le build.
  await connection();
  const stats = await getDashboardStats();

  const items = [
    { route: routes.skills, label: "Compétences", value: stats.skills, hint: "Compétences référencées" },
    { route: routes.experiences, label: "Expériences", value: stats.experiences, hint: "Postes et missions renseignés" },
    { route: routes.projects, label: "Projets", value: stats.projects, hint: "Réalisations documentées" },
    { route: routes.applications, label: "Candidatures", value: stats.applications, hint: "Candidatures suivies" },
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
