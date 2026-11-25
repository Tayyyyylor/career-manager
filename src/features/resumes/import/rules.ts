import { detectSkills } from "@/features/analysis/engine/skills";
import { normalize } from "@/features/analysis/engine/text";

import { clampProfile, emptyProfile, type ImportData } from "./types";

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
/** Numéros français (+33 6 12 34 56 78, 06.12.34.56.78…) puis format international. */
const PHONE_FR = /(?:\+33\s?(?:\(0\)\s?)?|0)[1-9](?:[\s.-]?\d{2}){4}/;
const PHONE_INTL = /\+\d{1,3}(?:[\s.-]?\d{1,4}){3,5}/;
const LINKEDIN = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[\w%-]+\/?/i;
const GITHUB = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/?/i;
const URL = /https?:\/\/[^\s)>\]]+/gi;

function withProtocol(url: string): string {
  const trimmed = url.replace(/[.,;]+$/, "").replace(/\/$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Une ligne qui ressemble à « Prénom NOM » (2 à 4 mots, sans chiffre ni symbole). */
function looksLikeName(line: string): boolean {
  if (line.length > 50 || /\d|@|http|curriculum|vitae|\bcv\b/i.test(line)) return false;
  const words = line.split(/\s+/);
  return (
    words.length >= 2 &&
    words.length <= 4 &&
    words.every((word) => /^[\p{Lu}][\p{L}'’-]*$/u.test(word))
  );
}

function splitName(line: string): { firstName: string; lastName: string } {
  const words = line.split(/\s+/);
  // « Jean DUPONT » : les mots en capitales forment le nom de famille.
  const upper = words.filter((word) => word.length > 1 && word === word.toUpperCase());
  if (upper.length > 0 && upper.length < words.length) {
    return {
      firstName: words.filter((word) => !upper.includes(word)).join(" "),
      lastName: upper.join(" "),
    };
  }
  return { firstName: words[0] ?? "", lastName: words.slice(1).join(" ") };
}

/** Le titre suit généralement le nom : ligne courte, sans coordonnées. */
function looksLikeHeadline(line: string): boolean {
  return (
    line.length >= 5 &&
    line.length <= 100 &&
    !EMAIL.test(line) &&
    !PHONE_FR.test(line) &&
    !/https?:\/\/|linkedin|github/i.test(line)
  );
}

/**
 * Extraction sans IA : coordonnées, liens et compétences connues.
 * Le nom et le titre sont devinés à partir des premières lignes.
 * Les expériences, projets et formations ne sont pas extraits (mise en page
 * trop variable d'un CV à l'autre).
 */
export function extractWithRules(resumeText: string): ImportData {
  const profile = emptyProfile();
  const lines = resumeText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const nameIndex = lines.slice(0, 4).findIndex(looksLikeName);
  if (nameIndex >= 0) {
    const { firstName, lastName } = splitName(lines[nameIndex] ?? "");
    profile.firstName = firstName || null;
    profile.lastName = lastName || null;
    const next = lines[nameIndex + 1];
    if (next && looksLikeHeadline(next)) {
      profile.headline = next.slice(0, 120);
    }
  }

  profile.email = resumeText.match(EMAIL)?.[0] ?? null;
  profile.phone = (resumeText.match(PHONE_FR) ?? resumeText.match(PHONE_INTL))?.[0]?.trim() ?? null;

  const linkedin = resumeText.match(LINKEDIN)?.[0];
  const github = resumeText.match(GITHUB)?.[0];
  profile.linkedinUrl = linkedin ? withProtocol(linkedin) : null;
  profile.githubUrl = github ? withProtocol(github) : null;

  const website = [...resumeText.matchAll(URL)]
    .map((match) => match[0])
    .find((url) => !/linkedin\.com|github\.com/i.test(url));
  profile.websiteUrl = website ? withProtocol(website) : null;

  const skills = detectSkills(normalize(resumeText)).map((skill) => ({
    name: skill.name,
    category: skill.category,
    level: null,
  }));

  return { profile: clampProfile(profile), skills, experiences: [], projects: [], educations: [] };
}
