import { describe, expect, it } from "vitest";

import { extractWithRules } from "./rules";

const CV = `Camille MARTIN
Ingénieure QA Automatisation
camille.martin@exemple.fr · 06 12 34 56 78 · Lyon
linkedin.com/in/camille-martin · https://github.com/cmartin · https://cmartin.dev
Expériences
QA Engineer — Société Fictive (2021 – aujourd'hui)
Automatisation des tests de non-régression avec Cypress et Playwright, tests d'API sous Postman.
Compétences
Cypress, Playwright, Selenium, Postman, JMeter, Jira, Git, anglais courant`;

describe("extractWithRules", () => {
  const { profile, skills, experiences } = extractWithRules(CV);

  it("devine le nom et le titre depuis les premières lignes", () => {
    expect(profile.firstName).toBe("Camille");
    expect(profile.lastName).toBe("MARTIN");
    expect(profile.headline).toBe("Ingénieure QA Automatisation");
  });

  it("extrait les coordonnées et les liens", () => {
    expect(profile.email).toBe("camille.martin@exemple.fr");
    expect(profile.phone).toBe("06 12 34 56 78");
    expect(profile.linkedinUrl).toBe("https://linkedin.com/in/camille-martin");
    expect(profile.githubUrl).toBe("https://github.com/cmartin");
    expect(profile.websiteUrl).toBe("https://cmartin.dev");
  });

  it("détecte les compétences connues avec leur catégorie", () => {
    const byName = new Map(skills.map((skill) => [skill.name, skill.category]));
    expect(byName.get("Cypress")).toBe("TOOL");
    expect(byName.get("Anglais")).toBe("LANGUAGE");
    expect(byName.get("Tests de non-régression")).toBe("METHODOLOGY");
  });

  it("ne tente pas d'extraire les expériences sans IA", () => {
    expect(experiences).toEqual([]);
  });

  it("ne prend pas un titre de section pour un nom", () => {
    const result = extractWithRules("Curriculum Vitae\nDéveloppeur web\nExpériences");
    expect(result.profile.firstName).toBeNull();
  });

  it("gère « Prénom Nom » sans majuscules", () => {
    const result = extractWithRules("Jean Dupont\nDéveloppeur Java\njean@exemple.fr");
    expect(result.profile.firstName).toBe("Jean");
    expect(result.profile.lastName).toBe("Dupont");
  });
});
