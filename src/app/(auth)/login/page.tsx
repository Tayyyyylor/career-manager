import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthCard, AuthFormSkeleton } from "@/features/auth/components/auth-card";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard
      title="Connexion"
      description="Accède à ton espace Career Manager."
      footer={
        <p>
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Créer un compte
          </Link>
        </p>
      }
    >
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginForm({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  if (await getCurrentUser()) redirect("/");
  const { next } = await searchParams;
  return <SignInForm next={typeof next === "string" ? next : undefined} />;
}
