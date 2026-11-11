"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { getApiErrorMessage } from "@/lib/store/api/baseApi";
import {
  useExtensionLimitsQuery,
  useOfferExtensionMutation,
} from "@/lib/store/api/endpoints/rosterApi";

const money = (value: number) =>
  `$${Math.round(value).toLocaleString("en-US")}`;

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

const parseMoney = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
};

type Year = {
  seasonStartYear: number;
  salary: number;
  optionType: "player" | "team" | null;
};

/**
 * Rules 10.7 and 10.8 — offering an extension.
 *
 * The owner names the first-year salary, which is what the rule book asks of
 * them: Rules 10.7 and 10.8 say the figure comes from "the owner's ranking
 * input", and Appendix B item 7 records those detailed rules as still to be
 * defined. So the ceiling is enforced and the number is theirs to choose. The
 * "Rank" field the mock carried is left out until the client specifies what it
 * does — a box that changes nothing is worse than no box.
 */
export default function ExtensionModal({
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
  const [years, setYears] = useState<Year[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error: loadError,
  } = useExtensionLimitsQuery(
    { leagueId, teamId, leaguePlayerId: leaguePlayerId as number },
    { skip: leaguePlayerId === null },
  );

  const [offer, { isLoading: saving }] = useOfferExtensionMutation();

  const limits = data?.eligible ? data.limits : null;

  // Opens at the longest legal deal, every year at the ceiling: the most the
  // rule book allows, which is the offer an owner is most likely to start from
  // and edit down.
  useEffect(() => {
    if (!limits) return;
    setTouched(false);
    setYears(
      Array.from({ length: limits.maxSeasons }, (_, index) => ({
        seasonStartYear: limits.firstSeasonStartYear + index,
        salary: limits.maxFirstYear,
        optionType: null,
      })),
    );
  }, [limits]);

  const total = useMemo(
    () => years.reduce((sum, year) => sum + year.salary, 0),
    [years],
  );

  /**
   * The same checks the server runs, so the button says no before the request
   * does. The server stays the authority — this only saves a round trip.
   */
  const problems = useMemo(() => {
    if (!limits || years.length === 0) return [];
    const found: string[] = [];

    const first = years[0].salary;
    if (first <= 0) found.push("The first season needs a salary.");
    if (first > limits.maxFirstYear) {
      found.push(
        `The first season may not exceed ${money(limits.maxFirstYear)}.`,
      );
    }

    const step = Math.round((first * (limits.bird === "none" ? 5 : 8)) / 100);
    for (let index = 1; index < years.length; index += 1) {
      if (Math.abs(years[index].salary - years[index - 1].salary) > step + 1) {
        found.push(`Rule 10.5 limits each year's change to ${money(step)}.`);
        break;
      }
    }

    if (years.some((year) => year.salary > limits.maximumSalary)) {
      found.push(`No season may exceed ${money(limits.maximumSalary)}.`);
    }

    if (years.slice(0, -1).some((year) => year.optionType !== null)) {
      found.push("Rule 10.6 allows an option on the final year only.");
    }

    return found;
  }, [years, limits]);

  if (leaguePlayerId === null) return null;

  const setLength = (length: number) => {
    if (!limits) return;
    setTouched(true);
    setYears((prev) =>
      Array.from({ length }, (_, index) => ({
        seasonStartYear: limits.firstSeasonStartYear + index,
        salary: prev[index]?.salary ?? prev[0]?.salary ?? limits.maxFirstYear,
        optionType: prev[index]?.optionType ?? null,
      })),
    );
  };

  const submit = async () => {
    setError(null);
    try {
      const result = await offer({
        leagueId,
        teamId,
        leaguePlayerId,
        years,
      }).unwrap();
      onDone(
        `${result.playerName} was extended for ${result.contract.years.length} season${
          result.contract.years.length === 1 ? "" : "s"
        }, ${money(result.total)} in total.`,
      );
      onClose();
    } catch (e) {
      setError(getApiErrorMessage(e, "That extension could not be offered."));
    }
  };

  const legal = problems.length === 0 && years.length > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Offer an extension to ${playerName}`}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-brand-border px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-brand-dark">
              Offer Extension · {data?.playerName ?? playerName}
            </h2>
            {data?.eligible ? (
              <p className="text-xs text-brand-muted">
                Starts {seasonLabel(data.limits.firstSeasonStartYear)}, after
                his current deal ends in{" "}
                {seasonLabel(data.current.endSeasonStartYear)}.
              </p>
            ) : null}
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
              {getApiErrorMessage(loadError, "This could not be loaded.")}
            </p>
          ) : isLoading || !data ? (
            <p className="text-sm text-brand-muted">Working out the limits…</p>
          ) : !data.eligible ? (
            // The reason, not a disabled form: an owner needs to know whether
            // to come back next season or never.
            <p className="rounded-lg bg-brand-soft px-3 py-2.5 text-sm text-brand-dark">
              {data.blockedReason}
            </p>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <Fact
                  label="Current final season"
                  value={money(data.current.finalSeasonSalary)}
                />
                <Fact
                  label="Max first season"
                  value={money(data.limits.maxFirstYear)}
                  note={data.limits.maxFirstYearBasis}
                />
                <Fact
                  label="Bird rights"
                  value={
                    data.limits.bird === "full"
                      ? "Full Bird"
                      : data.limits.bird === "early"
                        ? "Early Bird"
                        : "Non-Bird"
                  }
                  note={`Rule 10.5 — ${data.limits.bird === "none" ? "5%" : "8%"} raises`}
                />
              </div>

              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                  Seasons
                </span>
                <select
                  value={years.length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-cta"
                >
                  {Array.from(
                    { length: data.limits.maxSeasons },
                    (_, index) => index + 1,
                  ).map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "season" : "seasons"}
                    </option>
                  ))}
                </select>
              </label>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase text-brand-muted">
                      <th className="text-left font-semibold">Season</th>
                      <th className="text-left font-semibold">Salary</th>
                      <th className="text-right font-semibold">% of cap</th>
                      <th className="text-right font-semibold">Option</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {years.map((year, index) => (
                      <tr key={year.seasonStartYear}>
                        <td className="py-2 text-brand-dark">
                          {seasonLabel(year.seasonStartYear)}
                        </td>
                        <td className="py-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={year.salary > 0 ? money(year.salary) : ""}
                            placeholder="$0"
                            onChange={(e) => {
                              setTouched(true);
                              const next = parseMoney(e.target.value);
                              setYears((prev) =>
                                prev.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? { ...row, salary: next }
                                    : row,
                                ),
                              );
                            }}
                            className="w-36 rounded border border-brand-border px-2 py-1 text-xs outline-none focus:border-brand-cta"
                          />
                        </td>
                        <td className="py-2 text-right text-brand-muted">
                          {data.limits.maximumSalary > 0
                            ? `${((year.salary / data.limits.maximumSalary) * 100).toFixed(1)}% of max`
                            : "—"}
                        </td>
                        <td className="py-2 text-right">
                          {/* Rule 10.6 — only the final year can carry one. */}
                          {index === years.length - 1 ? (
                            <select
                              value={year.optionType ?? ""}
                              onChange={(e) => {
                                setTouched(true);
                                const value = e.target.value;
                                setYears((prev) =>
                                  prev.map((row, rowIndex) =>
                                    rowIndex === index
                                      ? {
                                          ...row,
                                          optionType:
                                            value === "player" ||
                                            value === "team"
                                              ? value
                                              : null,
                                        }
                                      : row,
                                  ),
                                );
                              }}
                              className="rounded border border-brand-border px-1.5 py-1 text-xs outline-none focus:border-brand-cta"
                            >
                              <option value="">None</option>
                              <option value="player">Player option</option>
                              <option value="team">Team option</option>
                            </select>
                          ) : (
                            <span className="text-brand-border">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-brand-soft/40 font-semibold text-brand-dark">
                      <td className="py-2">Total</td>
                      <td className="py-2">{money(total)}</td>
                      <td
                        className="py-2 text-right text-brand-muted"
                        colSpan={2}
                      >
                        {years.length > 0
                          ? `AAV ${money(total / years.length)}`
                          : ""}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div
                className={`rounded-lg border p-3 ${
                  legal
                    ? "border-brand-cta/30 bg-brand-cta/5"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <p
                  className={`flex items-center gap-1.5 text-sm font-bold ${
                    legal ? "text-brand-cta-dark" : "text-red-600"
                  }`}
                >
                  {legal ? <FiCheck className="h-4 w-4" /> : null}
                  {legal ? "Offer is legal" : "Offer is not legal"}
                </p>
                {problems.length > 0 && touched ? (
                  <ul className="mt-1.5 space-y-1">
                    {problems.map((problem) => (
                      <li key={problem} className="text-[11px] text-red-600">
                        {problem}
                      </li>
                    ))}
                  </ul>
                ) : null}
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
          {data?.eligible ? (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!legal || saving}
              className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
            >
              {saving ? "Offering…" : "Offer extension"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-brand-border px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </p>
      <p className="text-sm font-bold text-brand-dark">{value}</p>
      {note ? <p className="text-[10px] text-brand-muted">{note}</p> : null}
    </div>
  );
}
