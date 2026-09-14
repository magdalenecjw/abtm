"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error: string | null;
};

/**
 * Admin sign-in via Supabase Auth (technical-specifications.md §21).
 * Version 1 has exactly one admin role/account (§4) — this is a plain
 * email + password sign-in, not a self-service signup. The admin account
 * itself is created directly in the Supabase dashboard, not through app UI.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Deliberately generic — do not reveal whether the email exists,
    // consistent with the vague-error pattern used for the public
    // passcode gate (docs/workflows.md §3.2).
    return { error: "Incorrect email or password." };
  }

  redirect("/admin");
}