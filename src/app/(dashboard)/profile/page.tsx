import type { Metadata } from "next";
import { Suspense } from "react";

import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ImportFromCvLink } from "@/components/shared/import-from-cv-link";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { routes } from "@/config/navigation";
import { PasswordForm } from "@/features/profile/components/password-form";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { getProfile } from "@/features/profile/queries";
import type { ProfileInput } from "@/features/profile/schemas";
import { requireUser } from "@/lib/session";

const page = routes.profile;

export const metadata: Metadata = { title: page.title };

export default function ProfilePage() {
  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <Suspense fallback={<ListSkeleton items={3} />}>
        <ProfileSection />
      </Suspense>
    </>
  );
}

async function ProfileSection() {
  const [user, profile] = await Promise.all([requireUser(), getProfile()]);

  const defaultValues: ProfileInput = {
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    headline: profile?.headline ?? "",
    summary: profile?.summary ?? "",
    email: profile?.email ?? user.email,
    phone: profile?.phone ?? "",
    location: profile?.location ?? "",
    websiteUrl: profile?.websiteUrl ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    githubUrl: profile?.githubUrl ?? "",
    scoreScale: profile?.scoreScale === 20 ? "20" : "100",
  };

  return (
    <div className="grid gap-4">
      {!profile ? (
        <Card size="sm" className="flex-row flex-wrap items-center justify-between gap-3 px-(--card-spacing)">
          <p className="text-sm text-muted-foreground">
            Gagne du temps : ton nom, tes coordonnées et ton parcours peuvent être lus dans ton CV.
          </p>
          <ImportFromCvLink />
        </Card>
      ) : null}
      <ProfileForm defaultValues={defaultValues} />
      <PasswordForm accountEmail={user.email} />
    </div>
  );
}
