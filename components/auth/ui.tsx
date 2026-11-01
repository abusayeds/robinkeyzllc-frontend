"use client";

import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
      {subtitle ? (
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-brand-muted">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

const fieldClass =
  "w-full rounded-lg border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-dark outline-none transition placeholder:text-brand-muted/70 focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({ label, id, ...props }: TextFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="mb-4">
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-brand-dark"
      >
        {label}
      </label>
      <input id={inputId} className={fieldClass} {...props} />
    </div>
  );
}

export function PasswordField({ label, id, ...props }: TextFieldProps) {
  const [show, setShow] = useState(false);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="mb-4">
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-brand-dark"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={show ? "text" : "password"}
          className={`${fieldClass} pr-10`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted transition hover:text-brand-dark"
        >
          {show ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function AuthButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="w-full rounded-lg bg-brand-cta px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
    >
      {message}
    </p>
  );
}

export function FormNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
      {message}
    </p>
  );
}
