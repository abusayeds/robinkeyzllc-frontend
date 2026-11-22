"use client";

import { FiAlertTriangle, FiX } from "react-icons/fi";
import type { TradeEvaluation } from "@/lib/store/api/endpoints/tradeApi";
import { useModalShell } from "@/lib/useModalShell";

export default function ConfirmTradeModal({
  open,
  evaluation,
  recipients,
  message,
  busy,
  error,
  onMessage,
  onClose,
  onConfirm,
}: {
  open: boolean;
  evaluation: TradeEvaluation | null;
  /** The other teams, who have to reply. */
  recipients: string[];
  message: string;
  busy: boolean;
  error: string | null;
  onMessage: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useModalShell(open, onClose);

  if (!open) return null;

  const failed = (evaluation?.checks ?? []).filter((check) => !check.pass);
  const legal = evaluation ? failed.length === 0 : false;
  const partnerCount = recipients.length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm trade"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-card supports-[height:100dvh]:max-h-[85dvh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="text-sm font-bold text-brand-dark">Confirm Trade</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="text-sm text-brand-dark">
            Submit this trade offer to{" "}
            <span className="font-semibold">
              {partnerCount} {partnerCount === 1 ? "team" : "teams"}
            </span>
            ?
          </p>

          <p
            className={`mt-2 text-xs font-semibold ${
              legal ? "text-brand-cta-dark" : "text-red-500"
            }`}
          >
            {legal
              ? "All teams remain cap-compliant."
              : `Warning: ${failed.length} rule${failed.length === 1 ? "" : "s"} would stop this trade. It will be recorded either way, and the commissioner can see why it failed.`}
          </p>

          {failed.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {failed.map((check, index) => (
                <li
                  key={`${check.label}-${index}`}
                  className="text-xs text-red-600"
                >
                  {check.label}
                  {check.detail ? ` — ${check.detail}` : ""}
                </li>
              ))}
            </ul>
          ) : null}

          <input
            value={message}
            onChange={(e) => onMessage(e.target.value)}
            placeholder="A note to the other team (optional)"
            className="mt-3 w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
          />

          {error ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-brand-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            // An illegal trade cannot be submitted from here either. The
            // builder already keeps this modal shut for one, but the button
            // that actually sends it should not depend on that being true.
            disabled={busy || !legal}
            title={
              legal ? undefined : "This trade breaks a rule and cannot be sent."
            }
            className="flex-1 rounded-lg bg-brand-cta px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Sending…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
