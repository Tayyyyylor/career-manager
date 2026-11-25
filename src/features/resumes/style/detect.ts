import "server-only";

import { getDocumentProxy, getResolvedPDFJS } from "unpdf";

import { matchFont, type DetectedStyle } from "./types";

function hexToHsl(hex: string): { s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
}

/** Couleur « marquée » : ni gris, ni presque noir, ni presque blanc. */
function isAccentCandidate(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const { s, l } = hexToHsl(hex);
  return s >= 0.25 && l >= 0.12 && l <= 0.75;
}

function topKey(counts: Map<string, number>): string | null {
  let best: string | null = null;
  let max = 0;
  for (const [key, value] of counts) {
    if (value > max) {
      best = key;
      max = value;
    }
  }
  return best;
}

/** « ABCDEF+Montserrat-SemiBold » → « Montserrat » */
function familyOf(fontName: string): string {
  return fontName
    .replace(/^[A-Z]{6}\+/, "")
    .split(/[-,]/)[0]!
    .replace(/(MT|PS|Std|Pro)$/, "")
    .trim();
}

/**
 * Détecte la couleur d'accent et la police principale d'un CV PDF
 * (première page). Au mieux-disant : renvoie `null` quand rien n'est fiable.
 */
export async function detectPdfStyle(bytes: Uint8Array): Promise<DetectedStyle> {
  const empty: DetectedStyle = { accent: null, font: null, sourceFont: null };
  try {
    const { OPS } = await getResolvedPDFJS();
    const pdf = await getDocumentProxy(new Uint8Array(bytes), { fontExtraProperties: true });
    const page = await pdf.getPage(1);
    const { fnArray, argsArray } = await page.getOperatorList();

    const textColors = new Map<string, number>();
    const fillColors = new Map<string, number>();
    const fonts = new Map<string, number>();
    let fill = "#000000";
    let fontId: string | null = null;

    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];
      const args = argsArray[i] as unknown[];
      if (fn === OPS.setFillRGBColor && typeof args[0] === "string") {
        fill = args[0].toLowerCase();
      } else if (fn === OPS.setFont && typeof args[0] === "string") {
        fontId = args[0];
      } else if (fn === OPS.showText && Array.isArray(args[0])) {
        const glyphs = (args[0] as { unicode?: string }[]).filter(
          (glyph) => glyph && typeof glyph.unicode === "string" && glyph.unicode.trim(),
        ).length;
        textColors.set(fill, (textColors.get(fill) ?? 0) + glyphs);
        if (fontId) fonts.set(fontId, (fonts.get(fontId) ?? 0) + glyphs);
      } else if (fn === OPS.fill || fn === OPS.eoFill || fn === OPS.constructPath) {
        fillColors.set(fill, (fillColors.get(fill) ?? 0) + 1);
      }
    }

    const accentFrom = (counts: Map<string, number>) =>
      topKey(new Map([...counts].filter(([color]) => isAccentCandidate(color))));
    const accent = accentFrom(textColors) ?? accentFrom(fillColors);

    const mainFontId = topKey(fonts);
    let sourceFont: string | null = null;
    let serif = false;
    if (mainFontId) {
      const font = page.commonObjs.get(mainFontId) as { name?: string; isSerifFont?: boolean } | undefined;
      if (font?.name) sourceFont = familyOf(font.name);
      serif = Boolean(font?.isSerifFont);
    }

    return {
      accent,
      font: sourceFont ? matchFont(sourceFont, serif) : null,
      sourceFont,
    };
  } catch {
    return empty;
  }
}
