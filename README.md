# Career Manager

Gestionnaire de carrière personnel, utilisable à plusieurs : chacun centralise
son parcours (profil, compétences, expériences, projets, formations, CV PDF),
analyse des offres d'emploi pour obtenir une **note de correspondance**, génère
des **CV adaptés** à chaque offre et suit ses **candidatures**.

## Fonctionnalités

| Section | Ce qu'on y fait |
| --- | --- |
| Tableau de bord | Statistiques, checklist « Bien démarrer », dernières analyses |
| Mon profil | Identité, coordonnées, liens, barème des notes (sur 100 ou sur 20), mot de passe |
| Mes compétences | Ajout unitaire ou en lot (catégorie détectée automatiquement), niveaux |
| Mes expériences / projets / formations | Parcours détaillé, réalisations, compétences mobilisées |
| Mes CV | Import du CV générique (PDF), **remplissage automatique du profil depuis le CV**, CV adaptés |
| Analyse des offres | Lien ou texte d'annonce → note, détail par critère, manques, conseils |
| Mes candidatures | Suivi par statut (à envoyer → entretien → proposition…), notes, liens |

Chaque utilisateur ne voit que ses propres données. L'inscription nécessite un
**code d'invitation**.

## Remplir son profil depuis son CV

Pas besoin de tout saisir : après l'import du PDF (ou via le bouton
**« Remplir mon profil »** d'un CV), l'application lit le CV et affiche un
aperçu de ce qu'elle a trouvé. Tu coches ce que tu veux importer ; rien n'est
enregistré sans validation, les doublons sont ignorés et une valeur qui
remplacerait une donnée existante du profil est décochée par défaut.

| Méthode | Ce qui est extrait |
| --- | --- |
| Automatique (gratuit) | Prénom, nom et titre (premières lignes), email, téléphone, liens LinkedIn / GitHub / site, compétences reconnues par le dictionnaire, déjà classées par catégorie |
| Via mon abonnement Claude (gratuit, copier-coller) | Tout le parcours, comme avec l'IA (voir ci-dessous) |
| IA (avec clé API) | Tout le parcours : profil et présentation, expériences avec dates, type de contrat et réalisations, projets, formations, compétences avec niveau |

Sans IA, les expériences, projets et formations restent à saisir : chaque CV a
sa propre mise en page et une extraction par règles serait trop approximative.
Les rubriques (profil, compétences, expériences…) servent ensuite à relire et
corriger : leurs **dates d'expérience** comptent dans la note et leur contenu
alimente les CV adaptés.

## Comment fonctionne la notation ?

Deux moteurs produisent le même format de résultat (note sur 100, convertie
selon le barème choisi, détail par critère, compétences présentes/manquantes,
points forts, points de vigilance, recommandations).

### 1. Analyse automatique (par défaut, gratuite)

Moteur de règles local (`src/features/analysis/engine/`), sans appel externe :

| Critère | Poids | Calcul |
| --- | --- | --- |
| Compétences clés | 40 % | Compétences de l'annonce présentes dans ton profil ou ton CV |
| Expérience | 20 % | Années cumulées (sans double comptage, stages à 50 %) vs années demandées |
| Mots-clés | 20 % | Termes importants de l'annonce retrouvés dans ton parcours |
| Intitulé du poste | 10 % | Recoupement avec ton titre et tes postes précédents (anglais et français équivalents : « QA Engineer » = « Ingénieur QA ») |
| Savoir-être & langues | 10 % | Qualités et langues mentionnées |

Les poids sont renormalisés quand un critère ne s'applique pas (ex. aucune durée
d'expérience exigée).

Le dictionnaire (`src/features/analysis/engine/dictionary.ts`, ~220 entrées)
est **centré sur le développement et la QA** : langages, frameworks front et
back, bases de données, cloud/DevOps, observabilité, pratiques (TDD, revue de
code, clean architecture…) et une soixantaine d'entrées QA (types de tests,
recette, plan et cas de test, gestion des anomalies, ISTQB, Selenium, Cypress,
Playwright, Postman, JMeter, Xray, Squash TM…). Les compétences que tu ajoutes
toi-même sont aussi reconnues dans les annonces. Pour couvrir un autre métier,
il suffit d'ajouter des lignes au dictionnaire.

C'est rapide, gratuit et déterministe, mais ça reste une comparaison de mots :
un synonyme non reconnu compte comme absent, et la note ne « comprend » pas
l'annonce (niveau réel attendu, exigences obligatoires vs appréciées).

### 2. Analyse par IA (optionnelle)

Avec une clé API Anthropic, l'application envoie à **Claude** ton CV PDF, ton
profil et l'annonce, et obtient une évaluation sur 5 critères (compétences,
expérience pertinente, adéquation au poste, formation, savoir-être). L'IA
comprend le sens de l'annonce, distingue l'obligatoire du « plus », et rédige
des conseils personnalisés. Elle sert aussi à rédiger les **CV adaptés**
(reformulation des réalisations), avec des garde-fous : postes, entreprises et
dates sont réinjectés depuis tes données, et seules les compétences présentes
dans ton parcours sont conservées.

> **Ce n'est pas l'assistant de code qui note les offres.** L'application
> appelle elle-même l'API Anthropic avec sa propre clé, facturée à l'usage
> (crédits prépayés) sur [console.anthropic.com](https://console.anthropic.com).
> **Un abonnement Claude (Pro, Max) ne couvre pas ces appels** : il donne accès
> à claude.ai, aux applications et à Claude Code, pas à l'API utilisée par ton
> application. Les deux se paient séparément.

#### Quel modèle choisir ?

Le modèle se règle avec `ANTHROPIC_MODEL`. Un appel (analyse, CV adapté ou
import de CV) représente environ 10 000 tokens en entrée (CV PDF + profil + annonce) et
2 000 à 4 000 en sortie. Ordres de grandeur, à vérifier dans la console :

| Modèle | Prix (entrée / sortie, par million de tokens) | Coût par appel | Pour cet usage |
| --- | --- | --- | --- |
| `claude-haiku-5-5` | 0,10 $ / 0,50 $ | < 0,01 $ | Suffisant pour une note indicative ; moins fiable pour juger la séniorité et rédiger un CV |
| `claude-sonnet-5-5` | 2 $ / 10 $ | ~0,03 à 0,08 $ | Très bon sur l'analyse comme sur la rédaction : meilleur rapport qualité/prix |
| `claude-opus-5-5` (défaut) | 4 $ / 20 $ | ~0,05 à 0,15 $ | Le plus fin, et le plus rigoureux sur la consigne « n'invente rien » |

Exemple : 5 personnes × (20 analyses + 10 CV adaptés) par mois ≈ 150 appels,
soit environ 15 $ avec Opus, 7 $ avec Sonnet, moins de 1 $ avec Haiku.

#### Limites et garde-fous

- **Aucune limite d'appels par défaut.** `AI_DAILY_LIMIT` permet d'en fixer une
  par utilisateur et par jour si besoin. Les appels de tes amis sont facturés
  sur ta clé : **fixe une limite de dépense mensuelle** dans les
  paramètres de la console Anthropic : c'est le garde-fou le plus simple.
- Chaque appel est journalisé (table `AiRequest` : utilisateur, modèle, tokens).
- Si un appel IA échoue (clé invalide, crédits épuisés, réseau…), l'application
  bascule automatiquement sur l'analyse automatique et le signale.
- Avec Opus et Sonnet, le repli côté serveur d'Anthropic est activé : si le
  modèle refuse une demande, un autre modèle la reprend dans le même appel.

Sans clé, l'option IA est simplement grisée et tout le reste fonctionne.

### 3. Via ton abonnement Claude (copier-coller, gratuit)

Sans clé API, les trois usages de l'IA restent disponibles **manuellement**,
avec ton abonnement claude.ai (un compte gratuit suffit, ChatGPT marche aussi) :

1. Choisis **« Via mon abonnement Claude »** : à l'import d'un CV, dans le
   formulaire d'analyse d'une offre, ou sur la page d'une offre (CV adapté,
   nouvelle analyse).
2. **« Préparer et copier la demande »** : l'application copie un texte qui
   contient les consignes, tes données (CV, profil, annonce) et le format JSON
   attendu.
3. Colle-le dans une nouvelle conversation sur claude.ai, puis copie la réponse
   (bouton « Copier » sous la réponse de Claude).
4. Colle la réponse dans l'application : elle est validée avec le même schéma
   que le mode API, puis affichée comme une analyse IA (« via abonnement »).

Les mêmes garde-fous s'appliquent : pour un CV adapté, postes, entreprises et
dates sont repris de tes données et les compétences absentes de ton parcours
sont retirées ; pour un import, tu valides l'aperçu avant tout enregistrement.
Si la réponse collée est incomplète ou mal formée, l'application le signale.

Depuis le formulaire d'analyse, ce mode calcule d'abord la note automatique,
puis ouvre directement la fenêtre de copier-coller sur la page de l'offre.

## Démarrage en local

Prérequis : **Node.js 24** (fichier `.node-version`, pris en charge par fnm,
nvm ou volta), pnpm, PostgreSQL.

```bash
pnpm install                 # dépendances + génération du client Prisma
cp .env.example .env         # puis compléter (voir ci-dessous)
createdb career_manager      # si la base n'existe pas
pnpm db:migrate              # applique les migrations
pnpm dev                     # http://localhost:3000
```

Variables principales (`.env.example` détaille tout) :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL |
| `DIRECT_URL` | Optionnel : connexion directe pour les migrations (Neon) |
| `BETTER_AUTH_SECRET` | Secret des sessions — `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | URL publique (`http://localhost:3000` en local) |
| `INVITE_CODE` | Code à donner aux personnes autorisées à s'inscrire |
| `ANTHROPIC_API_KEY` | Optionnel : active l'analyse et les CV par IA |
| `ANTHROPIC_MODEL` | Optionnel : modèle Claude (défaut `claude-opus-5-5`) |
| `AI_DAILY_LIMIT` | Optionnel : appels IA par utilisateur et par jour (vide = illimité) |

## Mettre l'outil en ligne pour tes amis

L'application doit tourner sur un serveur accessible depuis Internet. La
solution la plus simple (et gratuite pour un petit groupe) : **Vercel**
(hébergement) + **Neon** (PostgreSQL).

1. **Base de données** — crée un projet sur [neon.tech](https://neon.tech).
   Récupère deux URL : la *pooled* (contient `-pooler`) → `DATABASE_URL`, et la
   *direct* → `DIRECT_URL`.
2. **Code** — pousse le dépôt sur GitHub (privé de préférence).
3. **Vercel** — sur [vercel.com](https://vercel.com), importe le dépôt. Le
   framework Next.js et Node 24 sont détectés automatiquement ; le script
   `vercel-build` applique les migrations puis construit l'application.
4. **Variables d'environnement** (Vercel → Settings → Environment Variables) :
   `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET` (un nouveau secret),
   `INVITE_CODE`, et si tu veux l'IA `ANTHROPIC_API_KEY`. `BETTER_AUTH_URL` est
   facultatif sur Vercel (l'URL de production est détectée) ; renseigne-le si tu
   utilises un nom de domaine personnalisé.
5. **Déploie**, ouvre l'URL, crée ton compte avec le code d'invitation, puis
   envoie à tes amis le lien et le code.

Les CV PDF sont stockés dans la base (4 Mo max par fichier) : aucun service de
stockage supplémentaire n'est nécessaire. Les analyses IA peuvent prendre une
trentaine de secondes ; les pages concernées autorisent 60 s d'exécution.

### Gérer les comptes

- **Inviter** : donne le lien et la valeur de `INVITE_CODE`. Change le code
  (puis redéploie) pour fermer les inscriptions ; vide = inscriptions fermées.
- **Mot de passe oublié** (pas d'envoi d'email) : depuis ton poste, avec
  `DATABASE_URL` pointant vers la base de production :
  ```bash
  pnpm user:reset-password ami@exemple.fr nouveau-mot-de-passe
  ```
  La personne pourra ensuite le changer depuis « Mon profil ».

## Scripts

| Commande | Rôle |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Développement, build, production |
| `pnpm lint` / `pnpm typecheck` | Qualité du code |
| `pnpm test` | Tests unitaires du moteur d'analyse (Vitest) |
| `pnpm db:migrate` | Crée et applique une migration (développement) |
| `pnpm db:deploy` | Applique les migrations (production) |
| `pnpm db:studio` | Explorer la base (Prisma Studio) |
| `pnpm user:reset-password` | Réinitialise le mot de passe d'un compte |

## Architecture

```
prisma/schema.prisma        Modèle de données (utilisateurs, parcours, offres, CV…)
prisma.config.ts            Configuration de la CLI Prisma
scripts/                    Scripts d'administration
src/
  proxy.ts                  Redirection vers /login sans session
  app/
    (auth)/                 Connexion, inscription
    (dashboard)/            Pages de l'application (sidebar + en-tête)
    api/auth/[...all]/      Endpoints Better Auth
    api/resumes/[id]/file/  Téléchargement sécurisé des PDF
  components/
    ui/                     Composants shadcn/ui
    forms/                  Champs de formulaire réutilisables, dialogue de formulaire
    layout/ shared/ theme/  Mise en page, composants communs, thème
  config/                   Navigation, nom de l'application
  features/<domaine>/       Code métier par domaine :
    schemas.ts                validation Zod (partagée client / serveur)
    queries.ts                lectures en base (server-only, filtrées par utilisateur)
    actions.ts                Server Actions (mutations, revalidation de la session)
    components/               interface du domaine
  features/analysis/
    engine/                   moteur de notation par règles (+ tests)
    ai-analysis.ts            analyse par Claude
  lib/                      auth, db, env, ai, formatage, validation
```

### Conventions

- **Server Components par défaut** ; `"use client"` uniquement pour l'interactivité.
- **Sécurité** : chaque requête et chaque Server Action revérifie la session
  (`requireUser`) et filtre par `userId`. Le proxy ne fait qu'une redirection
  optimiste.
- **Cache Components** : tout composant qui lit la session ou la base est rendu
  dans un `<Suspense>` avec un squelette ; la coquille des pages reste statique.
- **Formulaires** : React Hook Form + Zod côté client, même schéma revalidé
  dans la Server Action, erreurs de champ renvoyées via `ActionResult`.
- **Navigation** : toute nouvelle page est déclarée dans `src/config/navigation.ts`.

## Limites connues

- Certains sites d'emploi (LinkedIn connecté, Indeed…) bloquent la lecture
  automatique : il faut alors coller le texte de l'annonce.
- Un CV PDF « scanné » (image) ne contient pas de texte extractible ; l'analyse
  IA le lit quand même, pas le moteur de règles.
- Les CV adaptés se modifient en régénérant (pas d'édition en ligne) et
  s'exportent en PDF via l'impression du navigateur.
