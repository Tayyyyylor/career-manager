"use server";

import { refresh } from "next/cache";

import { loadCandidate } from "@/features/analysis/candidate";
import { parseAnalysisDetails } from "@/features/analysis/types";
import { analysisMethodSchema, type AnalysisMethodInput } from "@/features/offers/schemas";
import { extractPdfText, MAX_PDF_BYTES, PdfError } from "@/features/resumes/pdf";
import { detectPdfStyle } from "@/features/resumes/style/detect";
import { initialTailoredStyle } from "@/features/resumes/style/server";
import { resumeStyleSchema, type ResumeStyle } from "@/features/resumes/style/types";
import { tailorWithAi, tailorWithRules } from "@/features/resumes/tailor";
import type { TailoredResumeContent } from "@/features/resumes/tailored";
import type { AnalysisMethod } from "@/generated/prisma/enums";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { AiError, isAiEnabled } from "@/lib/ai";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function generateTailoredResume(
  offerId: string,
  method: AnalysisMethodInput,
): Promise<ActionResult<{ resumeId: string; fallback: boolean }>> {
  const user = await requireUser();
  const parsedMethod = analysisMethodSchema.safeParse(method);
  if (!parsedMethod.success) return failure("Méthode invalide.");

  const offer = await db.jobOffer.findFirst({
    where: { id: offerId, userId: user.id },
    include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!offer) return failure("Offre introuvable.");

  const latest = offer.analyses[0];
  const latestDetails = latest ? parseAnalysisDetails(latest.details) : null;
  const data = await loadCandidate(user.id, latest?.resumeId ?? null);

  let content: TailoredResumeContent | undefined;
  let usedMethod: AnalysisMethod = "RULES";
  let fallbackReason: string | undefined;

  if (parsedMethod.data === "AI") {
    if (!isAiEnabled()) {
      fallbackReason = "L'IA n'est pas configurée sur ce serveur.";
    } else {
      try {
        content = (await tailorWithAi(user.id, data, offer, latestDetails)).content;
        usedMethod = "AI";
      } catch (error) {
        if (!(error instanceof AiError)) throw error;
        fallbackReason = error.message;
      }
    }
  }

  content ??= tailorWithRules(data, offer, latestDetails);

  const resume = await db.resume.create({
    data: {
      userId: user.id,
      kind: "TAILORED",
      title: `CV — ${offer.title}${offer.company ? ` (${offer.company})` : ""}`.slice(0, 160),
      method: usedMethod,
      jobOfferId: offer.id,
      content,
      style: await initialTailoredStyle(user.id),
    },
    select: { id: true },
  });

  refresh();
  return success(
    { resumeId: resume.id, fallback: Boolean(fallbackReason) },
    fallbackReason
      ? `IA indisponible (${fallbackReason}) — CV généré automatiquement.`
      : "CV adapté généré.",
  );
}

export async function uploadResume(
  formData: FormData,
): Promise<ActionResult<{ resumeId: string; hasText: boolean }>> {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return failure("Sélectionne un fichier PDF.", { file: ["Sélectionne un fichier PDF."] });
  }
  if (file.size > MAX_PDF_BYTES) {
    return failure("Le fichier dépasse 4 Mo.", { file: ["Le fichier dépasse 4 Mo."] });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let text: string;
  try {
    ({ text } = await extractPdfText(bytes));
  } catch (error) {
    if (error instanceof PdfError) return failure(error.message, { file: [error.message] });
    throw error;
  }

  const rawTitle = String(formData.get("title") ?? "").trim().slice(0, 120);
  const title = rawTitle || file.name.replace(/\.pdf$/i, "").slice(0, 120) || "Mon CV";
  const hasDefault = await db.resume.count({
    where: { userId: user.id, kind: "GENERIC", isDefault: true },
  });

  const resume = await db.resume.create({
    data: {
      userId: user.id,
      kind: "GENERIC",
      title,
      isDefault: hasDefault === 0,
      fileName: file.name.slice(0, 200),
      mimeType: "application/pdf",
      fileSize: file.size,
      fileData: bytes,
      extractedText: text || null,
      style: await detectPdfStyle(bytes),
    },
    select: { id: true },
  });

  refresh();
  return success(
    { resumeId: resume.id, hasText: Boolean(text) },
    text
      ? "CV importé et analysé."
      : "CV importé, mais aucun texte n'a pu être extrait (PDF scanné ?).",
  );
}

export async function setDefaultResume(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const resume = await db.resume.findFirst({
    where: { id, userId: user.id, kind: "GENERIC" },
    select: { id: true },
  });
  if (!resume) return failure("CV introuvable.");

  await db.$transaction([
    db.resume.updateMany({
      where: { userId: user.id, kind: "GENERIC" },
      data: { isDefault: false },
    }),
    db.resume.update({ where: { id }, data: { isDefault: true } }),
  ]);

  refresh();
  return success(undefined, "CV par défaut mis à jour.");
}

export async function deleteResume(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const resume = await db.resume.findFirst({
    where: { id, userId: user.id },
    select: { id: true, isDefault: true, kind: true },
  });
  if (!resume) return failure("CV introuvable.");

  await db.resume.delete({ where: { id } });

  // Désigne un autre CV générique par défaut si besoin.
  if (resume.isDefault) {
    const next = await db.resume.findFirst({
      where: { userId: user.id, kind: "GENERIC" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (next) await db.resume.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  refresh();
  return success(undefined, "CV supprimé.");
}

export async function updateResumeStyle(id: string, style: ResumeStyle): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = resumeStyleSchema.safeParse(style);
  if (!parsed.success) return failure("Style invalide.");

  const { count } = await db.resume.updateMany({
    where: { id, userId: user.id, kind: "TAILORED" },
    data: { style: parsed.data },
  });
  if (count === 0) return failure("CV introuvable.");
  return success();
}
