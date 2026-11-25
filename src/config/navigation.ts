import type { Route } from "next";
import {
  BriefcaseBusiness,
  CircleUserRound,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  ScanSearch,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  description: string;
  href: Route;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

/** Source unique des pages de l'application (sidebar, en-têtes, métadonnées). */
export const routes = {
  dashboard: {
    title: "Tableau de bord",
    description: "Vue d'ensemble de ton parcours et de tes candidatures.",
    href: "/",
    icon: LayoutDashboard,
  },
  profile: {
    title: "Mon profil",
    description:
      "Tes informations personnelles et ta présentation professionnelle.",
    href: "/profile",
    icon: CircleUserRound,
  },
  skills: {
    title: "Mes compétences",
    description:
      "Compétences techniques, outils, méthodes, langues et savoir-être.",
    href: "/skills",
    icon: Sparkles,
  },
  experiences: {
    title: "Mes expériences",
    description: "Ton historique professionnel : postes, missions et réalisations.",
    href: "/experiences",
    icon: BriefcaseBusiness,
  },
  projects: {
    title: "Mes projets",
    description:
      "Les projets personnels et professionnels qui illustrent ton savoir-faire.",
    href: "/projects",
    icon: FolderKanban,
  },
  education: {
    title: "Mes formations",
    description: "Diplômes, certifications et formations suivies.",
    href: "/education",
    icon: GraduationCap,
  },
  offers: {
    title: "Analyse des offres",
    description:
      "Évalue la correspondance entre une offre d'emploi et ton CV.",
    href: "/offers",
    icon: ScanSearch,
  },
  resumes: {
    title: "Mes CV",
    description: "Ton CV générique et ses versions adaptées à chaque offre.",
    href: "/resumes",
    icon: FileText,
  },
  applications: {
    title: "Mes candidatures",
    description: "Suis l'avancement de chacune de tes candidatures.",
    href: "/applications",
    icon: Send,
  },
} as const satisfies Record<string, NavItem>;

export const navigation: readonly NavGroup[] = [
  { label: "Général", items: [routes.dashboard] },
  {
    label: "Mon parcours",
    items: [
      routes.profile,
      routes.skills,
      routes.experiences,
      routes.projects,
      routes.education,
    ],
  },
  {
    label: "Candidatures",
    items: [routes.offers, routes.resumes, routes.applications],
  },
];

/** Une entrée est active sur sa page et sur ses sous-pages (ex. /skills/123). */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function findNavItem(pathname: string): NavItem | undefined {
  return navigation
    .flatMap((group) => group.items)
    .find((item) => isNavItemActive(item, pathname));
}
