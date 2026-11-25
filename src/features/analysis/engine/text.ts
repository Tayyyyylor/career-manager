/**
 * Normalisation de texte pour la recherche de termes :
 * minuscules, sans accents, ponctuation réduite à des espaces, en conservant
 * les caractères utiles aux noms techniques (c++, c#, node.js).
 */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, " ")
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const patternCache = new Map<string, RegExp>();

/** Expression régulière d'un terme normalisé, délimité par des non-alphanumériques. */
export function termPattern(normalizedTerm: string): RegExp {
  let pattern = patternCache.get(normalizedTerm);
  if (!pattern) {
    pattern = new RegExp(
      `(?<![a-z0-9+#])${escapeRegExp(normalizedTerm)}(?![a-z0-9+#])`,
      "g",
    );
    patternCache.set(normalizedTerm, pattern);
  }
  pattern.lastIndex = 0;
  return pattern;
}

/** Le texte (déjà normalisé) contient-il le terme comme mot entier ? */
export function containsTerm(normalizedText: string, term: string): boolean {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  return termPattern(normalizedTerm).test(normalizedText);
}

export type Span = { start: number; end: number };

/** Toutes les occurrences d'un terme normalisé dans un texte normalisé. */
export function findSpans(normalizedText: string, normalizedTerm: string): Span[] {
  if (!normalizedTerm) return [];
  const spans: Span[] = [];
  const pattern = termPattern(normalizedTerm);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(normalizedText)) !== null) {
    spans.push({ start: match.index, end: match.index + match[0].length });
  }
  return spans;
}

// ─── Mots vides & racines ────────────────────────────────────────────────────

const STOPWORDS = new Set(
  `a au aux avec ce ces cet cette dans de des du elle en et etre eux il ils je la le les leur leurs lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous c d j l m n s t y ete etes etait sont sera seront avoir avez avons ont aura fait faire peut peuvent doit doivent tres plus moins bien tout tous toute toutes autre autres ainsi alors aussi donc car comme chez entre sans sous vers selon dont afin lors chaque celle celui ceux cela ca ici the and or of to in for with on at by from as is are be an this that will you your our we they their it its can may must have has who what which about into over within across per via etc
  poste postes profil profils mission missions entreprise entreprises equipe equipes candidat candidate candidats candidature offre offres emploi recherche recherchons rejoindre rejoignez rejoins nous votre vos travail travailler travaillerez ans annee annees experience experiences minimum maximum niveau capacite capable sein cadre type contrat cdi cdd temps plein partiel date debut salaire remuneration avantages lieu localisation description descriptif job role team company work working years year experience skills skill required requirements responsibilities responsibility position opportunity looking join environnement environment client clients projet projets activite activites service services societe groupe secteur domaine connaissance connaissances competence competences maitrise maitriser souhaite souhaitee souhaitees appreciee apprecie appreciees idealement serait atout plus+ vous+ mois semaine jours jour heures
  nouveau nouvelle nouvelles nouveaux dynamique dynamiques passion passionne passionnee motive motivee motivation sens forte fort fortes forts bonne bon bonnes bons grande grand grandes grands egalement notamment ensemble plusieurs differents differentes divers diverses quotidien quotidienne afin permettant permet assurer assurez participer participez contribuer accompagner rattache rattachee sein
  stack technique techniques technologie technologies technical outil outils solution solutions produit produits fonctionnalite fonctionnalites code feature features usage utilisation
  paris lyon marseille toulouse bordeaux lille nantes nice rennes strasbourg montpellier grenoble france teletravail remote hybride presentiel site locaux bureaux`
    .split(/\s+/)
    .filter(Boolean),
);

export function isStopword(token: string): boolean {
  return STOPWORDS.has(token);
}

/** Racine très simple (pluriels et quelques suffixes) pour comparer des mots. */
export function stem(token: string): string {
  if (token.length <= 4) return token;
  return token
    .replace(/(ements|ement|ations|ation|ements|ments|ment)$/, "")
    .replace(/(eurs|euse|euses|eur)$/, "eur")
    .replace(/(s|x)$/, "")
    .replace(/e$/, "");
}

/** Sigles courts significatifs dans les métiers du dev et de la QA. */
const SHORT_TOKENS = new Set(["qa", "qe", "ux", "ui", "js", "ts", "go", "c#", "c++", "k6", "po", "pm", "ia", "ai", "ml"]);

/** Jetons significatifs d'un texte normalisé. */
export function tokenize(normalizedText: string): string[] {
  return normalizedText
    .split(" ")
    .map((token) => token.replace(/^[.]+|[.]+$/g, ""))
    .filter(
      (token) =>
        (token.length >= 3 || SHORT_TOKENS.has(token)) &&
        !/^\d+$/.test(token) &&
        !STOPWORDS.has(token),
    );
}

/** Équivalences anglais / français et variantes des intitulés de poste. */
const SYNONYMS: Record<string, string> = {
  engineer: "ingenieur",
  engineers: "ingenieur",
  ingenieure: "ingenieur",
  developer: "developpeur",
  developers: "developpeur",
  developpeuse: "developpeur",
  dev: "developpeur",
  development: "developpement",
  tester: "testeur",
  testeuse: "testeur",
  testing: "test",
  tests: "test",
  automation: "automatisation",
  automatise: "automatisation",
  automatises: "automatisation",
  software: "logiciel",
  logiciels: "logiciel",
  quality: "qualite",
  frontend: "front",
  backend: "back",
  fullstack: "full",
  analyst: "analyste",
  architect: "architecte",
};

/** Forme canonique d'un jeton pour comparer deux textes (synonymes + racine). */
export function canonicalToken(token: string): string {
  return stem(SYNONYMS[token] ?? token);
}
