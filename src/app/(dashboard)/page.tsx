import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { routes } from "@/config/navigation";
import {
  DashboardStats,
  DashboardStatsSkeleton,
} from "@/features/dashboard/components/dashboard-stats";
import {
  GettingStarted,
  GettingStartedSkeleton,
} from "@/features/dashboard/components/getting-started";
import { OfferAnalysisCta } from "@/features/dashboard/components/offer-analysis-cta";

const page = routes.dashboard;

export const metadata: Metadata = { title: page.title };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title={page.title} description={page.description} />

      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<GettingStartedSkeleton />}>
            <GettingStarted />
          </Suspense>
        </div>
        <OfferAnalysisCta />
      </div>
    </>
  );
}
