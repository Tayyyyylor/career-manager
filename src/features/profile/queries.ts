import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";
import { toScoreScale, type ScoreScale } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const getProfile = cache(async () => {
  const user = await requireUser();
  return db.profile.findUnique({ where: { userId: user.id } });
});

export type ProfileData = NonNullable<Awaited<ReturnType<typeof getProfile>>>;

/** Barème choisi par l'utilisateur pour afficher les notes. */
export const getScoreScale = cache(async (): Promise<ScoreScale> => {
  const profile = await getProfile();
  return toScoreScale(profile?.scoreScale);
});
