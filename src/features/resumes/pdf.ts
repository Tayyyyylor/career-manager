import "server-only";

import { extractText, getDocumentProxy } from "unpdf";

export const MAX_PDF_BYTES = 4 * 1024 * 1024;

export class PdfError extends Error {}

/** Vérifie la signature « %PDF- » en tête de fichier. */
export function isPdf(bytes: Uint8Array): boolean {
  return (
    bytes.length > 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

/** Extrait le texte d'un PDF (toutes pages fusionnées, espaces normalisés). */
export async function extractPdfText(
  bytes: Uint8Array,
): Promise<{ text: string; pages: number }> {
  if (!isPdf(bytes)) throw new PdfError("Le fichier n'est pas un PDF valide.");

  try {
    // unpdf peut transférer le buffer : on lui donne une copie.
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    const cleaned = text
      .replace(/\u0000/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return { text: cleaned, pages: totalPages };
  } catch {
    throw new PdfError("Impossible de lire ce PDF (fichier protégé ou corrompu ?).");
  }
}
