import type { SkillCategory } from "@/generated/prisma/enums";

import { getAliasIndex, SKILL_DICTIONARY, type DictionarySkill } from "./dictionary";
import { findSpans, normalize, type Span } from "./text";

export type DetectedSkill = {
  name: string;
  category: SkillCategory;
  /** Variantes à rechercher pour savoir si le candidat la possède. */
  aliases: readonly string[];
};

type Candidate = DetectedSkill & { spans: Span[] };

function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Détecte les compétences présentes dans un texte (normalisé) : dictionnaire
 * + compétences personnalisées. Une occurrence contenue dans une occurrence
 * plus longue est ignorée (« React Native » ne compte pas aussi « React »).
 */
export function detectSkills(
  normalizedText: string,
  extraSkills: readonly { name: string; category: string }[] = [],
): DetectedSkill[] {
  const candidates: Candidate[] = [];
  const seen = new Set<string>();

  const addCandidate = (skill: DetectedSkill) => {
    const key = normalize(skill.name);
    if (seen.has(key)) return;
    seen.add(key);
    const spans = skill.aliases.flatMap((alias) =>
      findSpans(normalizedText, normalize(alias)),
    );
    if (spans.length > 0) candidates.push({ ...skill, spans });
  };

  for (const skill of SKILL_DICTIONARY) addCandidate(skill);

  const index = getAliasIndex(normalize);
  for (const extra of extraSkills) {
    const known = index.get(normalize(extra.name));
    if (known) continue; // déjà couvert par le dictionnaire
    addCandidate({
      name: extra.name,
      category: extra.category as SkillCategory,
      aliases: [extra.name],
    });
  }

  // Les occurrences les plus longues sont prioritaires.
  const allSpans = candidates
    .flatMap((candidate) =>
      candidate.spans.map((span) => ({ candidate, span, length: span.end - span.start })),
    )
    .sort((a, b) => b.length - a.length);

  const accepted: Span[] = [];
  const result = new Map<Candidate, true>();
  for (const { candidate, span } of allSpans) {
    if (accepted.some((other) => overlaps(other, span))) continue;
    accepted.push(span);
    result.set(candidate, true);
  }

  return [...result.keys()].map(({ name, category, aliases }) => ({ name, category, aliases }));
}

/**
 * Ensemble des variantes normalisées des compétences déclarées par le
 * candidat (un « JS » déclaré couvre aussi « JavaScript »).
 */
export function expandDeclaredSkills(names: readonly string[]): Set<string> {
  const index = getAliasIndex(normalize);
  const expanded = new Set<string>();
  for (const name of names) {
    const key = normalize(name);
    if (!key) continue;
    expanded.add(key);
    const known: DictionarySkill | undefined = index.get(key);
    if (known) for (const alias of known.aliases) expanded.add(normalize(alias));
    expanded.add(normalize(known?.name ?? name));
  }
  return expanded;
}

/** Catégorie d'une compétence connue du dictionnaire (« Anglais » → LANGUAGE). */
export function inferSkillCategory(name: string): SkillCategory | null {
  return getAliasIndex(normalize).get(normalize(name))?.category ?? null;
}

/** Le candidat possède-t-il la compétence (déclarée ou mentionnée dans son parcours) ? */
export function candidateHasSkill(
  skill: DetectedSkill,
  declared: ReadonlySet<string>,
  normalizedCorpus: string,
): boolean {
  const variants = [skill.name, ...skill.aliases].map(normalize);
  if (variants.some((variant) => declared.has(variant))) return true;
  // Dans le texte libre, seules les variantes non ambiguës sont recherchées
  // (le nom « Go » seul ne doit pas correspondre à « 16 Go de RAM »).
  return skill.aliases
    .map(normalize)
    .some((variant) => findSpans(normalizedCorpus, variant).length > 0);
}
