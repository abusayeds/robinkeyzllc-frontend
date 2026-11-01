"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import {
  AuthHeading,
  PasswordField,
  AuthButton,
  FormError,
} from "@/components/auth/ui";
import { getApiErrorMessage, useResetPasswordMutation } from "@/lib/store/api";
import { clearFlow, getResetStepToken } from "@/lib/auth-flow";

export default function ResetPasswordView() {
  const router = useRouter();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bind = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  // This is the second reset token, the one verifying the otp returned. The
  // token from forget-password is not accepted here.
  useEffect(() => {
    const stored = getResetStepToken();
    setToken(stored);

    if (!stored) {
      setError("This reset link has expired. Please request a new code.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link has expired. Please request a new code.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPassword({
        password: form.password,
        confirmPassword: form.confirm,
        token,
      }).unwrap();

      clearFlow("reset");
      router.push("/login");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Set new password"
        subtitle="Your new password must be different from previously used passwords."
      />

      <form onSubmit={handleSubmit}>
        <FormError message={error} />

        <PasswordField
          label="New Password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          {...bind("password")}
        />
        <PasswordField
          label="Confirm New Password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="••••••••"
          {...bind("confirm")}
        />

        <AuthButton type="submit" disabled={isLoading || !token}>
          {isLoading ? "Saving…" : "Confirm"}
        </AuthButton>
      </form>

      {!token ? (
        <p className="mt-6 text-center text-sm text-brand-muted">
          <Link
            href="/forgot-password"
            className="font-semibold text-brand-cta hover:text-brand-cta-dark"
          >
            Request a new code
          </Link>
        </p>
      ) : null}
    </AuthShell>
  );
}
