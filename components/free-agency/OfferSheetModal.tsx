"use client";

import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import {
  BIRD_LABEL,
  type FreeAgent,
  type MyTeamBudget,
  type OfferInput,
} from "@/lib/store/api/endpoints/freeAgencyApi";
import NumberField from "@/components/ui/NumberField";
import { money, offerBreakdown, offerTotal, seasonLabel } from "./contract";

const CONTRACT_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "veteranMinimum", label: "Veteran Minimum" },
  { value: "rookieScale", label: "Rookie Scale" },
  { value: "supermax", label: "Supermax" },
  { value: "twoWay", label: "Two-Way" },
  { value: "nonGuaranteed", label: "Non-Guaranteed" },
  { value: "partiallyGuaranteed", label: "Partially Guaranteed" },
];

const SIGNED_VIA = [
  { value: "capSpace", label: "Cap Space" },
  { value: "nonTaxpayerMle", label: "Non-Taxpayer MLE" },
  { value: "taxpayerMle", label: "Taxpayer MLE" },
  { value: "roomMle", label: "Room MLE" },
  { value: "biAnnualException", label: "Bi-Annual Exception" },
  { value: "disabledPlayerException", label: "Disabled Player Exception" },
];

export default function OfferSheetModal({
  player,
  team,
  seasonStartYear,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  player: FreeAgent | null;
  team: MyTeamBudget | null;
  seasonStartYear: number;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (offer: OfferInput) => void;
}) {
  const existing = useMemo(
    () => player?.offers.find((offer) => offer.isMine) ?? null,
    [player],
  );

  const [years, setYears] = useState(1);
  const [firstYearSalary, setFirstYearSalary] = useState(0);
  const [raisePct, setRaisePct] = useState(0);
  const [contractType, setContractType] = useState("standard");
  const [signedVia, setSignedVia] = useState("capSpace");
  // Rule 10.1 — what each season is guaranteed for, by season index. Only read
  // for a partially guaranteed offer; the other types say it by their name.
  const [guarantees, setGuarantees] = useState<number[]>([]);

  // Reset whenever a different player is opened, and start from the offer this
  // team already has on him rather than from nothing.
  useEffect(() => {
    if (!player) return;
    setYears(existing?.years ?? 1);
    setFirstYearSalary(
      existing?.firstYearSalary ?? player.previousSalary ?? team?.minPlayerSalary ?? 0,
    );
    setRaisePct(existing?.raisePct ?? 0);
    setContractType(existing?.contractType ?? "standard");
    setSignedVia(existing?.signedVia ?? "capSpace");
    setGuarantees(existing?.guaranteedAmounts ?? []);
  }, [player, existing, team]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  const isTwoWay = contractType === "twoWay";
  const isPartial = contractType === "partiallyGuaranteed";

  const rows = useMemo(
    () =>
      offerBreakdown(
        isTwoWay ? 0 : firstYearSalary,
        raisePct,
        years,
        seasonStartYear,
        team?.salaryCap ?? 0,
      ),
    [firstYearSalary, raisePct, years, seasonStartYear, team, isTwoWay],
  );

  const total = offerTotal(rows);

  // Shown while typing so the form can warn early. The server runs the same
  // rules again on submit and its answer is the one that counts.
  const warnings = useMemo(() => {
    if (!team) return [];
    const list: string[] = [];
    if (isTwoWay) {
      if (team.twoWayCount >= team.maxTwoWay) {
        list.push(`All ${team.maxTwoWay} two-way slots are taken.`);
      }
      return list;
    }
    if (team.rosterCount >= team.maxRosterSize) {
      list.push(`The roster is full at ${team.maxRosterSize}.`);
    }
    if (team.salaryCap > 0) {
      if (firstYearSalary < team.minPlayerSalary) {
        list.push(`Below the league minimum of ${money(team.minPlayerSalary)}.`);
      }
      if (firstYearSalary > team.maxPlayerSalary) {
        list.push(`Above the maximum of ${money(team.maxPlayerSalary)}.`);
      }
      if (
        team.capSpace !== null &&
        firstYearSalary > team.capSpace &&
        signedVia === "capSpace"
      ) {
        list.push(
          `${money(firstYearSalary)} against ${money(team.capSpace)} of room — name an exception, or the offer will be flagged.`,
        );
      }
    }
    return list;
  }, [team, firstYearSalary, signedVia, isTwoWay]);

  if (!player) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-brand-dark/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="my-8 w-full max-w-lg rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-brand-border px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-brand-dark">
              {existing ? "Change your offer" : "Offer sheet"}
            </h2>
            <p className="text-xs text-brand-muted">
              {player.name}
              {player.position ? ` · ${player.position}` : ""} ·{" "}
              {player.faType} · {BIRD_LABEL[player.birdRights]}
              {player.faType === "RFA" && player.rightsTeam
                ? ` · ${player.rightsTeam.abbr} holds his rights`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                Years
              </span>
              <select
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-cta"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                Raises
              </span>
              <select
                value={raisePct}
                onChange={(e) => setRaisePct(Number(e.target.value))}
                disabled={isTwoWay || years === 1}
                className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-cta disabled:bg-brand-soft disabled:text-brand-muted"
              >
                {[0, 3, 4, 5, 6, 7, 8].map((value) => (
                  <option key={value} value={value}>
                    {value}% of year one
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
              First year salary
            </span>
            <div className="mt-1">
              <NumberField
                value={isTwoWay ? 0 : firstYearSalary}
                onChange={setFirstYearSalary}
                disabled={isTwoWay}
              />
            </div>
            {isTwoWay ? (
              <p className="mt-1 text-[11px] text-brand-muted">
                A two-way contract carries no salary and does not count against
                the cap.
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                Contract type
              </span>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-cta"
              >
                {CONTRACT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                Signed via
              </span>
              <select
                value={signedVia}
                onChange={(e) => setSignedVia(e.target.value)}
                disabled={isTwoWay}
                className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-cta disabled:bg-brand-soft disabled:text-brand-muted"
              >
                {SIGNED_VIA.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-[11px] text-brand-muted">
            Bird rights are applied automatically from his {player.birdYears}{" "}
            bird year{player.birdYears === 1 ? "" : "s"} and are not chosen here.
          </p>

          <div className="rounded-lg border border-brand-border">
            <table className="w-full text-sm">
              <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-3 py-2">Season</th>
                  <th className="px-3 py-2 text-right">Salary</th>
                  <th className="px-3 py-2 text-right">% of cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {rows.map((row) => (
                  <tr key={row.seasonStartYear}>
                    <td className="px-3 py-1.5 text-brand-muted">
                      {seasonLabel(row.seasonStartYear)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-brand-dark">
                      {money(row.salary)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-brand-muted">
                      {row.pctOfCap === null
                        ? "—"
                        : `${row.pctOfCap.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
                <tr className="bg-brand-soft/40 font-semibold">
                  <td className="px-3 py-1.5 text-brand-muted">Total</td>
                  <td className="px-3 py-1.5 text-right text-brand-dark">
                    {money(total)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Rule 10.1 — a partial guarantee is named season by season, so
              the inputs sit beside the salaries they are capped by. */}
          {isPartial ? (
            <div className="rounded-lg border border-brand-border p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                Guaranteed per season
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                What the team still owes him for that season if he is waived
                (Rule 10.14). Leave a season at zero to guarantee nothing.
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {rows.map((row, index) => (
                  <label key={row.seasonStartYear} className="block">
                    <span className="text-xs text-brand-muted">
                      {seasonLabel(row.seasonStartYear)} · of {money(row.salary)}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={row.salary}
                      step={100000}
                      value={guarantees[index] ?? 0}
                      onChange={(e) =>
                        setGuarantees((current) => {
                          // Sized to the salary rows, so changing the number
                          // of years cannot leave a stale season behind.
                          const next = rows.map(
                            (_, slot) => current[slot] ?? 0,
                          );
                          next[index] = Math.max(
                            0,
                            Math.min(row.salary, Number(e.target.value) || 0),
                          );
                          return next;
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-cta"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <ul className="space-y-1 rounded-lg bg-amber-50 px-3 py-2">
              {warnings.map((warning) => (
                <li
                  key={warning}
                  className="flex items-start gap-2 text-xs text-amber-700"
                >
                  <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-brand-border px-5 py-3">
          <p className="text-[11px] text-brand-muted">
            An offer that breaks a rule is still recorded, and flagged for the
            commissioner.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !team}
              onClick={() =>
                onSubmit({
                  leaguePlayerId: player.leaguePlayerId,
                  years,
                  firstYearSalary: isTwoWay ? 0 : firstYearSalary,
                  raisePct: isTwoWay ? 0 : raisePct,
                  contractType,
                  signedVia: isTwoWay ? "capSpace" : signedVia,
                  // Sent only when the type asks for it, and always one figure
                  // per season so the server's length check reads true.
                  guaranteedAmounts: isPartial
                    ? rows.map((_, index) => guarantees[index] ?? 0)
                    : undefined,
                })
              }
              className="rounded-lg bg-brand-cta px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Sending…" : existing ? "Update offer" : "Submit offer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
