import "server-only";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Copiez .env.example en .env et renseignez-la.`,
    );
  }
  return value;
}

/** Variables d'environnement serveur, validées au chargement. */
export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;
