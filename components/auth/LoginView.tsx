"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import {
  AuthHeading,
  TextField,
  PasswordField,
  AuthButton,
  FormError,
} from "@/components/auth/ui";
import { useAppDispatch } from "@/lib/store/hooks";
import { landingFor } from "@/lib/store/features/authSlice";
import { startSession } from "@/lib/store/session";
import {
  getApiErrorMessage,
  getApiErrorStatus,
  useLoginMutation,
} from "@/lib/store/api";
import { clearFlow } from "@/lib/auth-flow";

export default function LoginView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  const bind = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);

    try {
      const result = await login({
        email: form.email.trim(),
        password: form.password,
        isRememberMe: remember,
      }).unwrap();

      clearFlow("signup");
      startSession(dispatch, { token: result.token, user: result.user });
      // A Super Admin has no league to open, so Avora Home would be an empty
      // screen for him. Everybody else picks a league first.
      router.push(landingFor(result.user));
    } catch (err) {
      // 403 means the account exists but was never verified. The otp screen
      // cannot be reached from here because its token only comes from
      // register, and re-registering an unverified email is allowed.
      setNeedsVerification(getApiErrorStatus(err) === 403);
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Login to Account!"
        subtitle="Please enter your email and password to continue."
      />

      <form onSubmit={handleSubmit}>
        <FormError message={error} />
        {needsVerification ? (
          <p className="mb-4 text-sm text-brand-muted">
            Sign up again with the same email to receive a new code.{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-cta hover:text-brand-cta-dark"
            >
              Go to sign up
            </Link>
          </p>
        ) : null}

        <TextField
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          {...bind("email")}
        />
        <PasswordField
          label="Password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          {...bind("password")}
        />

        <div className="mb-5 flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-brand-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-brand-border text-brand-cta focus:ring-brand-cta/30"
            />
            Remember password
          </label>
          <Link
            href="/forgot-password"
            className="font-medium text-brand-cta hover:text-brand-cta-dark"
          >
            Forget password?
          </Link>
        </div>

        <AuthButton type="submit" disabled={isLoading}>
          {isLoading ? "Signing in…" : "Sign in"}
        </AuthButton>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-brand-muted">Don&apos;t have an account?</p>
        <Link
          href="/register"
          className="mt-3 flex w-full items-center justify-center rounded-lg border border-brand-cta px-4 py-2.5 text-sm font-semibold text-brand-cta transition hover:bg-brand-cta hover:text-white"
        >
          Create Account
        </Link>
      </div>
    </AuthShell>
  );
}
