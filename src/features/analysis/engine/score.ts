import type {
  AnalysisResult,
  CandidateProfile,
  Criterion,
  OfferInput,
} from "@/features/analysis/types";

import { computeCandidateYears, extractRequiredYears } from "./experience";
import {
  candidateHasSkill,
  detectSkills,
  expandDeclaredSkills,
  type DetectedSkill,
} from "./skills";
import { canonicalToken, normalize, tokenize } from "./text";

/** Poids des critères (normalisés sur les critères applicables). */
export const WEIGHTS = {
  hardSkills: 0.4,
  softSkills: 0.1,
  experience: 0.2,
  title: 0.1,
  keywords: 0.2,
} as const;

const SOFT_CATEGORIES = new Set(["SOFT", "LANGUAGE", "OTHER"]);
const MAX_KEYWORDS = 20;

function ratio(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function list(items: readonly string[], max = 6): string {
  const shown = items.slice(0, max).join(", ");
  return items.length > max ? `${shown}… (+${items.length - max})` : shown;
}

/** Tout le texte décrivant le parcours du candidat, normalisé. */
function buildCorpus(candidate: CandidateProfile): string {
  return normalize(
    [
      candidate.headline,
      candidate.summary,
      candidate.resumeText,
      ...candidate.skills.map((skill) => skill.name),
      ...candidate.experiences.flatMap((experience) => [
        experience.position,
        experience.description,
        ...experience.achievements,
        ...experience.skills,
      ]),
      ...candidate.projects.flatMap((project) => [
        project.name,
        project.role,
        project.description,
        ...project.skills,
      ]),
      ...candidate.educations.flatMap((education) => [
        education.degree,
        education.fieldOfStudy,
        education.description,
      ]),
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

/** Forme d'origine (avec accents) de chaque mot normalisé du texte. */
function displayForms(text: string): Map<string, string> {
  const forms = new Map<string, string>();
  for (const word of text.split(/[^\p{L}\p{N}+#.]+/u)) {
    const key = normalize(word);
    if (key && !key.includes(" ") && !forms.has(key)) forms.set(key, word.toLowerCase());
  }
  return forms;
}

/** Mots-clés significatifs de l'annonce, hors compétences déjà détectées. */
function extractKeywords(offerText: string, skillTerms: ReadonlySet<string>): string[] {
  const forms = displayForms(offerText);
  const counts = new Map<string, { word: string; count: number }>();
  for (const token of tokenize(normalize(offerText))) {
    if (token.length < 4 || skillTerms.has(token)) continue;
    const key = canonicalToken(token);
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { word: forms.get(token) ?? token, count: 1 });
  }

  const ranked = [...counts.values()].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
  const repeated = ranked.filter((entry) => entry.count >= 2);
  return (repeated.length >= 8 ? repeated : ranked).slice(0, MAX_KEYWORDS).map((entry) => entry.word);
}

/**
 * Analyse déterministe d'une offre au regard du profil du candidat.
 * Aucune donnée n'est envoyée à l'extérieur.
 */
export function analyzeOffer(
  offer: OfferInput,
  candidate: CandidateProfile,
  now = new Date(),
): AnalysisResult {
  const offerText = normalize(`${offer.title}\n${offer.description}`);
  const corpus = buildCorpus(candidate);
  const declared = expandDeclaredSkills(candidate.skills.map((skill) => skill.name));

  // ─── Compétences ──────────────────────────────────────────────────────────
  const required = detectSkills(offerText, candidate.skills);
  const has = (skill: DetectedSkill) => candidateHasSkill(skill, declared, corpus);

  const hard = required.filter((skill) => !SOFT_CATEGORIES.has(skill.category));
  const soft = required.filter((skill) => SOFT_CATEGORIES.has(skill.category));
  const hardMatched = hard.filter(has).map((skill) => skill.name);
  const hardMissing = hard.filter((skill) => !has(skill)).map((skill) => skill.name);
  const softMatched = soft.filter(has).map((skill) => skill.name);
  const softMissing = soft.filter((skill) => !has(skill)).map((skill) => skill.name);

  // ─── Expérience ───────────────────────────────────────────────────────────
  const requiredYears = extractRequiredYears(`${offer.title}\n${offer.description}`);
  const candidateYears =
    candidate.experiences.length > 0 ? computeCandidateYears(candidate.experiences, now) : 0;

  // ─── Intitulé du poste ────────────────────────────────────────────────────
  const titleTokens = [...new Set(tokenize(normalize(offer.title)).map(canonicalToken))];
  const roleCorpus = new Set(
    tokenize(
      normalize(
        [candidate.headline, ...candidate.experiences.map((experience) => experience.position)]
          .filter(Boolean)
          .join(" "),
      ),
    ).map(canonicalToken),
  );
  const titleMatched = titleTokens.filter((token) => roleCorpus.has(token));

  // ─── Mots-clés ────────────────────────────────────────────────────────────
  const skillTerms = new Set(
    required.flatMap((skill) => [skill.name, ...skill.aliases]).flatMap((term) => normalize(term).split(" ")),
  );
  const keywords = extractKeywords(offer.description, skillTerms);
  const corpusStems = new Set(tokenize(corpus).map(canonicalToken));
  const inCorpus = (word: string) => corpusStems.has(canonicalToken(normalize(word)));
  const keywordsFound = keywords.filter(inCorpus);
  const keywordsMissing = keywords.filter((word) => !inCorpus(word));

  // ─── Critères ─────────────────────────────────────────────────────────────
  const criteria: Criterion[] = [];

  if (hard.length > 0) {
    criteria.push({
      key: "hard_skills",
      label: "Compétences clés",
      score: ratio(hardMatched.length, hard.length),
      weight: WEIGHTS.hardSkills,
      comment: `${hardMatched.length} sur ${hard.length} compétences techniques ou métier demandées.`,
    });
  }

  if (soft.length > 0) {
    criteria.push({
      key: "soft_skills",
      label: "Savoir-être & langues",
      score: ratio(softMatched.length, soft.length),
      weight: WEIGHTS.softSkills,
      comment: `${softMatched.length} sur ${soft.length} qualités ou langues mentionnées.`,
    });
  }

  if (requiredYears !== null) {
    const score =
      requiredYears === 0 ? 100 : Math.min(100, Math.round((candidateYears / requiredYears) * 100));
    criteria.push({
      key: "experience",
      label: "Expérience",
      score,
      weight: WEIGHTS.experience,
      comment:
        requiredYears === 0
          ? "Poste ouvert aux profils débutants."
          : `${candidateYears.toLocaleString("fr-FR")} an(s) d'expérience pour ${requiredYears} demandé(s).`,
    });
  }

  if (titleTokens.length > 0) {
    criteria.push({
      key: "title",
      label: "Intitulé du poste",
      score: ratio(titleMatched.length, titleTokens.length),
      weight: WEIGHTS.title,
      comment:
        titleMatched.length > 0
          ? "Ton titre ou tes postes précédents recoupent l'intitulé de l'offre."
          : "Aucun de tes postes ne reprend l'intitulé de l'offre.",
    });
  }

  if (keywords.length > 0) {
    criteria.push({
      key: "keywords",
      label: "Mots-clés de l'annonce",
      score: ratio(keywordsFound.length, keywords.length),
      weight: WEIGHTS.keywords,
      comment: `${keywordsFound.length} sur ${keywords.length} termes importants de l'annonce présents dans ton parcours.`,
    });
  }

  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  const score =
    totalWeight === 0
      ? 0
      : Math.round(
          criteria.reduce((sum, criterion) => sum + criterion.score * criterion.weight, 0) / totalWeight,
        );

  // ─── Explications ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  const gaps: string[] = [];
  const recommendations: string[] = [];

  if (hardMatched.length > 0) {
    strengths.push(`Compétences demandées que tu possèdes : ${list(hardMatched)}.`);
  }
  if (softMatched.length > 0) {
    strengths.push(`Qualités et langues en phase avec l'annonce : ${list(softMatched)}.`);
  }
  if (requiredYears !== null && requiredYears > 0 && candidateYears >= requiredYears) {
    strengths.push(`Ton expérience (${candidateYears.toLocaleString("fr-FR")} an(s)) couvre les ${requiredYears} an(s) demandés.`);
  }
  if (titleMatched.length > 0 && titleTokens.length > 0) {
    strengths.push("Ton parcours correspond à l'intitulé du poste.");
  }

  if (hardMissing.length > 0) {
    gaps.push(`Compétences demandées absentes de ton profil : ${list(hardMissing)}.`);
    recommendations.push(
      `Si tu maîtrises ${list(hardMissing, 3)}, ajoute-les à « Mes compétences » et illustre-les dans une expérience ou un projet.`,
    );
  }
  if (softMissing.length > 0) {
    gaps.push(`Qualités ou langues non mentionnées : ${list(softMissing)}.`);
  }
  if (requiredYears !== null && requiredYears > 0 && candidateYears < requiredYears) {
    gaps.push(
      `L'annonce demande ${requiredYears} an(s) d'expérience, ton profil en compte ${candidateYears.toLocaleString("fr-FR")}.`,
    );
    recommendations.push(
      "Mets en avant tes projets, missions et responsabilités pour compenser l'écart d'expérience.",
    );
  }
  if (keywordsMissing.length > 0) {
    gaps.push(`Termes de l'annonce absents de ton parcours : ${list(keywordsMissing, 8)}.`);
    recommendations.push(
      `Reprends le vocabulaire de l'annonce (${list(keywordsMissing, 4)}) dans ton CV lorsque c'est pertinent.`,
    );
  }
  if (!candidate.resumeText) {
    recommendations.push("Importe ton CV générique (PDF) pour une analyse plus précise.");
  }
  if (candidate.skills.length < 5) {
    recommendations.push("Complète « Mes compétences » : l'analyse s'appuie en priorité dessus.");
  }
  if (candidate.experiences.length === 0) {
    recommendations.push("Renseigne tes expériences pour que l'ancienneté soit prise en compte.");
  }

  const summary =
    criteria.length === 0
      ? "L'annonce est trop courte pour être analysée : colle sa description complète."
      : [
          hard.length > 0 ? `${hardMatched.length}/${hard.length} compétences clés` : null,
          requiredYears !== null && requiredYears > 0
            ? `${candidateYears.toLocaleString("fr-FR")}/${requiredYears} an(s) d'expérience`
            : null,
          keywords.length > 0 ? `${keywordsFound.length}/${keywords.length} mots-clés` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return {
    score,
    details: {
      summary,
      criteria,
      matchedSkills: [...hardMatched, ...softMatched],
      missingSkills: [...hardMissing, ...softMissing],
      strengths,
      gaps,
      recommendations,
      keywords: keywords.length > 0 ? { found: keywordsFound, missing: keywordsMissing } : null,
      experience: { requiredYears, candidateYears },
    },
  };
}
