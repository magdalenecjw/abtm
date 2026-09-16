"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <div>
        <label htmlFor="email" className="text-sm block mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          disabled={pending}
          className="search-input"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm block mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={pending}
          className="search-input"
        />
      </div>
      {state.error && (
        <p className="text-sm text-[var(--terracotta)]" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="primary-button self-start">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}