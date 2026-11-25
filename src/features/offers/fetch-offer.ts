import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { parse, type HTMLElement } from "node-html-parser";

export class OfferFetchError extends Error {}

export type FetchedOffer = {
  title: string | null;
  company: string | null;
  location: string | null;
  description: string;
};

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const MIN_TEXT_LENGTH = 200;

// ─── Protection SSRF ─────────────────────────────────────────────────────────

function isPrivateIPv4(ip: string): boolean {
  const [a = 0, b = 0] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) return true;
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isPrivateIPv4(mapped[1]);
  return false;
}

/** Refuse les URL qui pointent vers le réseau local ou des ports non standard. */
async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new OfferFetchError("Seuls les liens http(s) sont acceptés.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new OfferFetchError("Ce lien utilise un port non autorisé.");
  }
  if (url.username || url.password) {
    throw new OfferFetchError("Les liens avec identifiants ne sont pas acceptés.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new OfferFetchError("Ce lien pointe vers une adresse locale.");
  }

  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true }).catch(() => {
        throw new OfferFetchError("Ce site est introuvable.");
      });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new OfferFetchError("Ce lien pointe vers une adresse non publique.");
  }
}

async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new OfferFetchError("La page est trop volumineuse.");
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

async function fetchHtml(initialUrl: URL): Promise<string> {
  let url = initialUrl;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    await assertPublicUrl(url);

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CareerManager/1.0)",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        },
      });
    } catch {
      throw new OfferFetchError("Le site n'a pas répondu à temps.");
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) break;
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) {
      throw new OfferFetchError(
        response.status === 403 || response.status === 429
          ? "Ce site bloque la lecture automatique des annonces."
          : `Le site a répondu avec une erreur (${response.status}).`,
      );
    }
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("html")) throw new OfferFetchError("Ce lien ne mène pas à une page web.");
    return readLimited(response);
  }
  throw new OfferFetchError("Trop de redirections.");
}

// ─── Extraction ──────────────────────────────────────────────────────────────

function htmlToText(html: string): string {
  // Certaines descriptions JSON-LD sont doublement échappées (&lt;p&gt;).
  const decoded = /&lt;\w/.test(html) ? parse(html).text : html;
  return cleanText(parse(decoded).structuredText);
}

function cleanText(text: string): string {
  return text
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type JsonLd = Record<string, unknown>;

function asRecord(value: unknown): JsonLd | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonLd) : null;
}

function findJobPosting(value: unknown): JsonLd | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return null;
  }
  const record = asRecord(value);
  if (!record) return null;
  const type = record["@type"];
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) return record;
  return findJobPosting(record["@graph"]);
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function locationOf(posting: JsonLd): string | null {
  const locations = Array.isArray(posting.jobLocation) ? posting.jobLocation : [posting.jobLocation];
  for (const location of locations) {
    const address = asRecord(asRecord(location)?.address);
    const locality = str(address?.addressLocality) ?? str(address?.addressRegion);
    if (locality) return locality;
  }
  return str(posting.jobLocationType) === "TELECOMMUTE" ? "Télétravail" : null;
}

function fromJsonLd(root: HTMLElement): FetchedOffer | null {
  for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
    let data: unknown;
    try {
      data = JSON.parse(script.rawText);
    } catch {
      continue;
    }
    const posting = findJobPosting(data);
    const description = posting ? str(posting.description) : null;
    if (!posting || !description) continue;

    return {
      title: str(posting.title),
      company: str(asRecord(posting.hiringOrganization)?.name),
      location: locationOf(posting),
      description: htmlToText(description),
    };
  }
  return null;
}

function fromPageContent(root: HTMLElement): FetchedOffer {
  for (const selector of ["script", "style", "noscript", "svg", "nav", "header", "footer", "aside", "form", "iframe"]) {
    for (const element of root.querySelectorAll(selector)) element.remove();
  }
  const main = root.querySelector("main") ?? root.querySelector("article") ?? root.querySelector("body") ?? root;
  const title =
    str(root.querySelector('meta[property="og:title"]')?.getAttribute("content")) ??
    str(root.querySelector("h1")?.text) ??
    str(root.querySelector("title")?.text);

  return {
    title,
    company: str(root.querySelector('meta[property="og:site_name"]')?.getAttribute("content")),
    location: null,
    description: cleanText(main.structuredText),
  };
}

/** Récupère et extrait le texte d'une annonce à partir de son URL. */
export async function fetchOfferFromUrl(rawUrl: string): Promise<FetchedOffer> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new OfferFetchError("Lien invalide.");
  }

  const html = await fetchHtml(url);
  const root = parse(html);
  const offer = fromJsonLd(root) ?? fromPageContent(root);

  if (offer.description.length < MIN_TEXT_LENGTH) {
    throw new OfferFetchError(
      "Impossible d'extraire le texte de l'annonce (page générée en JavaScript ou protégée).",
    );
  }
  return { ...offer, description: offer.description.slice(0, 30_000) };
}
