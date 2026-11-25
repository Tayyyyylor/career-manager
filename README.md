# Career Manager

Gestionnaire de carrière personnel : centraliser compétences, expériences,
projets et formations, analyser des offres d'emploi et produire des CV adaptés
à partir d'un CV générique.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Cache Components, Turbopack)
- TypeScript (mode strict renforcé)
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (Radix, style *nova*)
- PostgreSQL + [Prisma 7](https://www.prisma.io) (adaptateur `@prisma/adapter-pg`)

## Démarrage

Prérequis : Node.js ≥ 20.19, pnpm, PostgreSQL.

```bash
pnpm install                 # installe les dépendances et génère le client Prisma
cp .env.example .env         # puis renseigner DATABASE_URL
createdb career_manager      # si la base n'existe pas encore
pnpm db:migrate              # applique les migrations
pnpm dev                     # http://localhost:3000
```

## Scripts

| Commande           | Rôle                                                  |
| ------------------ | ----------------------------------------------------- |
| `pnpm dev`         | Serveur de développement                              |
| `pnpm build`       | Build de production                                   |
| `pnpm start`       | Serveur de production                                 |
| `pnpm lint`        | ESLint                                                |
| `pnpm typecheck`   | Génère les types de routes puis lance `tsc --noEmit`  |
| `pnpm db:migrate`  | Crée et applique une migration (développement)        |
| `pnpm db:deploy`   | Applique les migrations existantes (production)       |
| `pnpm db:generate` | Régénère le client Prisma                             |
| `pnpm db:studio`   | Ouvre Prisma Studio                                   |
| `pnpm db:reset`    | Réinitialise la base (⚠️ supprime les données)        |

## Architecture

```
prisma/
  schema.prisma          Modèle de données
  migrations/            Migrations SQL versionnées
prisma.config.ts         Configuration de la CLI Prisma (lit .env)
src/
  app/
    layout.tsx           Layout racine : polices, thème, providers
    not-found.tsx
    (dashboard)/         Pages de l'application (sidebar + en-tête)
      layout.tsx
      page.tsx           Tableau de bord (/)
      profile/ skills/ experiences/ projects/
      offers/ resumes/ applications/
      error.tsx          Erreur au niveau des pages
  components/
    ui/                  Composants shadcn/ui (générés, modifiables)
    layout/              Sidebar, en-tête, fil d'Ariane
    shared/              Composants réutilisables (PageHeader, StatCard, EmptyState)
    theme/               Provider et sélecteur de thème
  config/
    navigation.ts        Source unique des pages (titres, icônes, routes)
    site.ts
  features/
    <domaine>/           Code métier par domaine
      components/        Composants propres au domaine
      queries.ts         Lectures en base (server-only)
  generated/prisma/      Client Prisma généré (non versionné)
  hooks/
  lib/
    db.ts                Client Prisma (singleton, server-only)
    env.ts               Variables d'environnement validées
    theme.ts             Constantes et script anti-flash du thème
    utils.ts
```

### Conventions

- **Server Components par défaut** ; `"use client"` uniquement pour l'interactivité.
- **Accès aux données** uniquement dans `features/*/queries.ts` (et plus tard
  `actions.ts` pour les mutations), protégés par `server-only`.
- **Cache Components** est activé : un composant qui lit la base appelle
  `await connection()` et est rendu dans un `<Suspense>` avec un squelette.
- **Navigation** : toute nouvelle page est déclarée dans `src/config/navigation.ts`.
- **Composants shadcn** : `pnpm dlx shadcn@latest add <composant>`.
- Le thème (clair / sombre / système) est appliqué par un script inline avant le
  premier rendu, sans dépendance externe.
