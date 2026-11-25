import "server-only";

import { z } from "zod";

import type { CandidateData } from "@/features/analysis/candidate";
import { detectSkills } from "@/features/analysis/engine/skills";
import { containsTerm, normalize } from "@/features/analysis/engine/text";
import { buildUserContent } from "@/features/analysis/prompt-context";
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

  const experiences = raw.experiences.slice(0, MAX_EXPERIENCES).map((experience) => {
    const bullets = [...experience.achievements]
      .map((text, index) => ({ text, index, score: relevance(text, terms) }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, MAX_BULLETS)
      .map((bullet) => bullet.text);
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

  const advice = adviceFromAnalysis(analysis);
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
      bullets: z.array(z.string()).describe("2 à 5 réalisations reformulées, les plus pertinentes d'abord."),
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
});

export const TAILOR_SYSTEM_PROMPT = `Tu es une experte en rédaction de CV. Tu adaptes le CV d'un candidat à une offre d'emploi précise.

Règles impératives :
- N'invente rien : aucune expérience, entreprise, date, diplôme, chiffre ou compétence absents du CV ou du profil fournis.
- Tu peux sélectionner, réordonner, condenser et reformuler les éléments existants pour mettre en avant ce qui correspond à l'offre, et reprendre le vocabulaire de l'annonce uniquement quand il décrit fidèlement une expérience réelle.
- Pour chaque expérience, projet ou formation présent dans le profil, renseigne son identifiant (exp-N, proj-N, edu-N). Recopie à l'identique postes, entreprises et périodes du CV.
- Ordre : expériences de la plus récente à la plus ancienne, au maximum 6 ; au plus 3 projets ; réalisations concises commençant par un verbe d'action.
- Rédige en français, sans tutoyer (le CV s'adresse à un recruteur), sans pronom personnel.
- Les conseils (advice) s'adressent au candidat et le tutoient.`;

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
  };
}

/** CV adapté par Claude via l'API. */
export async function tailorWithAi(
  userId: string,
  data: CandidateData,
  offer: Offer,
): Promise<{ content: TailoredResumeContent; model: string }> {
  const { data: output, model } = await generateStructured({
    userId,
    kind: "TAILORING",
    system: TAILOR_SYSTEM_PROMPT,
    schema: aiTailorSchema,
    content: buildUserContent(data, offer, TAILOR_TASK),
  });
  return { content: toTailoredContent(output, data), model };
}
