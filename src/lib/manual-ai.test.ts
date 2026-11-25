import { describe, expect, it } from "vitest";
import { z } from "zod";

import { buildManualPrompt, parseManualResponse } from "./manual-ai";

const schema = z.object({
  score: z.number(),
  level: z.enum(["LOW", "HIGH"]).nullable(),
  items: z.array(z.string()),
});

describe("buildManualPrompt", () => {
  it("inclut les consignes, les données et le schéma JSON", () => {
    const prompt = buildManualPrompt({ instructions: "Sois précis.", body: "<offre>X</offre>", schema });
    expect(prompt).toContain("<consignes>\nSois précis.\n</consignes>");
    expect(prompt).toContain("<offre>X</offre>");
    expect(prompt).toContain('"score"');
    expect(prompt).toContain('"LOW"');
  });
});

describe("parseManualResponse", () => {
  const valid = { score: 72, level: "HIGH", items: ["a"] };

  it("accepte un bloc ```json entouré de texte", () => {
    const result = parseManualResponse(`Voici l'analyse :\n\`\`\`json\n${JSON.stringify(valid)}\n\`\`\`\nBonne chance !`, schema);
    expect(result).toEqual({ ok: true, data: valid });
  });

  it("accepte un JSON brut", () => {
    expect(parseManualResponse(JSON.stringify(valid), schema).ok).toBe(true);
  });

  it("signale une réponse vide ou sans JSON", () => {
    expect(parseManualResponse("   ", schema)).toMatchObject({ ok: false });
    expect(parseManualResponse("Désolé, je ne peux pas.", schema)).toMatchObject({
      ok: false,
      error: expect.stringContaining("Aucun objet JSON"),
    });
  });

  it("signale un JSON coupé", () => {
    expect(parseManualResponse('```json\n{"score": 72, "items": [\n```', schema)).toMatchObject({
      ok: false,
      error: expect.stringContaining("incomplet"),
    });
  });

  it("signale un format non conforme avec le champ en cause", () => {
    const result = parseManualResponse(JSON.stringify({ ...valid, level: "MEDIUM" }), schema);
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("level") });
  });
});
