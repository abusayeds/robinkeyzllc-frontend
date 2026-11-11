"use client";

import { useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import { getApiErrorMessage } from "@/lib/store/api/baseApi";
import {
  useWaivePlayerMutation,
  useWaivePreviewQuery,
} from "@/lib/store/api/endpoints/rosterApi";

const money = (value: number) =>
  `$${Math.round(value).toLocaleString("en-US")}`;

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

/**
 * Rules 10.14 and 10.15 — what waiving him costs, and the stretch.
 *
 * The cost is asked for before anything is written, so the owner chooses
 * between two figures rather than finding out afterwards. The same arithmetic
 * runs on the server for the preview and the write, so the number on this
 * screen is the number that gets written.
 */
export default function WaiveModal({
  leagueId,
  teamId,
  leaguePlayerId,
  playerName,
  onClose,
  onDone,
}: {
  leagueId: number;
  teamId: number;
  /** Null closes the modal. */
  leaguePlayerId: number | null;
  playerName: string;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [stretch, setStretch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error: loadError,
  } = useWaivePreviewQuery(
    {
      leagueId,
      teamId,
      leaguePlayerId: leaguePlayerId as number,
    },
    { skip: leaguePlayerId === null },
  );

  const [waive, { isLoading: saving }] = useWaivePlayerMutation();

  if (leaguePlayerId === null) return null;

  const rows = stretch ? (data?.stretch ?? []) : (data?.straight ?? []);
  const owed = rows.reduce((sum, row) => sum + row.amount, 0);

  const confirm = async () => {
    setError(null);
    try {
      const result = await waive({
        leagueId,
        teamId,
        leaguePlayerId,
        stretch,
      }).unwrap();
      onDone(
        `${result.playerName} was waived. ${
          result.total > 0
            ? `${money(result.total)} of dead money${result.stretched ? ", stretched" : ""}.`
            : "No dead money."
        }`,
      );
      onClose();
    } catch (e) {
      setError(getApiErrorMessage(e, "That player could not be waived."));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Waive ${playerName}`}
    >
      <div
        className="my-8 w-full max-w-lg rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-brand-border px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-brand-dark">
              Waive {playerName}
            </h2>
            <p className="text-xs text-brand-muted">
              His guaranteed money stays on your books.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {isError ? (
            <p className="text-sm text-brand-muted">
              {getApiErrorMessage(
                loadError,
                "That cost could not be worked out.",
              )}
            </p>
          ) : isLoading || !data ? (
            <p className="text-sm text-brand-muted">Working out the cost…</p>
          ) : (
            <>
              {data.straightTotal === 0 ? (
                <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
                  Nothing on this contract is guaranteed from{" "}
                  {seasonLabel(data.seasonStartYear)} on, so waiving him leaves
                  no dead money.
                </p>
              ) : null}

              {/* Rule 10.15 — offered, with the reason when it is not
                  available, rather than a disabled switch that says nothing. */}
              {data.straightTotal > 0 ? (
                <div className="rounded-lg border border-brand-border px-3 py-2.5">
                  <label className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold text-brand-dark">
                        Stretch the money
                      </span>
                      <span className="block text-[11px] text-brand-muted">
                        {data.stretch
                          ? `Spread it over ${data.stretchYears} seasons instead of ${data.straight.length}.`
                          : (data.stretchBlockedReason ??
                            "Not available on this contract.")}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={stretch}
                      disabled={!data.stretch}
                      onChange={(e) => setStretch(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-border text-brand-cta focus:ring-brand-cta/30 disabled:opacity-40"
                    />
                  </label>
                </div>
              ) : null}

              {rows.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-muted">
                    Dead money
                  </p>
                  <ul className="divide-y divide-brand-border rounded-lg border border-brand-border">
                    {rows.map((row) => (
                      <li
                        key={row.seasonStartYear}
                        className="flex justify-between px-3 py-1.5 text-xs"
                      >
                        <span className="text-brand-dark">
                          {seasonLabel(row.seasonStartYear)}
                        </span>
                        <span className="text-brand-muted">
                          {money(row.amount)}
                        </span>
                      </li>
                    ))}
                    <li className="flex justify-between bg-brand-soft/40 px-3 py-1.5 text-xs font-semibold">
                      <span className="text-brand-dark">Total</span>
                      <span className="text-brand-dark">{money(owed)}</span>
                    </li>
                  </ul>
                </div>
              ) : null}

              <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {/* Rule 10.13 is not built: there is no waiver priority
                    setting yet, so nobody can claim him and the step that
                    would reset his bird years (Rule 9.5) has not happened. */}
                <span>
                  He leaves your roster and is marked waived. Waiver claims are
                  not open yet, so his bird years stay as they are until he
                  clears.
                </span>
              </div>

              {error ? <p className="text-xs text-red-500">{error}</p> : null}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={saving || isLoading || !data}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {saving ? "Waiving…" : "Waive player"}
          </button>
        </div>
      </div>
    </div>
  );
}
