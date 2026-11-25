import type { Metadata } from "next";
import { Suspense } from "react";

import { ListSkeleton } from "@/components/shared/list-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { routes } from "@/config/navigation";
import { NewOfferForm } from "@/features/offers/components/new-offer-form";
import { OffersList } from "@/features/offers/components/offers-list";
import { getGenericResumeOptions } from "@/features/resumes/queries";
import { getAiAvailability } from "@/lib/ai";
import { requireUser } from "@/lib/session";

const page = routes.offers;

export const metadata: Metadata = { title: page.title };

/** Laisse le temps à une analyse IA de se terminer. */
export const maxDuration = 60;

export default function OffersPage() {
  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <Suspense fallback={<ListSkeleton items={1} />}>
        <NewOfferSection />
      </Suspense>
      <Suspense fallback={<ListSkeleton items={1} />}>
        <OffersList />
      </Suspense>
    </>
  );
}

async function NewOfferSection() {
  const user = await requireUser();
  const [resumes, ai] = await Promise.all([getGenericResumeOptions(), getAiAvailability(user.id)]);
  return <NewOfferForm resumes={resumes} ai={ai} />;
}
