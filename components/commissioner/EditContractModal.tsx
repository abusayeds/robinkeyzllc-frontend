"use client";

import { useEffect, useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import {
  useEditContractMutation,
  useEditPlayerServiceMutation,
  type ContractYearEdit,
  type SalaryContract,
} from "@/lib/store/api/endpoints/salaryApi";
import { useModalShell } from "@/lib/useModalShell";
import { money } from "@/lib/money";

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

const seasonLabel = (year: number) =>
  `${year}-${String((year + 1) % 100).padStart(2, "0")}`;

const OPTION_CHOICES: {
  value: ContractYearEdit["optionType"];
  label: string;
}[] = [
  { value: null, label: "None" },
  { value: "player", label: "Player option" },
  { value: "team", label: "Team option" },
  { value: "earlyTermination", label: "Early termination" },
];

const GUARANTEE_CHOICES: {
  value: ContractYearEdit["guaranteeType"];
  label: string;
}[] = [
  { value: "full", label: "Fully guaranteed" },
  { value: "partial", label: "Partially guaranteed" },
  { value: "none", label: "Non-guaranteed" },
];

/**
 * Where a commissioner corrects one contract.
 *
 * Only the seasons shown are sent, so a fix to a single year leaves the rest
 * of the deal exactly as it was. A two-way contract keeps a zero cap hit
 * whatever is typed here — that is what makes it a two-way deal.
 */
export default function EditContractModal({
  leagueId,
  contract,
  onClose,
}: {
  leagueId: number;
  contract: SalaryContract | null;
  onClose: () => void;
}) {
  const [years, setYears] = useState<ContractYearEdit[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Neither of these comes from the NBA feed: bird years are a league fact,
  // and balldontlie publishes no experience field on any tier.
  const [birdYears, setBirdYears] = useState(0);
  const [yearsOfService, setYearsOfService] = useState(0);

  const [save, { isLoading: saving }] = useEditContractMutation();
  const [saveService, { isLoading: savingService }] =
    useEditPlayerServiceMutation();

  // Start from the contract as it is each time a different one is opened.
  useEffect(() => {
    if (!contract) return;
    setYears(
      contract.seasons.map((season) => ({
        seasonStartYear: season.seasonStartYear,
        salary: season.salary,
        optionType: season.optionType,
        guaranteeType: season.guaranteeType,
        guaranteedAmount: season.guaranteedAmount,
      })),
    );
    setBirdYears(contract.birdYears);
    setYearsOfService(contract.yearsOfService ?? 0);
    setError(null);
  }, [contract]);

  useModalShell(Boolean(contract), onClose);

  if (!contract) return null;

  const isTwoWay = contract.slotType === "twoWay";

  const patch = (index: number, change: Partial<ContractYearEdit>) =>
    setYears((prev) =>
      prev.map((year, at) => (at === index ? { ...year, ...change } : year)),
    );

  const total = years.reduce((sum, year) => sum + year.salary, 0);

  const submit = async () => {
    setError(null);
    const partialWithoutAmount = years.find(
      (year) =>
        year.guaranteeType === "partial" && year.guaranteedAmount === null,
    );
    if (partialWithoutAmount) {
      setError(
        `${seasonLabel(partialWithoutAmount.seasonStartYear)} is partially guaranteed, so it needs the guaranteed amount.`,
      );
      return;
    }

    try {
      await save({ leagueId, contractId: contract.id, years }).unwrap();
      // Only when something actually changed: the route refuses an empty body,
      // and most edits here are to the salary rather than to these two.
      if (
        birdYears !== contract.birdYears ||
        yearsOfService !== (contract.yearsOfService ?? 0)
      ) {
        await saveService({
          leagueId,
          leaguePlayerId: contract.leaguePlayerId,
          birdYears,
          yearsOfService,
        }).unwrap();
      }
      onClose();
    } catch (e) {
      setError(errorText(e, "That contract could not be saved."));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-3 sm:p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${contract.name}'s contract`}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-card supports-[height:100dvh]:max-h-[88dvh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-brand-dark">
              Edit Contract
              <span className="font-normal text-brand-muted">
                {" "}
                | {contract.name}
              </span>
            </h2>
            <p className="mt-0.5 text-[11px] text-brand-muted">
              {contract.type} · signed via {contract.signedVia} ·{" "}
              {contract.birdYears} bird
              {isTwoWay ? " · two-way, carried at $0" : ""}
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
          {years.map((year, index) => (
            <div
              key={year.seasonStartYear}
              className="rounded-lg border border-brand-border p-3"
            >
              <p className="text-xs font-bold text-brand-dark">
                {seasonLabel(year.seasonStartYear)}
              </p>

              <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                    Salary
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={year.salary}
                    onChange={(e) =>
                      patch(index, {
                        salary: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-dark outline-none focus:border-brand-cta"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                    Option
                  </span>
                  <select
                    value={year.optionType ?? ""}
                    onChange={(e) =>
                      patch(index, {
                        optionType: (e.target.value ||
                          null) as ContractYearEdit["optionType"],
                      })
                    }
                    className="w-full rounded-lg border border-brand-border bg-white px-2 py-1.5 text-sm text-brand-dark outline-none focus:border-brand-cta"
                  >
                    {OPTION_CHOICES.map((choice) => (
                      <option key={choice.label} value={choice.value ?? ""}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                    Guarantee
                  </span>
                  <select
                    value={year.guaranteeType}
                    onChange={(e) =>
                      patch(index, {
                        guaranteeType: e.target
                          .value as ContractYearEdit["guaranteeType"],
                        // A figure only means something while the season is
                        // partially guaranteed, so it is dropped otherwise.
                        guaranteedAmount:
                          e.target.value === "partial"
                            ? year.guaranteedAmount
                            : null,
                      })
                    }
                    className="w-full rounded-lg border border-brand-border bg-white px-2 py-1.5 text-sm text-brand-dark outline-none focus:border-brand-cta"
                  >
                    {GUARANTEE_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {year.guaranteeType === "partial" ? (
                <label className="mt-2.5 block sm:w-1/3">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                    Guaranteed amount
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={year.salary}
                    value={year.guaranteedAmount ?? 0}
                    onChange={(e) =>
                      patch(index, {
                        guaranteedAmount: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-dark outline-none focus:border-brand-cta"
                  />
                </label>
              ) : null}
            </div>
          ))}

          <div className="rounded-lg border border-brand-border p-3">
            <p className="text-xs font-bold text-brand-dark">Service</p>
            <p className="mt-0.5 text-[11px] text-brand-muted">
              Neither of these is in the NBA feed. Bird years count seasons
              under contract in this league (Rule 9.1); experience is counted
              from completed seasons with a game played, and is entered here
              when that count is wrong.
            </p>

            <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                  Bird years (0–3)
                </span>
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={birdYears}
                  onChange={(e) =>
                    setBirdYears(
                      Math.min(3, Math.max(0, Number(e.target.value))),
                    )
                  }
                  className="w-full rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-dark outline-none focus:border-brand-cta"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                  Experience (years)
                  {contract.yearsOfServiceEstimated ? " · estimated" : ""}
                </span>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={yearsOfService}
                  onChange={(e) =>
                    setYearsOfService(
                      Math.min(30, Math.max(0, Number(e.target.value))),
                    )
                  }
                  className="w-full rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-dark outline-none focus:border-brand-cta"
                />
              </label>
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-brand-border px-5 py-4">
          <span className="text-xs text-brand-muted">
            Total {money(total)} over {years.length}{" "}
            {years.length === 1 ? "season" : "seasons"}
          </span>
          <span className="flex items-center gap-2">
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
              disabled={saving || savingService}
              className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
            >
              {saving || savingService ? "Saving…" : "Save Contract"}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
