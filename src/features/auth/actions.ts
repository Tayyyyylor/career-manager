"use server";

import { APIError } from "better-auth/api";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  safeRedirectPath,
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/features/auth/schemas";
import { failure, parseInput, type ActionResult } from "@/lib/action-result";
import { auth, INVITE_CODE_HEADER } from "@/lib/auth";

export async function signIn(
  input: SignInInput,
  next?: string,
): Promise<ActionResult<never>> {
  const parsed = parseInput(signInSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return failure("Email ou mot de passe incorrect.");
    }
    throw error;
  }

  redirect(safeRedirectPath(next) as Route);
}

export async function signUp(input: SignUpInput): Promise<ActionResult<never>> {
  const parsed = parseInput(signUpSchema, input);
  if (!parsed.ok) return parsed.result;

  const requestHeaders = new Headers(await headers());
  requestHeaders.set(INVITE_CODE_HEADER, parsed.data.inviteCode);

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: requestHeaders,
    });
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === "FORBIDDEN") {
        return failure("Code d'invitation invalide.", {
          inviteCode: ["Code d'invitation invalide."],
        });
      }
      if (error.status === "UNPROCESSABLE_ENTITY") {
        return failure("Un compte existe déjà avec cette adresse email.", {
          email: ["Un compte existe déjà avec cette adresse email."],
        });
      }
      return failure(error.message || "Impossible de créer le compte.");
    }
    throw error;
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
