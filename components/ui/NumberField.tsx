"use client";

import { useEffect, useState } from "react";

/**
 * A numeric text input that doesn't snap to "0" while the user is mid-edit.
 * Native number/controlled-text inputs bound directly to a numeric value
 * force the field to "0" the instant it's cleared, so new digits get typed
 * after that stuck zero (e.g. "0" + "5" -> "05"). This buffers the raw text
 * locally so an empty field stays empty.
 *
 * The value is still reported on every keystroke. Reporting it only on blur
 * meant a Save button gated on "has anything changed" was still disabled when
 * the user clicked it straight after typing: the click landed on a disabled
 * button, was swallowed, and the edit appeared to do nothing until a second
 * click. Clamping and re-formatting stay on blur.
 */
export default function NumberField({
  value,
  onChange,
  min = 0,
  className,
  formatter,
  parser,
  placeholder,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  className?: string;
  formatter?: (v: number) => string;
  parser?: (raw: string) => number;
  placeholder?: string;
  disabled?: boolean;
}) {
  const format = formatter ?? ((v: number) => String(v));
  const parse =
    parser ?? ((raw: string) => Number(raw.replace(/[^0-9]/g, "")) || 0);
  const [text, setText] = useState(format(value));

  // Only re-format from the outside when the incoming value is genuinely
  // different from what is on screen. Rewriting it after our own keystroke
  // would reformat mid-typing and throw the caret to the end.
  useEffect(() => {
    setText((current) => (parse(current) === value ? current : format(value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        // An empty field is mid-edit, not a zero.
        if (!raw.trim()) return;
        const parsed = parse(raw);
        if (parsed !== value) onChange(parsed);
      }}
      onBlur={() => {
        const parsed = Math.max(min, parse(text));
        setText(format(parsed));
        if (parsed !== value) onChange(parsed);
      }}
      className={
        className ??
        "w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta disabled:bg-brand-soft disabled:text-brand-muted"
      }
    />
  );
}
