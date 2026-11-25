import type { SkillCategory } from "@/generated/prisma/enums";

export type DictionarySkill = {
  /** Nom canonique affiché. */
  name: string;
  category: SkillCategory;
  /** Variantes reconnues (normalisées avant comparaison). */
  aliases: readonly string[];
};

function s(name: string, category: SkillCategory, ...aliases: string[]): DictionarySkill {
  return { name, category, aliases: [name, ...aliases] };
}

/** Comme `s`, mais le nom canonique seul est trop ambigu pour être recherché. */
function t(name: string, category: SkillCategory, ...aliases: string[]): DictionarySkill {
  return { name, category, aliases };
}

/**
 * Compétences reconnues automatiquement dans les annonces et les CV.
 * Centré sur les métiers du développement et de la QA. Les termes ambigus
 * en français ou en anglais (Go, Vite, Allure, SOLID, Notion…) ne sont
 * reconnus que sous des formes non équivoques.
 *
 * Pour ajouter un domaine : `s(nom, catégorie, ...variantes)`.
 */
export const SKILL_DICTIONARY: readonly DictionarySkill[] = [
  // ─── Langages ─────────────────────────────────────────────────────────────
  s("JavaScript", "TECHNICAL", "js", "ecmascript", "es6", "vanilla js"),
  s("TypeScript", "TECHNICAL", "ts"),
  s("Python", "TECHNICAL", "python3"),
  s("Java", "TECHNICAL", "jee", "j2ee", "java ee", "jakarta ee"),
  s("Kotlin", "TECHNICAL"),
  s("Swift", "TECHNICAL"),
  s("Objective-C", "TECHNICAL", "objective c", "objc"),
  s("C#", "TECHNICAL", "csharp", "c sharp"),
  s("C++", "TECHNICAL", "cpp"),
  t("Langage C", "TECHNICAL", "langage c", "c ansi", "c embarque"),
  t("Go", "TECHNICAL", "golang", "langage go"),
  s("Rust", "TECHNICAL"),
  s("PHP", "TECHNICAL"),
  s("Ruby", "TECHNICAL"),
  s("Scala", "TECHNICAL"),
  s("Elixir", "TECHNICAL"),
  s("Dart", "TECHNICAL"),
  s("Groovy", "TECHNICAL"),
  s("HTML", "TECHNICAL", "html5"),
  s("CSS", "TECHNICAL", "css3", "sass", "scss", "less css"),
  s("SQL", "TECHNICAL", "t-sql", "pl/sql", "plsql", "requetes sql"),
  s("Bash", "TECHNICAL", "shell", "scripting shell", "shell script"),
  s("PowerShell", "TECHNICAL"),
  s("WebAssembly", "TECHNICAL", "wasm"),

  // ─── Front-end ────────────────────────────────────────────────────────────
  s("React", "TECHNICAL", "react.js", "reactjs"),
  s("React Native", "TECHNICAL"),
  s("Next.js", "TECHNICAL", "nextjs"),
  s("Vue.js", "TECHNICAL", "vuejs", "vue 3", "vue 2"),
  s("Nuxt", "TECHNICAL", "nuxt.js", "nuxtjs"),
  s("Angular", "TECHNICAL", "angularjs"),
  s("Svelte", "TECHNICAL", "sveltekit"),
  s("Remix", "TECHNICAL", "react router 7"),
  s("Astro", "TECHNICAL", "astro.js"),
  s("Redux", "TECHNICAL", "redux toolkit", "rtk"),
  s("RxJS", "TECHNICAL", "ngrx"),
  s("jQuery", "TECHNICAL"),
  s("Tailwind CSS", "TECHNICAL", "tailwind", "tailwindcss"),
  s("Bootstrap", "TECHNICAL"),
  s("Material UI", "TECHNICAL", "mui", "angular material"),
  s("Storybook", "TOOL"),
  t("Vite", "TOOL", "vite.js", "vitejs"),
  s("Webpack", "TOOL"),
  s("Three.js", "TECHNICAL", "threejs", "webgl"),
  s("D3.js", "TECHNICAL", "d3"),
  s("Accessibilité", "TECHNICAL", "accessibilite", "a11y", "wcag", "rgaa", "accessibility"),
  s("Responsive design", "TECHNICAL", "responsive", "mobile first"),
  s("PWA", "TECHNICAL", "progressive web app"),
  s("Performance web", "TECHNICAL", "web performance", "core web vitals", "lighthouse"),
  s("SEO", "TECHNICAL", "referencement naturel"),
  s("Figma", "TOOL"),

  // ─── Back-end & API ───────────────────────────────────────────────────────
  s("Node.js", "TECHNICAL", "nodejs", "node"),
  t("Express", "TECHNICAL", "express.js", "expressjs"),
  s("NestJS", "TECHNICAL", "nest.js"),
  s("Fastify", "TECHNICAL"),
  s("Deno", "TECHNICAL"),
  s("Bun", "TECHNICAL", "bun.js"),
  s("Django", "TECHNICAL", "django rest framework", "drf"),
  s("Flask", "TECHNICAL"),
  s("FastAPI", "TECHNICAL"),
  s("Spring", "TECHNICAL", "spring boot", "springboot", "spring framework"),
  s("Quarkus", "TECHNICAL"),
  s("Hibernate", "TECHNICAL", "jpa"),
  s("Symfony", "TECHNICAL"),
  s("Laravel", "TECHNICAL"),
  s("Ruby on Rails", "TECHNICAL", "rails", "ror"),
  s(".NET", "TECHNICAL", "dotnet", "asp.net", ".net core", "entity framework"),
  s("Flutter", "TECHNICAL"),
  s("Android", "TECHNICAL", "jetpack compose"),
  s("iOS", "TECHNICAL", "swiftui", "uikit"),
  s("API REST", "TECHNICAL", "restful", "apis rest", "api restful", "rest api"),
  s("GraphQL", "TECHNICAL", "apollo"),
  s("gRPC", "TECHNICAL", "protobuf"),
  s("WebSocket", "TECHNICAL", "websockets", "socket.io"),
  s("OpenAPI", "TECHNICAL", "swagger"),
  s("Microservices", "TECHNICAL", "micro services", "microservice", "micro-services"),
  s("Architecture événementielle", "TECHNICAL", "event driven", "architecture evenementielle", "event sourcing", "cqrs"),
  s("Serverless", "TECHNICAL", "aws lambda", "lambda functions", "cloud functions"),
  s("Kafka", "TECHNICAL", "apache kafka"),
  s("RabbitMQ", "TECHNICAL", "amqp"),
  s("OAuth", "TECHNICAL", "oauth2", "openid connect", "oidc", "jwt", "sso", "keycloak"),
  s("ORM", "TECHNICAL", "prisma", "typeorm", "sequelize", "drizzle", "doctrine"),
  s("Maven", "TOOL"),
  s("Gradle", "TOOL"),

  // ─── Données ──────────────────────────────────────────────────────────────
  s("PostgreSQL", "TECHNICAL", "postgres"),
  s("MySQL", "TECHNICAL", "mariadb"),
  s("SQL Server", "TECHNICAL", "mssql", "microsoft sql server"),
  s("Oracle", "TECHNICAL", "oracle database"),
  s("SQLite", "TECHNICAL"),
  s("MongoDB", "TECHNICAL", "mongo", "mongoose"),
  s("Redis", "TECHNICAL"),
  s("Elasticsearch", "TECHNICAL", "elastic", "opensearch"),
  s("Cassandra", "TECHNICAL"),
  s("DynamoDB", "TECHNICAL"),
  s("Firebase", "TECHNICAL", "firestore"),
  s("Supabase", "TECHNICAL"),
  s("NoSQL", "TECHNICAL"),
  s("Data engineering", "TECHNICAL", "data engineer", "pipelines de donnees", "etl", "airflow", "dbt"),
  s("Machine learning", "TECHNICAL", "apprentissage automatique", "deep learning", "pytorch", "tensorflow", "scikit learn"),
  s("Intelligence artificielle", "TECHNICAL", "ia", "ia generative", "llm", "genai", "rag"),

  // ─── Cloud, DevOps & observabilité ────────────────────────────────────────
  s("AWS", "TOOL", "amazon web services", "ec2", "s3"),
  s("Azure", "TOOL", "microsoft azure"),
  s("Google Cloud", "TOOL", "gcp", "google cloud platform"),
  s("Docker", "TOOL", "conteneurisation", "docker compose", "podman"),
  s("Kubernetes", "TOOL", "k8s", "openshift", "eks", "aks", "gke"),
  s("Helm", "TOOL"),
  s("Terraform", "TOOL", "infrastructure as code", "iac", "pulumi", "cloudformation"),
  s("Ansible", "TOOL"),
  s("GitHub Actions", "TOOL"),
  s("GitLab CI", "TOOL", "gitlab ci cd"),
  s("Jenkins", "TOOL"),
  s("CI/CD", "METHODOLOGY", "ci cd", "integration continue", "deploiement continu", "livraison continue", "pipelines ci"),
  s("Git", "TOOL", "github", "gitlab", "bitbucket", "gitflow"),
  s("DevOps", "METHODOLOGY"),
  s("SRE", "METHODOLOGY", "site reliability"),
  s("Observabilité", "TOOL", "observabilite", "observability", "monitoring", "supervision", "prometheus", "grafana", "datadog", "elk", "kibana", "opentelemetry", "new relic"),
  s("Sentry", "TOOL"),
  s("Nginx", "TOOL"),
  s("Linux", "TOOL", "unix", "debian", "ubuntu", "red hat", "centos"),
  s("Vercel", "TOOL", "netlify"),
  s("Cybersécurité", "TECHNICAL", "cybersecurite", "securite applicative", "securite informatique", "owasp", "devsecops"),
  s("Réseaux informatiques", "TECHNICAL", "reseaux informatiques", "tcp ip", "networking", "dns"),

  // ─── QA : types de tests ──────────────────────────────────────────────────
  s("Assurance qualité (QA)", "METHODOLOGY", "qa", "quality assurance", "assurance qualite", "qualite logicielle", "software quality", "quality engineering"),
  s("Automatisation des tests", "METHODOLOGY", "tests automatises", "test automation", "automatisation des tests", "automatisation de tests", "qa automation", "tests automatiques"),
  s("Tests unitaires", "METHODOLOGY", "unit tests", "unit testing", "test unitaire"),
  s("Tests d'intégration", "METHODOLOGY", "tests d integration", "integration tests", "integration testing"),
  s("Tests end-to-end", "METHODOLOGY", "e2e", "end to end", "tests de bout en bout", "tests e2e"),
  s("Tests fonctionnels", "METHODOLOGY", "functional testing", "functional tests", "test fonctionnel"),
  s("Tests de non-régression", "METHODOLOGY", "non regression", "tests de regression", "regression testing", "tnr"),
  s("Tests de performance", "METHODOLOGY", "tests de charge", "load testing", "performance testing", "stress testing", "tests de montee en charge"),
  s("Tests d'API", "METHODOLOGY", "api testing", "tests d api", "tests api"),
  s("Tests manuels", "METHODOLOGY", "manual testing", "test manuel"),
  s("Tests exploratoires", "METHODOLOGY", "exploratory testing"),
  s("Tests de sécurité", "METHODOLOGY", "security testing", "pentest", "tests d intrusion"),
  s("Tests mobiles", "METHODOLOGY", "mobile testing", "tests sur mobile"),
  t("Recette", "METHODOLOGY", "recette", "tests de recette", "cahier de recette", "recette fonctionnelle", "uat", "user acceptance testing", "tests d acceptation"),
  s("Stratégie de test", "METHODOLOGY", "plan de test", "plans de test", "strategie de test", "test plan", "test strategy", "cahier de tests", "plan de tests"),
  s("Cas de test", "METHODOLOGY", "test cases", "scenarios de test", "conception de tests", "test design"),
  s("Gestion des anomalies", "METHODOLOGY", "suivi des anomalies", "bug tracking", "rapports d anomalies", "defect management", "fiches d anomalies"),
  s("TDD", "METHODOLOGY", "test driven development"),
  s("BDD", "METHODOLOGY", "behavior driven development", "behaviour driven development"),
  s("Couverture de code", "METHODOLOGY", "code coverage", "couverture de tests", "test coverage"),
  s("Tests de contrat", "METHODOLOGY", "contract testing", "pact"),
  s("Tests de mutation", "METHODOLOGY", "mutation testing", "stryker"),
  s("ISTQB", "OTHER", "certification istqb"),

  // ─── QA : outils ──────────────────────────────────────────────────────────
  s("Selenium", "TOOL", "selenium webdriver", "selenium grid"),
  s("Cypress", "TOOL"),
  s("Playwright", "TOOL"),
  s("Puppeteer", "TOOL"),
  s("WebdriverIO", "TOOL", "wdio"),
  s("TestCafe", "TOOL"),
  s("Appium", "TOOL"),
  s("Robot Framework", "TOOL"),
  s("Cucumber", "TOOL", "gherkin", "specflow"),
  s("Katalon", "TOOL", "katalon studio"),
  s("UFT", "TOOL", "qtp", "unified functional testing"),
  s("Postman", "TOOL", "newman"),
  s("REST Assured", "TOOL", "restassured"),
  t("Karate", "TOOL", "karate dsl", "karate framework"),
  s("SoapUI", "TOOL", "readyapi"),
  s("JMeter", "TOOL", "apache jmeter"),
  s("Gatling", "TOOL"),
  s("k6", "TOOL", "grafana k6"),
  s("Locust", "TOOL"),
  s("LoadRunner", "TOOL"),
  s("Jest", "TOOL"),
  s("Vitest", "TOOL"),
  s("Mocha", "TOOL", "chai"),
  s("Jasmine", "TOOL", "karma"),
  s("Testing Library", "TOOL", "react testing library"),
  s("pytest", "TOOL"),
  s("JUnit", "TOOL", "junit5", "mockito"),
  s("TestNG", "TOOL"),
  s("PHPUnit", "TOOL"),
  s("xUnit", "TOOL", "nunit", "mstest"),
  s("TestRail", "TOOL"),
  s("Xray", "TOOL"),
  s("Zephyr", "TOOL"),
  t("Squash TM", "TOOL", "squash tm", "squashtm"),
  t("HP ALM", "TOOL", "hp alm", "alm octane", "quality center"),
  t("Allure", "TOOL", "allure report", "allure framework"),
  s("BrowserStack", "TOOL"),
  s("Sauce Labs", "TOOL", "saucelabs"),
  s("SonarQube", "TOOL", "sonar", "sonarcloud", "sonarlint"),

  // ─── Méthodes & pratiques ─────────────────────────────────────────────────
  s("Agile", "METHODOLOGY", "methode agile", "methodes agiles", "agilite"),
  s("Scrum", "METHODOLOGY", "scrum master", "sprints"),
  s("Kanban", "METHODOLOGY"),
  s("SAFe", "METHODOLOGY", "scaled agile"),
  s("Revue de code", "METHODOLOGY", "revues de code", "code review", "code reviews", "relecture de code"),
  s("Pair programming", "METHODOLOGY", "mob programming", "programmation en binome"),
  s("Clean code", "METHODOLOGY", "software craftsmanship", "craftsmanship"),
  t("SOLID", "METHODOLOGY", "principes solid", "solid principles"),
  s("Design patterns", "METHODOLOGY", "patrons de conception", "design pattern"),
  s("DDD", "METHODOLOGY", "domain driven design"),
  s("Architecture hexagonale", "METHODOLOGY", "clean architecture", "hexagonal architecture", "ports and adapters"),
  s("Jira", "TOOL"),
  s("Confluence", "TOOL"),
  t("Notion", "TOOL", "notion.so", "outil notion"),
  s("Gestion de projet", "METHODOLOGY", "gestion de projets", "project management", "chef de projet", "cheffe de projet"),
  s("Product management", "METHODOLOGY", "product owner", "product manager"),
  s("Management d'équipe", "METHODOLOGY", "management d equipe", "encadrement", "lead technique", "tech lead", "mentorat", "mentoring"),
  s("RGPD", "METHODOLOGY", "gdpr"),

  // ─── Langues ──────────────────────────────────────────────────────────────
  s("Anglais", "LANGUAGE", "english", "anglais courant", "anglais technique", "anglais professionnel", "bilingue anglais"),
  s("Espagnol", "LANGUAGE", "spanish"),
  s("Allemand", "LANGUAGE", "german"),
  s("Italien", "LANGUAGE", "italian"),
  s("Portugais", "LANGUAGE", "portuguese"),
  t("Français", "LANGUAGE", "francais courant", "francais natif", "langue francaise", "maitrise du francais"),

  // ─── Savoir-être ──────────────────────────────────────────────────────────
  s("Travail en équipe", "SOFT", "travail en equipe", "esprit d equipe", "teamwork", "collaboratif"),
  s("Autonomie", "SOFT", "autonome"),
  s("Rigueur", "SOFT", "rigoureux", "rigoureuse", "souci du detail", "attention to detail"),
  t("Sens de l'organisation", "SOFT", "sens de l organisation", "organise", "organisee", "bonne organisation"),
  s("Leadership", "SOFT"),
  s("Adaptabilité", "SOFT", "adaptabilite", "capacite d adaptation", "flexibilite"),
  s("Esprit d'analyse", "SOFT", "esprit d analyse", "esprit analytique", "analytique", "esprit de synthese"),
  s("Communication", "SOFT", "aisance relationnelle", "sens du relationnel", "relationnel", "pedagogue", "pedagogie"),
  s("Curiosité", "SOFT", "curiosite", "curieux", "curieuse", "veille technologique"),
  s("Proactivité", "SOFT", "proactivite", "proactif", "proactive", "force de proposition"),
  s("Résolution de problèmes", "SOFT", "resolution de problemes", "problem solving", "debugging", "debogage"),
];

/** Index : alias normalisé → compétence canonique. Construit à la demande. */
let aliasIndex: Map<string, DictionarySkill> | undefined;

export function getAliasIndex(normalizeFn: (value: string) => string): Map<string, DictionarySkill> {
  if (!aliasIndex) {
    aliasIndex = new Map();
    for (const skill of SKILL_DICTIONARY) {
      for (const alias of [skill.name, ...skill.aliases]) {
        const key = normalizeFn(alias);
        if (key && !aliasIndex.has(key)) aliasIndex.set(key, skill);
      }
    }
  }
  return aliasIndex;
}
