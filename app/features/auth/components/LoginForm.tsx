"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/app/features/auth/schema";

function firstErrorMessage(errors: unknown[]): string | null {
  if (!errors.length) return null;
  const err = errors[0] as { message?: string } | string;
  return typeof err === "string" ? err : err.message ?? null;
}

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [formError, setFormError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp(value);
        if (error) {
          setFormError(error.message);
          return;
        }
        setCheckEmail(value.email);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword(value);
      if (error) {
        setFormError(error.message);
        return;
      }
      router.push("/");
      router.refresh();
    },
  });

  if (checkEmail) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-(family-name:--font-display) text-2xl font-medium text-ink">
          Check your email
        </h1>
        <p className="max-w-sm text-sm text-ink/60">
          We sent a confirmation link to {checkEmail}. Click it to finish setting up your
          account.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <h1 className="font-(family-name:--font-display) text-2xl font-medium text-ink">
        Bleed
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <form.Field name="email">
          {(field) => {
            const error = firstErrorMessage(field.state.meta.errors);
            return (
              <label className="flex flex-col gap-1 text-sm text-ink">
                Email
                <input
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
                />
                {error && <span className="text-xs text-rust">{error}</span>}
              </label>
            );
          }}
        </form.Field>

        <form.Field name="password">
          {(field) => {
            const error = firstErrorMessage(field.state.meta.errors);
            return (
              <label className="flex flex-col gap-1 text-sm text-ink">
                Password
                <input
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
                />
                {error && <span className="text-xs text-rust">{error}</span>}
              </label>
            );
          }}
        </form.Field>

        {formError && <p className="text-sm text-rust">{formError}</p>}

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-pine px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60"
            >
              {isSubmitting ? "…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          )}
        </form.Subscribe>

        {mode === "signin" && (
          <Link
            href="/forgot-password"
            className="text-center text-sm text-ink/50 underline decoration-ink/20 underline-offset-4 hover:text-ink/70"
          >
            Forgot password?
          </Link>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="text-sm text-ink/50 underline decoration-ink/20 underline-offset-4 hover:text-ink/70"
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </form>
    </div>
  );
}