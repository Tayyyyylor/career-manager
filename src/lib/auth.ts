import "server-only";

import { timingSafeEqual } from "node:crypto";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { siteConfig } from "@/config/site";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/** En-tête portant le code d'invitation lors de l'inscription. */
export const INVITE_CODE_HEADER = "x-invite-code";

/** Compare le code saisi au code d'invitation configuré (temps constant). */
export function isValidInviteCode(candidate: string): boolean {
  const expected = env.INVITE_CODE;
  if (!expected) return false;

  const a = Buffer.from(candidate.trim());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const auth = betterAuth({
  appName: siteConfig.name,
  baseURL: env.APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.PREVIEW_URL ? [env.PREVIEW_URL] : [],
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 jours
    updateAge: 60 * 60 * 24, // prolongée au plus une fois par jour
  },
  telemetry: { enabled: false },
  hooks: {
    // Inscription réservée aux personnes disposant du code d'invitation,
    // y compris pour les appels directs à /api/auth/sign-up/email.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const code = ctx.headers?.get(INVITE_CODE_HEADER) ?? "";
      if (!isValidInviteCode(code)) {
        throw new APIError("FORBIDDEN", {
          message: "Code d'invitation invalide.",
        });
      }
    }),
  },
  // `nextCookies` doit rester le dernier plugin : il permet aux Server Actions
  // de poser les cookies de session.
  plugins: [nextCookies()],
});
