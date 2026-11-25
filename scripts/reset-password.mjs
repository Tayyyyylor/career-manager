// Réinitialise le mot de passe d'un compte (pas de service d'email configuré).
// Usage : pnpm user:reset-password <email> <nouveau-mot-de-passe>
import "dotenv/config";

import { hashPassword } from "better-auth/crypto";
import pg from "pg";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage : pnpm user:reset-password <email> <nouveau-mot-de-passe>");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Le mot de passe doit contenir au moins 8 caractères.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
await client.connect();

try {
  const hash = await hashPassword(password);
  const { rowCount } = await client.query(
    `UPDATE "Account" SET password = $1, "updatedAt" = now()
     WHERE "providerId" = 'credential'
       AND "userId" = (SELECT id FROM "User" WHERE lower(email) = lower($2))`,
    [hash, email],
  );

  if (!rowCount) {
    console.error(`Aucun compte trouvé pour ${email}.`);
    process.exitCode = 1;
  } else {
    // Déconnecte les sessions existantes.
    await client.query(
      `DELETE FROM "Session" WHERE "userId" = (SELECT id FROM "User" WHERE lower(email) = lower($1))`,
      [email],
    );
    console.log(`Mot de passe de ${email} réinitialisé. Transmets-le lui et invite-le à le changer depuis « Mon profil ».`);
  }
} finally {
  await client.end();
}
