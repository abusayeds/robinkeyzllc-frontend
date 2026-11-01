// The My Team contract editor, still on mock data.
//
// The client asked for Edit Contract and Free Agency - Submit Offer to be the
// same page. Free Agency now runs on the real API and this one does not, so
// they are apart for as long as My Team stays mock. Merging them back is part
// of wiring My Team, not a second decision.

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FiCheck, FiHelpCircle, FiX } from "react-icons/fi";
import type { FreeAgent } from "@/lib/store/features/freeAgencySlice";
import {
  FIRST_APRON_LINE,
  SALARY_CAP,
  SECOND_APRON_LINE,
  TAX_LINE,
  type LeagueTeam,
} from "@/lib/store/features/leagueSlice";
import { maxFirstYear, moneyFull, salaryBreakdown } from "./extension-contract";

const TERMS = [
  "Player Option",
  "Team Option",
  "No Trade Clause",
  "Partial Guarantee",
] as const;

const CONTRACT_TYPES = [
  "Standard NBA Contract",
  "Rookie Scale Contract",
  "Veteran Minimum Contract",
  "Supermax Contract",
  "Two-Way Contract",
  "Non-Guaranteed Contract",
  "Partially Guaranteed Contract",
] as const;

const SALARY_EXCEPTIONS = [
  "None",
  "Non-Taxpayer Mid-Level Exception (NTMLE)",
  "Taxpayer Mid-Level Exception (TMLE)",
  "Room Mid-Level Exception (Room MLE)",
  "Bi-Annual Exception (BAE)",
  "Disabled Player Exception (DPE)",
] as const;

/** Salary breakdown inputs store millions internally; show/accept full dollars. */
function dollarInputValue(millions: number) {
  const dollars = Math.round(millions * 1_000_000);
  return dollars > 0 ? `$${dollars.toLocaleString()}` : "";
}

function parseDollarInput(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits) / 1_000_000 : 0;
}

const STAT_COLS = [
  { key: "fgPct", label: "FG%" },
  { key: "pts", label: "PTS" },
  { key: "threes", label: "3PM" },
  { key: "ftPct", label: "FT%" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "to", label: "TO" },
] as const;

function MiniTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-brand-border px-2.5 py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </p>
      <p className={`text-xs font-bold ${tone}`}>{value}</p>
    </div>
  );
}

export default function ExtensionOfferModal({
  agent,
  team,
  mode = "signing",
  onClose,
  onSubmit,
}: {
  agent: FreeAgent | null;
  team: LeagueTeam;
  mode?: "signing" | "extension" | "edit";
  onClose: () => void;
  onSubmit: (input: {
    years: number;
    aav: number;
    total: number;
    teamOption: boolean;
  }) => void;
}) {
  const isExtension = mode === "extension";
  const isEdit = mode === "edit";
  const isSigning = mode === "signing";
  const [modalTab, setModalTab] = useState<"details" | "history">("details");
  const [years, setYears] = useState(3);
  const [salaries, setSalaries] = useState<number[]>([]);
  const [useMax, setUseMax] = useState(false);
  const [terms, setTerms] = useState<Set<string>>(new Set());
  const [contractType, setContractType] = useState<string>(CONTRACT_TYPES[0]);
  const [salaryException, setSalaryException] = useState<string>(
    SALARY_EXCEPTIONS[0]
  );

  useEffect(() => {
    if (!agent) return;
    setModalTab("details");
    setYears(agent.askingYears);
    setSalaries(
      salaryBreakdown(agent.askingAav, agent.askingYears, agent.age).map(
        (r) => r.salary
      )
    );
    setUseMax(false);
    setTerms(new Set());
    setContractType(CONTRACT_TYPES[0]);
    setSalaryException(SALARY_EXCEPTIONS[0]);
  }, [agent]);

  useEffect(() => {
    if (!agent) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [agent, onClose]);

  const changeYears = (next: number) => {
    if (!agent) return;
    setYears(next);
    const base = useMax
      ? maxFirstYear(agent.age)
      : salaries[0] ?? agent.askingAav;
    setSalaries(salaryBreakdown(base, next, agent.age).map((r) => r.salary));
  };

  const toggleMax = () => {
    if (!agent) return;
    const next = !useMax;
    setUseMax(next);
    const base = next ? maxFirstYear(agent.age) : agent.askingAav;
    setSalaries(salaryBreakdown(base, years, agent.age).map((r) => r.salary));
  };

  const total = useMemo(
    () => Number(salaries.reduce((s, v) => s + v, 0).toFixed(1)),
    [salaries]
  );
  const aav = years ? Number((total / years).toFixed(1)) : 0;

  const newPayroll = team.payroll + (salaries[0] ?? 0);
  const impact = [
    { label: "Team Salary", value: newPayroll, betterLower: true },
    { label: "Cap Space", value: SALARY_CAP - newPayroll, betterLower: false },
    { label: "1st Apron", value: FIRST_APRON_LINE - newPayroll, betterLower: false },
    { label: "2nd Apron", value: SECOND_APRON_LINE - newPayroll, betterLower: false },
    { label: "Luxury Tax", value: TAX_LINE - newPayroll, betterLower: false },
  ];

  const rosterOk = team.rosterCount < team.rosterMax;
  const lengthOk = years >= 1 && years <= 5;
  const raisesOk = salaries.every(
    (v, i) => i === 0 || v >= salaries[i - 1] * 0.9
  );
  const maxOk = agent ? salaries[0] <= maxFirstYear(agent.age) + 0.1 : true;
  const legal = rosterOk && lengthOk && raisesOk;

  if (!agent) return null;

  const checks = [
    { label: "Salary cap rules satisfied", ok: true },
    { label: "Max contract rules satisfied", ok: maxOk },
    { label: "Raise limits satisfied", ok: raisesOk },
    { label: "Contract length valid", ok: lengthOk },
    { label: "Valid Signing Method", ok: true },
  ];

  const headerTiles = [
    {
      label: "Team Salary",
      value: moneyFull(team.payroll),
      tone: "text-brand-dark",
    },
    {
      label: "Cap Space",
      value: moneyFull(SALARY_CAP - team.payroll),
      tone: SALARY_CAP - team.payroll < 0 ? "text-red-500" : "text-brand-cta-dark",
    },
    {
      label: "1st Apron",
      value: moneyFull(FIRST_APRON_LINE - team.payroll),
      tone:
        FIRST_APRON_LINE - team.payroll < 0
          ? "text-red-500"
          : "text-brand-cta-dark",
    },
    {
      label: "2nd Apron",
      value: moneyFull(SECOND_APRON_LINE - team.payroll),
      tone:
        SECOND_APRON_LINE - team.payroll < 0
          ? "text-red-500"
          : "text-brand-cta-dark",
    },
    {
      label: "Luxury Tax",
      value: moneyFull(TAX_LINE - team.payroll),
      tone: TAX_LINE - team.payroll < 0 ? "text-red-500" : "text-brand-cta-dark",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${isEdit ? "Edit contract" : isExtension ? "Offer extension" : "Offer sheet"} for ${agent.name}`}
    >
      <div
        className="flex max-h-[94vh] supports-[height:100dvh]:max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="text-sm font-bold text-brand-dark">
            {isEdit ? "Edit Contract" : isExtension ? "Offer Extension" : "Offer Sheet"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-brand-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-brand-forest">
              <Image
                src="/image/randomuser.jpg"
                alt={agent.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </span>
            <div>
              <p className="text-base font-bold text-brand-dark">{agent.name}</p>
              <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-brand-muted">
                {agent.position} · {agent.age} years old
                <span className="flex items-center gap-1 rounded bg-brand-cta/10 px-1.5 py-0.5 font-semibold text-brand-cta-dark">
                  <span className="h-1 w-1 rounded-full bg-brand-cta" />
                  {agent.faType}
                </span>
                <span className="rounded bg-brand-soft px-1.5 py-0.5 font-medium text-brand-muted">
                  Bird Yrs: {agent.birdYears}
                </span>
                <span className="rounded bg-brand-soft px-1.5 py-0.5 font-medium text-brand-muted">
                  {agent.experience} EXP
                </span>
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                {STAT_COLS.map((s) => (
                  <span key={s.key} className="text-center">
                    <span className="block text-[9px] font-semibold uppercase text-brand-muted">
                      {s.label}
                    </span>
                    <span className="font-semibold text-brand-dark">
                      {(agent[s.key] as number).toFixed(1)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {isEdit
              ? null
              : headerTiles.map((t) => <MiniTile key={t.label} {...t} />)}
          </div>
        </div>

        <div className="flex gap-1 border-b border-brand-border px-5">
          {(
            [
              ["details", "Offer Details"],
              ["history", "Previous Contracts"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setModalTab(key)}
              className={`relative px-2 py-2.5 text-sm transition ${
                modalTab === key
                  ? "font-semibold text-brand-cta-dark"
                  : "font-medium text-brand-muted hover:text-brand-dark"
              }`}
            >
              {label}
              {modalTab === key ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-cta" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {modalTab === "history" ? (
            <p className="p-8 text-center text-sm text-brand-muted">
              No previous contracts on record.
            </p>
          ) : (
            <div className="grid gap-5 p-5 lg:grid-cols-[1.3fr_1fr]">
              <div className="min-w-0 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                      Contract Type
                    </span>
                    <select
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value)}
                      className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20"
                    >
                      {CONTRACT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                      Salary Exception
                    </span>
                    <select
                      value={salaryException}
                      disabled={!isSigning}
                      onChange={(e) => setSalaryException(e.target.value)}
                      className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20 disabled:cursor-not-allowed disabled:bg-brand-soft disabled:text-brand-muted"
                    >
                      {SALARY_EXCEPTIONS.map((ex) => (
                        <option key={ex} value={ex}>
                          {ex}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                      Years
                    </span>
                    <select
                      value={years}
                      onChange={(e) => changeYears(Number(e.target.value))}
                      className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20"
                    >
                      {[1, 2, 3, 4, 5].map((y) => (
                        <option key={y} value={y}>
                          {y} {y === 1 ? "Year" : "Years"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                      Rank (Optional)
                      {isSigning ? (
                        <FiHelpCircle
                          className="h-3 w-3"
                          title="Rank is used when offering extensions only."
                        />
                      ) : null}
                    </span>
                    <input
                      disabled={isSigning}
                      placeholder="000"
                      title={
                        isSigning
                          ? "Rank is used when offering extensions only."
                          : undefined
                      }
                      className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20 disabled:cursor-not-allowed disabled:bg-brand-soft disabled:text-brand-muted"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-brand-border px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-brand-dark">
                      Use Maximum?
                    </p>
                    <p className="text-[11px] text-brand-muted">
                      Apply league maximum salary for this player&apos;s contract
                      year
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleMax}
                    className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
                      useMax ? "bg-brand-cta" : "bg-brand-border"
                    }`}
                    aria-pressed={useMax}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-white transition ${
                        useMax ? "translate-x-4" : ""
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                    Salary Breakdown
                  </p>
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase text-brand-muted">
                        <th className="text-left font-semibold">Year</th>
                        <th className="text-center font-semibold">Age</th>
                        <th className="text-left font-semibold">Salary</th>
                        <th className="text-right font-semibold">% of Cap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {salaries.map((salary, i) => {
                        const startSeason = 2025 + i;
                        const season = `${startSeason}-${String(
                          (startSeason + 1) % 100
                        ).padStart(2, "0")}`;
                        return (
                          <tr key={season}>
                            <td className="py-2 text-brand-dark">{season}</td>
                            <td className="py-2 text-center text-brand-muted">
                              {agent.age + i}
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={dollarInputValue(salary)}
                                disabled={useMax}
                                onChange={(e) =>
                                  setSalaries((prev) =>
                                    prev.map((v, idx) =>
                                      idx === i
                                        ? parseDollarInput(e.target.value)
                                        : v
                                    )
                                  )
                                }
                                placeholder="$0"
                                className="w-32 rounded border border-brand-border px-2 py-1 text-xs outline-none focus:border-brand-cta disabled:bg-brand-soft disabled:text-brand-muted"
                              />
                            </td>
                            <td className="py-2 text-right text-brand-muted">
                              {((salary / SALARY_CAP) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-brand-soft font-semibold text-brand-dark">
                        <td className="py-2 pl-1" colSpan={2}>
                          Summary
                        </td>
                        <td className="py-2 text-brand-muted">
                          Total: {moneyFull(total)}
                        </td>
                        <td className="py-2 text-right text-brand-muted">
                          Yr 1:{" "}
                          {((salaries[0] / SALARY_CAP) * 100 || 0).toFixed(1)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                    Additional Terms
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {TERMS.map((term) => (
                      <label
                        key={term}
                        className="flex items-center justify-between gap-2 rounded-lg border border-brand-border px-3 py-2 text-xs text-brand-dark"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={terms.has(term)}
                            onChange={() =>
                              setTerms((prev) => {
                                const next = new Set(prev);
                                if (next.has(term)) next.delete(term);
                                else next.add(term);
                                return next;
                              })
                            }
                            className="h-4 w-4 rounded border-brand-border text-brand-cta focus:ring-brand-cta/30"
                          />
                          {term}
                        </span>
                        <FiHelpCircle className="h-3.5 w-3.5 text-brand-muted" />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 self-start">
                <div className="rounded-lg border border-brand-border p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                    Contract Breakdown
                  </p>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-[9px] uppercase text-brand-muted">
                        <th className="text-left font-semibold">Season</th>
                        <th className="text-center font-semibold">Age</th>
                        <th className="text-right font-semibold">Salary</th>
                        <th className="text-right font-semibold">% Cap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {salaries.map((salary, i) => {
                        const startSeason = 2025 + i;
                        return (
                          <tr key={startSeason}>
                            <td className="py-1 text-brand-dark">
                              {startSeason}-
                              {String((startSeason + 1) % 100).padStart(2, "0")}
                            </td>
                            <td className="py-1 text-center text-brand-muted">
                              {agent.age + i}
                            </td>
                            <td className="py-1 text-right text-brand-dark">
                              {moneyFull(salary)}
                            </td>
                            <td className="py-1 text-right text-brand-muted">
                              {((salary / SALARY_CAP) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-t border-brand-border font-semibold">
                        <td className="py-1 text-brand-dark">Total</td>
                        <td />
                        <td className="py-1 text-right text-brand-cta-dark">
                          {moneyFull(total)}
                        </td>
                        <td className="py-1 text-right text-brand-muted">
                          AAV: {moneyFull(aav)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {isEdit ? null : (
                  <>
                    <div className="rounded-lg border border-brand-border p-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                        Team Impact (If Signed)
                      </p>
                      <dl className="space-y-1 text-xs">
                        {impact.map((l) => (
                          <div key={l.label} className="flex justify-between">
                            <dt className="text-brand-muted">{l.label}</dt>
                            <dd
                              className={`font-semibold ${
                                l.value < 0 ? "text-red-500" : "text-brand-dark"
                              }`}
                            >
                              {moneyFull(l.value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div className="rounded-lg border border-brand-cta/30 bg-brand-cta/5 p-3">
                      <p
                        className={`mb-2 flex items-center gap-1.5 text-sm font-bold ${
                          legal ? "text-brand-cta-dark" : "text-red-500"
                        }`}
                      >
                        {legal ? <FiCheck className="h-4 w-4" /> : null}
                        {legal ? "Offer is Legal" : "Offer is Not Legal"}
                      </p>
                      <ul className="space-y-1.5">
                        {checks.map((check) => (
                          <li
                            key={check.label}
                            className="flex items-start gap-1.5 text-[11px] text-brand-muted"
                          >
                            <span
                              className={`mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                                check.ok
                                  ? "bg-brand-cta/20 text-brand-cta-dark"
                                  : "bg-red-100 text-red-500"
                              }`}
                            >
                              {check.ok ? (
                                <FiCheck className="h-2.5 w-2.5" />
                              ) : (
                                <FiX className="h-2.5 w-2.5" />
                              )}
                            </span>
                            {check.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            Clear Offer
          </button>
          <button
            type="button"
            disabled={!legal}
            onClick={() =>
              onSubmit({
                years,
                aav,
                total,
                teamOption: terms.has("Team Option"),
              })
            }
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
          >
            {isEdit ? "Save Changes" : "Submit Offer"}
          </button>
        </div>
      </div>
    </div>
  );
}
