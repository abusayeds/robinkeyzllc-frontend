"use client";

import { useEffect, useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import NumberField from "@/components/ui/NumberField";
import { getApiErrorMessage } from "@/lib/store/api";
import { useCreateTradeExceptionMutation } from "@/lib/store/api/endpoints/tradeApi";
import { money } from "@/lib/money";
import { useModalShell } from "@/lib/useModalShell";

type TeamOption = { id: number; name: string; abbr: string };

/** A year from today, which is what Rule 7.2 gives an exception by default. */
const defaultExpiry = () => {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
};

/**
 * Where a commissioner records a Traded Player Exception by hand.
 *
 * Article 7 creates one out of every trade processed in the app, and those
 * need nothing here. This is for the exceptions that came from somewhere
 * else — a league carried over mid-season, or a deal settled off the record —
 * which otherwise could not be entered at all, leaving a team short an asset
 * it really holds.
 */
export default function CreateTradeExceptionModal({
  open,
  leagueId,
  teams,
  onClose,
}: {
  open: boolean;
  leagueId: number;
  teams: TeamOption[];
  onClose: () => void;
}) {
  const [teamId, setTeamId] = useState<number | null>(null);
  const [amount, setAmount] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [create, { isLoading: saving }] = useCreateTradeExceptionMutation();

  // A fresh form each time it is opened.
  useEffect(() => {
    if (!open) return;
    setTeamId(teams[0]?.id ?? null);
    setAmount(0);
    setRemaining(0);
    setExpiresAt(defaultExpiry());
    setLabel("");
    setError(null);
  }, [open, teams]);

  useModalShell(open, onClose);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    if (teamId === null) {
      setError("Choose the team that holds this exception.");
      return;
    }
    if (amount <= 0) {
      setError("An exception has to be worth something.");
      return;
    }
    if (remaining > amount) {
      setError("An exception cannot have more left than it was worth.");
      return;
    }

    try {
      await create({
        leagueId,
        teamId,
        amount,
        // Left out means it starts at its full value, which is the usual case.
        remaining: remaining > 0 ? remaining : undefined,
        expiresAt: new Date(`${expiresAt}T00:00:00Z`).toISOString(),
        label: label.trim() || undefined,
      }).unwrap();
      onClose();
    } catch (e) {
      setError(getApiErrorMessage(e, "That exception could not be created."));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-3 sm:p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create a trade exception"
    >
      <div
        className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-card supports-[height:100dvh]:max-h-[88dvh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-border px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-brand-dark">
              Create Trade Exception
            </h2>
            <p className="mt-0.5 text-[11px] text-brand-muted">
              Article 7 — for an exception this app did not create itself.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Team
            </span>
            <select
              value={teamId ?? ""}
              onChange={(e) => setTeamId(Number(e.target.value))}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Amount
            </span>
            <NumberField
              value={amount}
              onChange={setAmount}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
            />
            <span className="mt-1 block text-[11px] text-brand-muted">
              {money(amount)} · Rule 7.1 sizes it from the salary the team sent
              out.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Remaining (optional)
            </span>
            <NumberField
              value={remaining}
              onChange={setRemaining}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
            />
            <span className="mt-1 block text-[11px] text-brand-muted">
              Left at zero it starts at its full value. Set it when part of the
              exception has already been used.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Expires
            </span>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
            />
            <span className="mt-1 block text-[11px] text-brand-muted">
              Rule 7.2 — a year from the trade that created it.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Label (optional)
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Porziņģis TPE"
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
            />
          </label>

          {error ? (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-brand-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Exception"}
          </button>
        </div>
      </div>
    </div>
  );
}
