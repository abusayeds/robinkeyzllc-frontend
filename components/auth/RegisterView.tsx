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
import { getApiErrorMessage, useRegisterMutation } from "@/lib/store/api";
import { saveFlowToken } from "@/lib/auth-flow";

export default function RegisterView() {
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({ discord: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const bind = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const email = form.email.trim();

    try {
      // The Discord username is what the account is displayed as, so it is
      // sent as the name. No phone is collected on this form.
      const result = await register({
        name: form.discord.trim(),
        email,
        password: form.password,
      }).unwrap();

      saveFlowToken("signup", result.token, email);
      router.push("/verify-otp?flow=signup");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Create Account!"
        subtitle="Please enter your email and password to continue."
      />

      <form onSubmit={handleSubmit}>
        <FormError message={error} />

        <TextField
          label="Discord username"
          required
          autoComplete="username"
          placeholder="Discord username"
          {...bind("discord")}
        />
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
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          {...bind("password")}
        />

        <p className="mb-5 text-xs text-brand-muted">
          We will email you a 6-digit code to confirm this address.
        </p>

        <AuthButton type="submit" disabled={isLoading}>
          {isLoading ? "Creating account…" : "Sign up"}
        </AuthButton>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-cta hover:text-brand-cta-dark"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
