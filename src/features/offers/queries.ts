import "server-only";

import { cache } from "react";

import { parseAnalysisDetails } from "@/features/analysis/types";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const getOffers = cache(async () => {
  const user = await requireUser();
  const offers = await db.jobOffer.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      createdAt: true,
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { score: true, method: true, createdAt: true },
      },
      _count: { select: { applications: true, resumes: true } },
    },
  });
  return offers.map(({ analyses, ...offer }) => ({ ...offer, latest: analyses[0] ?? null }));
});

export type OfferListItem = Awaited<ReturnType<typeof getOffers>>[number];

export const getOfferDetail = cache(async (id: string) => {
  const user = await requireUser();
  const offer = await db.jobOffer.findFirst({
    where: { id, userId: user.id },
    include: {
      analyses: {
        orderBy: { createdAt: "desc" },
        include: { resume: { select: { id: true, title: true } } },
      },
      resumes: {
        where: { kind: "TAILORED" },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, method: true, createdAt: true },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, createdAt: true },
      },
    },
  });
  if (!offer) return null;

  return {
    ...offer,
    analyses: offer.analyses.map((analysis) => ({
      ...analysis,
      details: parseAnalysisDetails(analysis.details),
    })),
  };
});

export type OfferDetail = NonNullable<Awaited<ReturnType<typeof getOfferDetail>>>;
