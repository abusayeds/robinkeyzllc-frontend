"use client";

/**
 * The league settings pages read as "On / Off" in the client's spec, so the
 * switch carries that word itself instead of a separate Yes/No label beside it.
 */
export default function Toggle({
  checked,
  onChange,
  disabled,
  label,
  showState = true,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  showState?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {showState ? (
        <span
          aria-hidden
          className={`w-6 text-right text-[11px] font-bold uppercase tracking-wide transition-colors ${
            disabled
              ? "text-brand-muted/60"
              : checked
                ? "text-brand-cta-dark"
                : "text-brand-muted"
          }`}
        >
          {checked ? "On" : "Off"}
        </span>
      ) : null}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-cta/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked
            ? "border-brand-cta bg-brand-cta hover:bg-brand-cta-dark"
            : "border-brand-border bg-brand-soft hover:bg-brand-border"
        }`}
      >
        <span
          className={`pointer-events-none block h-[18px] w-[18px] rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ease-out ${
            checked ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
        />
      </button>
    </span>
  );
}
