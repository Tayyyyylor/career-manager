import "server-only";

import { z } from "zod";

import type { CandidateData } from "@/features/analysis/candidate";
import { detectSkills } from "@/features/analysis/engine/skills";
import { containsTerm, normalize } from "@/features/analysis/engine/text";
import { buildUserContent, describeAnalysis } from "@/features/analysis/prompt-context";
import type { AnalysisDetails } from "@/features/analysis/types";
import type { TailoredResumeContent } from "@/features/resumes/tailored";
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS } from "@/features/skills/constants";
import type { SkillCategory } from "@/generated/prisma/enums";
import { generateStructured } from "@/lib/ai";
import { formatPeriod } from "@/lib/format";

type Offer = { title: string; company: string | null; location: string | null; description: string };

const MAX_EXPERIENCES = 6;
const MAX_BULLETS = 6;
const MAX_PROJECTS = 3;
const MAX_SKILLS_PER_GROUP = 12;

/** Termes de l'offre utilisés pour classer les éléments par pertinence. */
function offerTerms(offer: Offer): string[] {
  return detectSkills(normalize(`${offer.title}\n${offer.description}`)).flatMap((skill) => [
    skill.name,
    ...skill.aliases,
  ]);
}

function relevance(text: string, terms: readonly string[]): number {
  const normalized = normalize(text);
  return terms.reduce((count, term) => count + (containsTerm(normalized, term) ? 1 : 0), 0);
}

function adviceFromAnalysis(details: AnalysisDetails | null): string[] {
  const advice = [
    "Relis chaque section et ajuste les formulations : ce CV est un point de départ.",
  ];
  if (details && details.missingSkills.length > 0) {
    advice.push(
      `L'offre mentionne ${details.missingSkills.slice(0, 5).join(", ")} : ajoute-les seulement si tu les maîtrises réellement.`,
    );
  }
  return advice;
}

// ─── Génération par règles ───────────────────────────────────────────────────

/** CV adapté sans IA : sélection et tri des éléments du profil selon l'offre. */
export function tailorWithRules(
  data: CandidateData,
  offer: Offer,
  analysis: AnalysisDetails | null,
): TailoredResumeContent {
  const terms = offerTerms(offer);
  const { raw, profile } = data;

  const skillGroups = SKILL_CATEGORIES.map((category) => {
    const items = raw.skills
      .filter((skill) => skill.category === category)
      .map((skill) => ({ name: skill.name, score: relevance(skill.name, terms) }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, MAX_SKILLS_PER_GROUP)
      .map((skill) => skill.name);
    return { label: SKILL_CATEGORY_LABELS[category as SkillCategory], items };
  }).filter((group) => group.items.length > 0);

  let reordered = 0;
  const experiences = raw.experiences.slice(0, MAX_EXPERIENCES).map((experience) => {
    const ranked = [...experience.achievements]
      .map((text, index) => ({ text, index, score: relevance(text, terms) }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    if (ranked.some((bullet, position) => bullet.index !== position)) reordered += 1;
    const bullets = ranked.slice(0, MAX_BULLETS).map((bullet) => bullet.text);
    return {
      position: experience.position,
      company: experience.company,
      location: experience.location,
      period: formatPeriod(experience.startDate, experience.endDate),
      bullets: bullets.length > 0 ? bullets : experience.description ? [experience.description] : [],
    };
  });

  const projects = raw.projects
    .map((project, index) => ({
      project,
      index,
      score: relevance(
        [project.name, project.description, ...project.skills.map((skill) => skill.name)].join(" "),
        terms,
      ),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, MAX_PROJECTS)
    .map(({ project }) => ({
      name: project.name,
      role: project.role,
      description: project.description ?? "",
      technologies: project.skills.map((skill) => skill.name),
    }));

  const education = raw.educations.slice(0, 4).map((item) => ({
    degree: item.fieldOfStudy ? `${item.degree} — ${item.fieldOfStudy}` : item.degree,
    institution: item.institution,
    period: formatPeriod(item.startDate, item.endDate) || null,
    details: item.description,
  }));

  // Ce qui a réellement été fait, pour l'encart « Ce qui a été adapté ».
  const highlighted = raw.skills.filter((skill) => relevance(skill.name, terms) > 0).map((skill) => skill.name);
  const changes = [
    highlighted.length > 0
      ? `Compétences demandées par l'offre placées en tête : ${highlighted.slice(0, 8).join(", ")}.`
      : "Aucune de tes compétences ne correspond directement aux exigences de l'offre.",
    reordered > 0
      ? `Réalisations réordonnées pour mettre en avant celles qui répondent à l'offre (${reordered} expérience${reordered > 1 ? "s" : ""}).`
      : null,
    projects.length > 0 && raw.projects.length > projects.length
      ? `Projets retenus pour leur lien avec l'offre : ${projects.map((project) => project.name).join(", ")}.`
      : null,
  ].filter((item): item is string => item !== null);

  const advice = adviceFromAnalysis(analysis);
  advice.push(
    "La génération automatique trie et sélectionne sans réécrire : pour une accroche et des réalisations reformulées pour l'offre, utilise « Via mon abonnement ».",
  );
  if (raw.experiences.length === 0) {
    advice.unshift(
      "Ton profil ne contient aucune expérience : renseigne « Mes expériences » ou utilise la génération par IA, qui s'appuie aussi sur ton CV PDF.",
    );
  }

  return {
    headline: profile?.headline ?? "",
    summary: profile?.summary ?? "",
    skillGroups,
    experiences,
    projects,
    education,
    advice,
    changes,
  };
}

// ─── Génération par IA ───────────────────────────────────────────────────────

export const aiTailorSchema = z.object({
  headline: z.string().describe("Titre professionnel ciblé, fidèle au parcours réel."),
  summary: z.string().describe("Accroche de 3 à 4 phrases orientée vers l'offre."),
  skillGroups: z
    .array(z.object({ label: z.string(), items: z.array(z.string()) }))
    .describe("Compétences du candidat regroupées, les plus pertinentes pour l'offre en premier."),
  experiences: z.array(
    z.object({
      ref: z
        .string()
        .nullable()
        .describe("Identifiant [exp-N] du profil, ou null si l'expérience provient uniquement du CV PDF."),
      position: z.string(),
      company: z.string(),
      location: z.string().nullable(),
      period: z.string(),
      bullets: z
        .array(z.string())
        .describe("3 à 5 réalisations réécrites pour l'offre si l'expérience est pertinente, 1 ou 2 sinon."),
    }),
  ),
  projects: z.array(
    z.object({
      ref: z.string().nullable().describe("Identifiant [proj-N], ou null si issu du CV PDF."),
      name: z.string(),
      role: z.string().nullable(),
      description: z.string(),
      technologies: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      ref: z.string().nullable().describe("Identifiant [edu-N], ou null si issu du CV PDF."),
      degree: z.string(),
      institution: z.string(),
      period: z.string().nullable(),
      details: z.string().nullable(),
    }),
  ),
  advice: z.array(z.string()).describe("2 à 4 conseils pour finaliser ce CV."),
  changes: z
    .array(z.string())
    .describe("4 à 8 modifications concrètes apportées par rapport au CV d'origine."),
});

export const TAILOR_SYSTEM_PROMPT = `Tu es une experte en recrutement tech et en rédaction de CV. Tu transformes le CV générique d'un candidat en un CV ciblé pour une offre précise. Le résultat doit être visiblement adapté à l'offre — un recruteur doit y retrouver en quelques secondes ce qu'il cherche — tout en restant strictement fidèle au parcours réel.

Méthode :
1. Analyse l'offre : poste visé, 5 à 8 exigences principales (compétences, outils, responsabilités) et vocabulaire clé. Si une analyse de l'offre est fournie, appuie-toi dessus.
2. Titre (headline) : l'intitulé du poste visé, ajusté si besoin pour rester exact au regard du parcours (ex. « Ingénieur QA Automatisation »).
3. Accroche (summary) : réécris-la entièrement, en 3 ou 4 phrases orientées vers ce poste : profil et années d'expérience, compétences demandées par l'offre que le candidat possède, une réalisation pertinente. Ne recopie pas l'accroche d'origine.
4. Compétences (skillGroups) : 3 à 5 groupes aux intitulés proches du vocabulaire de l'offre, 4 à 8 éléments chacun. D'abord les compétences exigées par l'offre que le candidat possède. Retire celles qui ne servent pas ce poste (elles restent dans son profil). Ajoute un groupe « Langues » si pertinent.
5. Expériences (de la plus récente à la plus ancienne, 6 au maximum) :
   - expériences pertinentes : 3 à 5 réalisations réécrites pour mettre en avant ce qui répond aux exigences de l'offre (verbe d'action, contexte, résultat), avec le vocabulaire de l'offre quand il décrit fidèlement ce qui a été fait, les plus pertinentes en premier ;
   - expériences peu pertinentes : 1 ou 2 réalisations condensées.
6. Projets : uniquement ceux qui servent la candidature (0 à 3).
7. changes : 4 à 8 modifications concrètes que tu as faites, formulées brièvement (ex. « Accroche recentrée sur l'automatisation des tests », « Cypress et Playwright placés en tête des compétences »).

Fidélité (impératif) :
- N'invente aucune expérience, entreprise, date, diplôme, chiffre, outil ni compétence absents du CV ou du profil. Une compétence demandée par l'offre que le candidat ne possède pas n'apparaît pas dans le CV : signale-la dans advice.
- Pour chaque expérience, projet ou formation présent dans le profil, renseigne son identifiant (exp-N, proj-N, edu-N) et recopie à l'identique postes, entreprises et périodes.
- Rédige le CV en français, sans pronom personnel. advice s'adresse au candidat et le tutoie.`;

function refIndex(ref: string | null, prefix: string): number | null {
  const match = ref?.match(new RegExp(`^\\[?${prefix}-(\\d+)\\]?$`));
  return match?.[1] ? Number(match[1]) - 1 : null;
}

export const TAILOR_TASK = "Produis le CV adapté à cette offre.";

export type AiTailorOutput = z.output<typeof aiTailorSchema>;

/**
 * Convertit la réponse du modèle (API ou copier-coller) en CV adapté :
 * postes, entreprises et dates sont réinjectés depuis la base, et seules les
 * compétences présentes dans le parcours sont conservées.
 */
export function toTailoredContent(output: AiTailorOutput, data: CandidateData): TailoredResumeContent {
  const { raw } = data;
  const corpus = normalize(
    [
      data.resume?.extractedText,
      ...raw.skills.map((skill) => skill.name),
      ...raw.experiences.flatMap((e) => [e.description, ...e.achievements, ...e.skills.map((s) => s.name)]),
      ...raw.projects.flatMap((p) => [p.description, ...p.skills.map((s) => s.name)]),
    ]
      .filter(Boolean)
      .join("\n"),
  );
  const known = (item: string) => containsTerm(corpus, item);

  const experiences = output.experiences.map((item) => {
    const source = raw.experiences[refIndex(item.ref, "exp") ?? -1];
    return source
      ? {
          position: source.position,
          company: source.company,
          location: source.location,
          period: formatPeriod(source.startDate, source.endDate),
          bullets: item.bullets,
        }
      : { ...item };
  });

  const projects = output.projects.map((item) => {
    const source = raw.projects[refIndex(item.ref, "proj") ?? -1];
    return {
      name: source?.name ?? item.name,
      role: source ? source.role : item.role,
      description: item.description,
      technologies: item.technologies.filter(known),
    };
  });

  const education = output.education.map((item) => {
    const source = raw.educations[refIndex(item.ref, "edu") ?? -1];
    return source
      ? {
          degree: source.fieldOfStudy ? `${source.degree} — ${source.fieldOfStudy}` : source.degree,
          institution: source.institution,
          period: formatPeriod(source.startDate, source.endDate) || null,
          details: item.details,
        }
      : { degree: item.degree, institution: item.institution, period: item.period, details: item.details };
  });

  return {
    headline: output.headline,
    summary: output.summary,
    skillGroups: output.skillGroups
      .map((group) => ({ label: group.label, items: group.items.filter(known) }))
      .filter((group) => group.items.length > 0),
    experiences: experiences.map(({ position, company, location, period, bullets }) => ({
      position,
      company,
      location,
      period,
      bullets,
    })),
    projects,
    education,
    advice: output.advice,
    changes: output.changes,
  };
}

/** CV adapté par Claude via l'API. */
export async function tailorWithAi(
  userId: string,
  data: CandidateData,
  offer: Offer,
  analysis: AnalysisDetails | null = null,
): Promise<{ content: TailoredResumeContent; model: string }> {
  const { data: output, model } = await generateStructured({
    userId,
    kind: "TAILORING",
    system: TAILOR_SYSTEM_PROMPT,
    schema: aiTailorSchema,
    content: buildUserContent(data, offer, TAILOR_TASK, describeAnalysis(analysis)),
  });
  return { content: toTailoredContent(output, data), model };
}
