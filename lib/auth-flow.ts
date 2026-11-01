"use client";

// The register and forget-password flows each hand back a short-lived token
// that only the next step of that same flow accepts. It is kept in
// sessionStorage, not in the store: it must not outlive the tab, and it is not
// a session.

export type AuthFlow = "signup" | "reset";

const KEYS: Record<AuthFlow, string> = {
  signup: "avora.flow.signup",
  reset: "avora.flow.reset",
};

const EMAIL_KEYS: Record<AuthFlow, string> = {
  signup: "avora.flow.signup.email",
  reset: "avora.flow.reset.email",
};

const RESET_STEP_KEY = "avora.flow.reset.step2";

const read = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // private mode or blocked storage — the flow then fails on the next step
    // with a clear 401 instead of silently breaking here.
  }
};

export const saveFlowToken = (flow: AuthFlow, token: string, email?: string) => {
  write(KEYS[flow], token);
  if (email) write(EMAIL_KEYS[flow], email);
};

export const getFlowToken = (flow: AuthFlow) => read(KEYS[flow]);

export const getFlowEmail = (flow: AuthFlow) => read(EMAIL_KEYS[flow]);

export const clearFlow = (flow: AuthFlow) => {
  write(KEYS[flow], null);
  write(EMAIL_KEYS[flow], null);
  if (flow === "reset") write(RESET_STEP_KEY, null);
};

// Reset uses two different tokens: the one from forget-password, then the one
// that verifying the otp returns. Only the second may change the password.
export const saveResetStepToken = (token: string) =>
  write(RESET_STEP_KEY, token);

export const getResetStepToken = () => read(RESET_STEP_KEY);
