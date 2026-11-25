import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { matchFont } from "./types";

vi.mock("server-only", () => ({}));

const fixture = (name: string) =>
  new Uint8Array(readFileSync(fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url))));

describe("detectPdfStyle", () => {
  it("retrouve la couleur d'accent et la police d'un CV coloré", async () => {
    const { detectPdfStyle } = await import("./detect");
    const style = await detectPdfStyle(fixture("cv-couleur.pdf"));
    expect(style.accent).toBe("#1f6f8b");
    expect(style.sourceFont).toBe("Georgia");
    expect(style.font).toBe("source-serif");
  });

  it("ne propose pas de couleur pour un CV noir et blanc", async () => {
    const { detectPdfStyle } = await import("./detect");
    const style = await detectPdfStyle(fixture("cv-sobre.pdf"));
    expect(style.accent).toBeNull();
    expect(style.sourceFont).toBe("Helvetica");
    expect(style.font).toBe("inter");
  });

  it("ne plante pas sur un fichier invalide", async () => {
    const { detectPdfStyle } = await import("./detect");
    expect(await detectPdfStyle(new Uint8Array([1, 2, 3]))).toEqual({ accent: null, font: null, sourceFont: null });
  });
});

describe("matchFont", () => {
  it("associe les polices courantes", () => {
    expect(matchFont("Montserrat", false)).toBe("montserrat");
    expect(matchFont("OpenSans", false)).toBe("open-sans");
    expect(matchFont("Calibri", false)).toBe("inter");
    expect(matchFont("Garamond", true)).toBe("source-serif");
    expect(matchFont("PoliceInconnue", true)).toBe("source-serif");
  });
});
