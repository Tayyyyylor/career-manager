import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Les migrations utilisent la connexion directe quand elle est fournie
    // (ex. Neon : DATABASE_URL = URL « pooled », DIRECT_URL = URL directe).
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
