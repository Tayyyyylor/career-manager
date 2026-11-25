import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Réutilise une instance unique en développement : le rechargement à chaud
// réévalue les modules et ouvrirait sinon une nouvelle connexion à chaque fois.
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
