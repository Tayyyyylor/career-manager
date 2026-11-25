import "server-only";

import { db } from "@/lib/db";

import { detectPdfStyle } from "./detect";
import {
  DEFAULT_RESUME_STYLE,
  parseDetectedStyle,
  parseResumeStyle,
  type DetectedStyle,
  type ResumeStyle,
} from "./types";

/**
 * Style détecté d'un CV générique. Calculé et mémorisé au premier besoin
 * pour les CV importés avant la détection automatique.
 */
async function detectedStyleOf(resumeId: string): Promise<DetectedStyle | null> {
  const resume = await db.resume.findUnique({
    where: { id: resumeId },
    select: { style: true, fileData: true },
  });
  if (!resume) return null;

  const stored = parseDetectedStyle(resume.style);
  if (stored) return stored;
  if (!resume.fileData) return null;

  const detected = await detectPdfStyle(new Uint8Array(resume.fileData));
  await db.resume.update({ where: { id: resumeId }, data: { style: detected } });
  return detected;
}

/** Style détecté dans le CV générique par défaut de l'utilisateur. */
export async function getUserDetectedStyle(userId: string): Promise<DetectedStyle | null> {
  const generic = await db.resume.findFirst({
    where: { userId, kind: "GENERIC" },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
  return generic ? detectedStyleOf(generic.id) : null;
}

/**
 * Style d'un nouveau CV adapté : celui du dernier CV adapté (préférence de
 * l'utilisateur), sinon celui détecté dans son CV générique, sinon le défaut.
 */
export async function initialTailoredStyle(userId: string): Promise<ResumeStyle> {
  const recent = await db.resume.findMany({
    where: { userId, kind: "TAILORED" },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { style: true },
  });
  for (const resume of recent) {
    const style = parseResumeStyle(resume.style);
    if (style) return style;
  }

  const detected = await getUserDetectedStyle(userId);
  return {
    ...DEFAULT_RESUME_STYLE,
    accent: detected?.accent ?? DEFAULT_RESUME_STYLE.accent,
    font: detected?.font ?? DEFAULT_RESUME_STYLE.font,
  };
}
