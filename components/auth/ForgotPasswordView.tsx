"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import {
  AuthHeading,
  TextField,
  AuthButton,
  FormError,
} from "@/components/auth/ui";
import { getApiErrorMessage, useForgetPasswordMutation } from "@/lib/store/api";
import { saveFlowToken } from "@/lib/auth-flow";

export default function ForgotPasswordView() {
  const router = useRouter();
  const [forgetPassword, { isLoading }] = useForgetPasswordMutation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();

    try {
      const result = await forgetPassword({ email: trimmed }).unwrap();
      saveFlowToken("reset", result.token, trimmed);
      router.push("/verify-otp?flow=reset");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Forget password"
        subtitle="Enter your email address to get a verification code for resetting your password."
      />

      <form onSubmit={handleSubmit}>
        <FormError message={error} />

        <TextField
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthButton type="submit" disabled={isLoading}>
          {isLoading ? "Sending code…" : "Send OTP"}
        </AuthButton>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted">
        Remember your password?{" "}
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
