"use client";

import { useMemo, useState } from "react";
import { LuInfo } from "react-icons/lu";
import NumberField from "@/components/ui/NumberField";
import { getApiErrorMessage } from "@/lib/store/api";
import {
  useCapYearsQuery,
  useSaveCapYearMutation,
  type CapYear,
  type CapYearInput,
} from "@/lib/store/api/endpoints/capYearApi";
import { money } from "@/lib/money";
import { useSavedFlash } from "@/lib/useSavedFlash";

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

/**
 * The five figures Rule 2.3 says are entered rather than calculated.
 *
 * Everything else in Article 2 is a percentage of the salary cap and is worked
 * out from it, so it is not asked for here.
 */
const FIELDS: {
  key: keyof CapYearInput;
  label: string;
  hint: string;
}[] = [
  {
    key: "salaryCap",
    label: "Salary Cap",
    hint: "Every percentage in Article 2 is worked out from this.",
  },
  { key: "luxuryTax", label: "Luxury Tax Line", hint: "Article 3 tiers." },
  { key: "firstApron", label: "First Apron", hint: "Rules 4.5 and 5.4." },
  { key: "secondApron", label: "Second Apron", hint: "Rules 4.5 and 5.5." },
  {
    key: "averagePlayerSalary",
    label: "Average Player Salary",
    hint: "Rule 10.12 reads cap holds against this, so it is entered too.",
  },
];

/** A sensible blank year: this season, or the one after the newest entered. */
const nextSeason = (years: CapYear[]) =>
  years.length === 0
    ? new Date().getUTCFullYear()
    : Math.max(...years.map((year) => year.seasonStartYear)) + 1;

const emptyDraft = (): CapYearInput => ({
  salaryCap: 0,
  luxuryTax: 0,
  firstApron: 0,
  secondApron: 0,
  averagePlayerSalary: 0,
});

/**
 * Rule 2.3 — the league year figures every league runs on by default.
 *
 * This is the platform's copy. A league that has turned on its own numbers
 * keeps them: Rule 2.6 says an update here never overwrites a custom league,
 * and the page says so rather than leaving a Super Admin to find out.
 */
export default function PlatformSalaryCapPage() {
  const { data: years = [], isLoading } = useCapYearsQuery();
  const [save, { isLoading: saving }] = useSaveCapYearMutation();

  const [editingYear, setEditingYear] = useState<number | null>(null);
  const [draft, setDraft] = useState<CapYearInput>(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const { saved, flash } = useSavedFlash();

  const sorted = useMemo(
    () => [...years].sort((a, b) => b.seasonStartYear - a.seasonStartYear),
    [years],
  );

  const openYear = (year: CapYear) => {
    setEditingYear(year.seasonStartYear);
    setDraft({
      salaryCap: year.salaryCap,
      luxuryTax: year.luxuryTax,
      firstApron: year.firstApron,
      secondApron: year.secondApron,
      averagePlayerSalary: year.averagePlayerSalary,
    });
    setError(null);
  };

  const openNew = () => {
    const newest = sorted[0];
    setEditingYear(nextSeason(years));
    // Started from the newest year rather than from zero: next season's
    // figures are last season's plus a rise, not a blank form.
    setDraft(
      newest
        ? {
            salaryCap: newest.salaryCap,
            luxuryTax: newest.luxuryTax,
            firstApron: newest.firstApron,
            secondApron: newest.secondApron,
            averagePlayerSalary: newest.averagePlayerSalary,
          }
        : emptyDraft(),
    );
    setError(null);
  };

  const patch = (change: Partial<CapYearInput>) =>
    setDraft((prev) => ({ ...prev, ...change }));

  const submit = async () => {
    if (editingYear === null) return;
    setError(null);

    const missing = FIELDS.filter(
      (field) => field.key !== "averagePlayerSalary" && draft[field.key] <= 0,
    );
    if (missing.length > 0) {
      setError(
        `${missing.map((field) => field.label).join(", ")} must be more than zero.`,
      );
      return;
    }

    try {
      await save({ seasonStartYear: editingYear, ...draft }).unwrap();
      setEditingYear(null);
      flash();
    } catch (e) {
      setError(getApiErrorMessage(e, "That league year could not be saved."));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">
            Salary Cap Settings
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Rule 2.3 — the figures entered each league year. Every league runs
            on these unless its commissioner has entered its own.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark"
        >
          Add league year
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-brand-border bg-brand-soft/50 px-4 py-3 text-xs text-brand-muted">
        <LuInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Rule 2.6 — a league that has turned on its own cap keeps it. Saving
          here changes the default only, and never a league that has entered
          numbers of its own.
        </p>
      </div>

      {saved ? (
        <p className="rounded-lg bg-brand-cta/10 px-4 py-2 text-sm font-medium text-brand-cta-dark">
          League year saved.
        </p>
      ) : null}

      {editingYear !== null ? (
        <section className="rounded-xl border border-brand-cta/40 bg-white shadow-card">
          <div className="border-b border-brand-border px-5 py-4">
            <h2 className="text-base font-semibold text-brand-dark">
              {seasonLabel(editingYear)}
            </h2>
            <p className="mt-0.5 text-xs text-brand-muted">
              Whole dollars. Saving a year that already exists replaces it.
            </p>
          </div>

          <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                League year
              </span>
              <NumberField
                value={editingYear}
                min={2000}
                onChange={(value) => setEditingYear(value)}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
              />
              <span className="mt-1 block text-[11px] text-brand-muted">
                The year the season starts in: 2026 is {seasonLabel(2026)}.
              </span>
            </label>

            {FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                  {field.label}
                </span>
                <NumberField
                  value={draft[field.key]}
                  onChange={(value) => patch({ [field.key]: value })}
                  className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
                />
                <span className="mt-1 block text-[11px] text-brand-muted">
                  {money(draft[field.key])} · {field.hint}
                </span>
              </label>
            ))}
          </div>

          {error ? (
            <p className="px-5 pb-3 text-sm text-red-600">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-brand-border px-5 py-4">
            <button
              type="button"
              onClick={() => setEditingYear(null)}
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
              {saving ? "Saving…" : "Save league year"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-2.5">League year</th>
                {FIELDS.map((field) => (
                  <th key={field.key} className="px-3 py-2.5 text-right">
                    {field.label}
                  </th>
                ))}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={FIELDS.length + 2}
                    className="px-4 py-8 text-center text-sm text-brand-muted"
                  >
                    Loading…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={FIELDS.length + 2}
                    className="px-4 py-8 text-center text-sm text-brand-muted"
                  >
                    No league year has been entered yet. Until one is, a league
                    on the default numbers has no cap to measure against.
                  </td>
                </tr>
              ) : (
                sorted.map((year) => (
                  <tr key={year.id}>
                    <td className="px-4 py-2.5 font-semibold text-brand-dark">
                      {seasonLabel(year.seasonStartYear)}
                    </td>
                    {FIELDS.map((field) => (
                      <td
                        key={field.key}
                        className="px-3 py-2.5 text-right text-brand-dark"
                      >
                        {money(year[field.key])}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => openYear(year)}
                        className="rounded-lg border border-brand-border px-3 py-1 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
