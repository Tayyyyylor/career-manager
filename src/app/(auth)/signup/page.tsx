import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthCard, AuthFormSkeleton } from "@/features/auth/components/auth-card";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Créer un compte"
      description="L'inscription nécessite un code d'invitation."
      footer={
        <p>
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      <Suspense fallback={<AuthFormSkeleton fields={4} />}>
        <SignUpGate />
      </Suspense>
    </AuthCard>
  );
}

async function SignUpGate() {
  if (await getCurrentUser()) redirect("/");
  return <SignUpForm />;
}
