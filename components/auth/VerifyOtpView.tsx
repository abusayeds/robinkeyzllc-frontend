"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import {
  AuthHeading,
  AuthButton,
  FormError,
  FormNotice,
} from "@/components/auth/ui";
import {
  getApiErrorMessage,
  useResendEmailOtpMutation,
  useResendForgetOtpMutation,
  useVerifyEmailOtpMutation,
  useVerifyForgetOtpMutation,
} from "@/lib/store/api";
import {
  clearFlow,
  getFlowEmail,
  getFlowToken,
  saveResetStepToken,
  type AuthFlow,
} from "@/lib/auth-flow";

const LENGTH = 6;

export default function VerifyOtpView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow: AuthFlow = searchParams.get("flow") === "reset" ? "reset" : "signup";

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const [verifyEmail, { isLoading: isVerifyingEmail }] =
    useVerifyEmailOtpMutation();
  const [verifyForget, { isLoading: isVerifyingForget }] =
    useVerifyForgetOtpMutation();
  const [resendEmail, { isLoading: isResendingEmail }] =
    useResendEmailOtpMutation();
  const [resendForget, { isLoading: isResendingForget }] =
    useResendForgetOtpMutation();

  const isVerifying = isVerifyingEmail || isVerifyingForget;
  const isResending = isResendingEmail || isResendingForget;

  // sessionStorage is only readable in the browser, so the token is picked up
  // after mount rather than during render.
  useEffect(() => {
    const stored = getFlowToken(flow);
    setToken(stored);
    setEmail(getFlowEmail(flow));

    if (!stored) {
      setError(
        flow === "signup"
          ? "This verification link has expired. Please sign up again."
          : "This reset link has expired. Please request a new code.",
      );
    }
  }, [flow]);

  const code = digits.join("");

  function setDigit(index: number, value: string) {
    const typed = value.replace(/\D/g, "");
    if (!typed) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    // Pasting or fast typing can deliver several digits at once, so they are
    // spread across the remaining boxes instead of being thrown away.
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < typed.length && index + i < LENGTH; i += 1) {
        next[index + i] = typed[i];
      }
      return next;
    });

    const nextIndex = Math.min(index + typed.length, LENGTH - 1);
    inputs.current[nextIndex]?.focus();
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!token) {
      setError("No verification token found. Please start again.");
      return;
    }

    if (code.length !== LENGTH) {
      setError(`Please enter all ${LENGTH} digits.`);
      return;
    }

    try {
      if (flow === "signup") {
        await verifyEmail({ otp: code, token }).unwrap();
        clearFlow("signup");
        router.push("/account-created");
        return;
      }

      // Reset hands back a second token, and only that one is accepted by
      // reset-password.
      const result = await verifyForget({ otp: code, token }).unwrap();
      saveResetStepToken(result.token);
      router.push("/reset-password");
    } catch (err) {
      setError(getApiErrorMessage(err));
      setDigits(Array(LENGTH).fill(""));
      inputs.current[0]?.focus();
    }
  }

  async function handleResend() {
    setError(null);
    setNotice(null);

    if (!token) {
      setError("No verification token found. Please start again.");
      return;
    }

    try {
      if (flow === "signup") await resendEmail({ token }).unwrap();
      else await resendForget({ token }).unwrap();

      setNotice("A new code has been sent to your email.");
      setDigits(Array(LENGTH).fill(""));
      inputs.current[0]?.focus();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Verify OTP"
        subtitle={
          email
            ? `We have sent a 6-digit code to ${email}.`
            : "Please check your email. We have sent a code to your inbox."
        }
      />

      <form onSubmit={handleSubmit}>
        <FormError message={error} />
        <FormNotice message={notice} />

        <div className="mb-4 flex justify-center gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              value={digit}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={LENGTH}
              onChange={(e) => setDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-14 w-11 rounded-lg border border-brand-border bg-white text-center text-lg font-semibold text-brand-dark outline-none transition focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20"
            />
          ))}
        </div>

        <p className="mb-6 text-center text-sm text-brand-muted">
          Didn&apos;t receive code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || !token}
            className="font-medium text-brand-cta transition hover:text-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending ? "Sending…" : "Resend"}
          </button>
        </p>

        <AuthButton type="submit" disabled={isVerifying || !token}>
          {isVerifying ? "Verifying…" : "Verify"}
        </AuthButton>
      </form>
    </AuthShell>
  );
}
