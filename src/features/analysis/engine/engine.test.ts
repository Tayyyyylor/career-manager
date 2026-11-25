import { describe, expect, it } from "vitest";

import type { CandidateProfile } from "@/features/analysis/types";

import { computeCandidateYears, extractRequiredYears } from "./experience";
import { analyzeOffer } from "./score";
import { detectSkills, expandDeclaredSkills } from "./skills";
import { containsTerm, normalize } from "./text";

const names = (text: string) => detectSkills(normalize(text)).map((skill) => skill.name);
const utc = (year: number, month: number) => new Date(Date.UTC(year, month - 1, 1));

describe("normalize", () => {
  it("retire les accents et la ponctuation inutile", () => {
    expect(normalize("Développeur·se Full-Stack (H/F) !")).toBe("developpeur se full stack h f");
  });

  it("conserve les caractères des noms techniques", () => {
    expect(normalize("C++, C# et Node.js")).toBe("c++ c# et node.js");
  });
});

describe("containsTerm", () => {
  it("respecte les limites de mots", () => {
    const text = normalize("Maîtrise de JavaScript et PostgreSQL");
    expect(containsTerm(text, "JavaScript")).toBe(true);
    expect(containsTerm(text, "Java")).toBe(false);
    expect(containsTerm(text, "SQL")).toBe(false);
  });

  it("gère les termes avec + et #", () => {
    const text = normalize("Expérience en C++ et C#.");
    expect(containsTerm(text, "C++")).toBe(true);
    expect(containsTerm(text, "C#")).toBe(true);
  });
});

describe("detectSkills", () => {
  it("détecte les compétences et leurs variantes", () => {
    expect(names("Stack : ReactJS, NodeJS, TypeScript, Docker, anglais courant")).toEqual(
      expect.arrayContaining(["React", "Node.js", "TypeScript", "Docker", "Anglais"]),
    );
  });

  it("préfère l'occurrence la plus longue", () => {
    const found = names("Développement mobile en React Native");
    expect(found).toContain("React Native");
    expect(found).not.toContain("React");
  });

  it("évite les faux positifs courants en français", () => {
    const found = names(
      "J'ai des notions d'anglais. Tableau de bord, formation assurée, 16 Go de RAM, organisation du travail, démarche de qualité de vie.",
    );
    expect(found).not.toContain("Intelligence artificielle");
    expect(found).not.toContain("Notion");
    expect(found).not.toContain("Tableau");
    expect(found).not.toContain("Go");
    expect(found).not.toContain("Animation de formations");
    expect(found).toContain("Anglais");
  });

  it("reconnaît les compétences personnalisées du candidat", () => {
    const found = detectSkills(normalize("Connaissance de Odoo appréciée"), [
      { name: "Odoo", category: "TOOL" },
    ]).map((skill) => skill.name);
    expect(found).toContain("Odoo");
  });
});

describe("expandDeclaredSkills", () => {
  it("associe un alias déclaré à sa forme canonique", () => {
    const expanded = expandDeclaredSkills(["JS"]);
    expect(expanded.has("javascript")).toBe(true);
  });
});

describe("extractRequiredYears", () => {
  it.each([
    ["Vous avez au moins 3 ans d'expérience en développement web.", 3],
    ["Expérience : minimum 5 ans sur un poste similaire", 5],
    ["2 à 4 ans d'expérience souhaités", 2],
    ["5+ years of experience with Python", 5],
    ["Poste ouvert aux jeunes diplômés", 0],
    ["Nous recherchons un profil senior", 5],
    ["Rejoignez une équipe dynamique", null],
  ])("%s → %s", (text, expected) => {
    expect(extractRequiredYears(text)).toBe(expected);
  });
});

describe("computeCandidateYears", () => {
  it("cumule les périodes sans double comptage", () => {
    const years = computeCandidateYears([
      { startDate: utc(2018, 1), endDate: utc(2020, 12) }, // 3 ans
      { startDate: utc(2020, 1), endDate: utc(2021, 12) }, // chevauche 1 an
    ]);
    expect(years).toBeCloseTo(4, 0);
  });

  it("compte les stages pour moitié", () => {
    const years = computeCandidateYears([
      { startDate: utc(2020, 1), endDate: utc(2021, 12), employmentType: "INTERNSHIP" },
    ]);
    expect(years).toBeCloseTo(1, 0);
  });
});

describe("analyzeOffer", () => {
  const offer = {
    title: "Développeur Full-Stack React / Node.js",
    description: `Nous recherchons un développeur full-stack pour rejoindre notre équipe produit.
Missions : développement de nouvelles fonctionnalités en React et TypeScript, conception d'API REST en Node.js, déploiement avec Docker sur AWS.
Profil : 3 ans d'expérience minimum, maîtrise de PostgreSQL, anglais courant, autonomie et travail en équipe.
Environnement agile (Scrum), revues de code, tests automatisés.`,
  };

  const strongCandidate: CandidateProfile = {
    headline: "Développeur full-stack JavaScript",
    summary: "Développeur passionné par le produit.",
    skills: [
      { name: "React", category: "TECHNICAL" },
      { name: "TypeScript", category: "TECHNICAL" },
      { name: "Node.js", category: "TECHNICAL" },
      { name: "PostgreSQL", category: "TECHNICAL" },
      { name: "Docker", category: "TOOL" },
      { name: "Anglais", category: "LANGUAGE" },
      { name: "Scrum", category: "METHODOLOGY" },
    ],
    experiences: [
      {
        position: "Développeur full-stack",
        company: "Exemple SAS",
        description: "Développement de fonctionnalités produit et d'API REST.",
        achievements: ["Mise en place de tests automatisés", "Déploiement sur AWS"],
        skills: ["React", "Node.js"],
        startDate: utc(2020, 1),
        endDate: null,
        employmentType: "FULL_TIME",
      },
    ],
    projects: [],
    educations: [],
    resumeText: "Autonomie, travail en équipe, revues de code.",
  };

  const now = utc(2026, 11);

  it("donne une note élevée à un profil aligné", () => {
    const result = analyzeOffer(offer, strongCandidate, now);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.details.matchedSkills).toEqual(expect.arrayContaining(["React", "Node.js", "Docker"]));
    expect(result.details.experience).toEqual({ requiredYears: 3, candidateYears: expect.any(Number) });
  });

  it("donne une note faible à un profil éloigné et liste les manques", () => {
    const result = analyzeOffer(
      offer,
      {
        headline: "Comptable",
        summary: null,
        skills: [{ name: "Comptabilité", category: "TECHNICAL" }],
        experiences: [],
        projects: [],
        educations: [],
        resumeText: null,
      },
      now,
    );
    expect(result.score).toBeLessThan(30);
    expect(result.details.missingSkills).toEqual(expect.arrayContaining(["React", "TypeScript"]));
    expect(result.details.recommendations.length).toBeGreaterThan(0);
  });

  it("reste borné entre 0 et 100", () => {
    const result = analyzeOffer({ title: "", description: "" }, strongCandidate, now);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("inferSkillCategory", () => {
  it("déduit la catégorie des compétences connues", async () => {
    const { inferSkillCategory } = await import("./skills");
    expect(inferSkillCategory("anglais")).toBe("LANGUAGE");
    expect(inferSkillCategory("Docker")).toBe("TOOL");
    expect(inferSkillCategory("scrum")).toBe("METHODOLOGY");
    expect(inferSkillCategory("Odoo")).toBeNull();
  });
});

describe("mots-clés affichés", () => {
  it("conservent les accents d'origine", () => {
    const result = analyzeOffer(
      {
        title: "Chargé de communication",
        description:
          "Gestion des événements et du télétravail. Les événements internes, la stratégie éditoriale et la stratégie événementielle.",
      },
      { headline: null, summary: null, skills: [], experiences: [], projects: [], educations: [], resumeText: null },
    );
    const keywords = [...(result.details.keywords?.found ?? []), ...(result.details.keywords?.missing ?? [])];
    expect(keywords).toContain("stratégie");
    expect(keywords.some((word) => word.includes("é"))).toBe(true);
  });
});

describe("métiers du dev et de la QA", () => {
  const qaOffer = `Ingénieur QA Automatisation (H/F)
Au sein de l'équipe qualité, vous rédigez le plan de test et les cas de test, réalisez la recette fonctionnelle
et automatisez les tests de non-régression avec Cypress et Playwright. Tests d'API sous Postman,
tests de charge avec JMeter, suivi des anomalies dans Jira / Xray. Intégration dans GitLab CI.
Certification ISTQB appréciée. A solid experience with Selenium is a plus.`;

  it("détecte les outils et pratiques QA", () => {
    const found = names(qaOffer);
    expect(found).toEqual(
      expect.arrayContaining([
        "Cypress",
        "Playwright",
        "Postman",
        "JMeter",
        "Selenium",
        "Jira",
        "Xray",
        "GitLab CI",
        "ISTQB",
        "Recette",
        "Stratégie de test",
        "Cas de test",
        "Tests de non-régression",
        "Tests d'API",
        "Tests de performance",
        "Gestion des anomalies",
      ]),
    );
  });

  it("évite les faux positifs propres au dev", () => {
    const found = names(qaOffer);
    expect(found).not.toContain("SOLID"); // « a solid experience »
    expect(found).not.toContain("Git"); // couvert par « GitLab CI »
    expect(names("Le build est rapide, il faut aller vite.")).not.toContain("Vite");
    expect(names("Configuration Vite.js et Vitest")).toEqual(expect.arrayContaining(["Vite", "Vitest"]));
  });

  it("rapproche les intitulés anglais et français", () => {
    const result = analyzeOffer(
      { title: "Ingénieur QA Automatisation", description: qaOffer },
      {
        headline: "QA Automation Engineer",
        summary: null,
        skills: [
          { name: "Cypress", category: "TOOL" },
          { name: "Postman", category: "TOOL" },
        ],
        experiences: [],
        projects: [],
        educations: [],
        resumeText: null,
      },
      utc(2026, 11),
    );
    const title = result.details.criteria.find((criterion) => criterion.key === "title");
    expect(title?.score).toBe(100);
  });

  it("ne confond pas « 16 Go de RAM » avec le langage Go côté candidat", () => {
    const result = analyzeOffer(
      { title: "Développeur Golang", description: "Développement de microservices en Golang." },
      {
        headline: null,
        summary: null,
        skills: [],
        experiences: [],
        projects: [],
        educations: [],
        resumeText: "Poste de travail avec 16 Go de RAM.",
      },
      utc(2026, 11),
    );
    expect(result.details.missingSkills).toContain("Go");
  });
});
