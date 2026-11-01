"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LuInfo } from "react-icons/lu";
import { useAppSelector } from "@/lib/store/hooks";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import { useSavedFlash } from "@/lib/useSavedFlash";
import NumberField from "@/components/ui/NumberField";
import SaveBar from "@/components/ui/SaveBar";
import Toggle from "@/components/ui/Toggle";
import {
  CAP_MULTIPLIERS,
  HARD_CAP_LABEL,
  getApiErrorMessage,
  useLeagueSettingsQuery,
  useUpdateLeagueSettingsMutation,
  type CapThresholds,
  type HardCapThreshold,
  type LeagueSettingsPatch,
} from "@/lib/store/api";

const THRESHOLD_OPTIONS: HardCapThreshold[] = [
  "luxuryTax",
  "firstApron",
  "secondApron",
  "none",
];

// Shown beside each row. The amounts themselves come from the API, so the
// percentages here are labels only.
const THRESHOLD_ROWS: { key: keyof CapThresholds; label: string }[] = [
  { key: "salaryFloor", label: "Salary Floor (90%)" },
  { key: "luxuryTax", label: "Luxury Tax Threshold (121.5%)" },
  { key: "firstApron", label: "First Apron (127%)" },
  { key: "secondApron", label: "Second Apron (134.5%)" },
  { key: "maxPlayerSalary", label: "Maximum Player Salary (35%)" },
];

const THRESHOLD_PERCENT: Partial<Record<HardCapThreshold, string>> = {
  luxuryTax: "121.5",
  firstApron: "127.0",
  secondApron: "134.5",
};

type Draft = {
  salaryCap: number;
  minPlayerSalary: number;
  hardCapEnabled: boolean;
  hardCapThreshold: HardCapThreshold;
};

function usd(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-brand-border bg-white shadow-card">
      <div className="border-b border-brand-border px-5 py-4">
        <h2 className="text-base font-semibold text-brand-dark">{title}</h2>
      </div>
      <div className="divide-y divide-brand-border">{children}</div>
    </section>
  );
}

export default function SalaryCapSettingsPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);

  const {
    data: settings,
    isLoading,
    isError,
    error: loadError,
  } = useLeagueSettingsQuery(leagueId as number, { skip: !leagueId });

  const [updateSettings, { isLoading: saving }] =
    useUpdateLeagueSettingsMutation();

  const [form, setForm] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { saved: done, flash, clear: clearDone } = useSavedFlash();

  // Re-sync only when the server copy actually moved on, so a refetch cannot
  // throw away edits in progress.
  const syncedAt = useRef<string | null>(null);
  useEffect(() => {
    if (!settings || syncedAt.current === settings.updatedAt) return;
    syncedAt.current = settings.updatedAt;
    setForm({
      salaryCap: settings.salaryCap,
      minPlayerSalary: settings.minPlayerSalary,
      hardCapEnabled: settings.hardCapEnabled,
      hardCapThreshold: settings.hardCapThreshold,
    });
    setError(null);
  }, [settings]);

  const saved: Draft | null = useMemo(
    () =>
      settings
        ? {
            salaryCap: settings.salaryCap,
            minPlayerSalary: settings.minPlayerSalary,
            hardCapEnabled: settings.hardCapEnabled,
            hardCapThreshold: settings.hardCapThreshold,
          }
        : null,
    [settings],
  );

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(saved),
    [form, saved],
  );

  // The server works these out from salaryCap, but they have to follow the
  // field while it is being typed, before anything is saved. Computed from the
  // multipliers rather than scaled from the saved figures, because a new
  // league's saved cap is 0 and nothing can be scaled from that.
  const thresholds = useMemo(() => {
    if (!form) return null;
    return Object.fromEntries(
      Object.entries(CAP_MULTIPLIERS).map(([key, multiplier]) => [
        key,
        form.salaryCap * multiplier,
      ]),
    ) as CapThresholds;
  }, [form]);

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to configure its salary cap.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-20 text-center text-sm font-medium text-red-600">
        {getApiErrorMessage(loadError, "Could not load the salary cap.")}
      </p>
    );
  }

  if (isLoading || !form || !saved || !thresholds) {
    return (
      <p className="py-20 text-center text-sm text-brand-muted">
        Loading salary cap…
      </p>
    );
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const numInput = (key: "salaryCap" | "minPlayerSalary") => {
    const className = `mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:ring-2 focus:ring-brand-cta/30 disabled:border-brand-border disabled:bg-brand-soft/50 ${
      key === "salaryCap"
        ? "border-brand-cta font-semibold"
        : "border-brand-border"
    }`;

    if (!canEdit) {
      return (
        <p className={`${className} bg-brand-soft/50`}>{usd(form[key])}</p>
      );
    }

    return (
      <NumberField
        value={form[key]}
        onChange={(v) => set(key, v)}
        formatter={usd}
        className={className}
      />
    );
  };

  async function save() {
    if (!form || !saved) return;
    setError(null);
    clearDone();

    const patch: LeagueSettingsPatch = {};
    if (form.salaryCap !== saved.salaryCap) patch.salaryCap = form.salaryCap;
    if (form.minPlayerSalary !== saved.minPlayerSalary) {
      patch.minPlayerSalary = form.minPlayerSalary;
    }
    if (form.hardCapEnabled !== saved.hardCapEnabled) {
      patch.hardCapEnabled = form.hardCapEnabled;
    }
    if (form.hardCapThreshold !== saved.hardCapThreshold) {
      patch.hardCapThreshold = form.hardCapThreshold;
    }

    if (!Object.keys(patch).length) return;

    try {
      await updateSettings({ leagueId: leagueId as number, patch }).unwrap();
      flash();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save the salary cap."));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">
          Salary Cap Settings
        </h1>
        <p className="text-sm text-brand-muted">
          {canEdit
            ? "Set the league-wide salary cap and all derived thresholds."
            : "The salary cap is managed by the commissioner of this league."}
        </p>
      </div>

      <SettingsCard title="Salary Cap Settings">
        <div className="px-5 py-4">
          <label
            htmlFor="salary-cap"
            className="text-sm font-semibold text-brand-dark"
          >
            Salary Cap
          </label>
          <p className="mt-0.5 text-xs text-brand-muted">
            Primary input — auto-calculates all thresholds below
          </p>
          {numInput("salaryCap")}

          <div className="mt-4 rounded-lg border border-brand-cta/30 bg-brand-cta/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-cta-dark">
              Auto-calculated (reference only)
            </p>
            {form.salaryCap === 0 ? (
              <p className="mt-2 text-xs text-brand-muted">
                Enter a salary cap above and these thresholds will be worked
                out from it.
              </p>
            ) : (
              <dl className="mt-2 divide-y divide-brand-cta/15 text-sm">
                {THRESHOLD_ROWS.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between py-2"
                  >
                    <dt className="text-brand-muted">{row.label}</dt>
                    <dd className="font-semibold text-brand-dark">
                      {usd(thresholds[row.key])}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
        <div className="px-5 py-4">
          <label
            htmlFor="min-player-salary"
            className="text-sm font-semibold text-brand-dark"
          >
            Minimum Player Salary
          </label>
          <p className="mt-0.5 text-xs text-brand-muted">
            Floor for any individual player contract
          </p>
          {numInput("minPlayerSalary")}
        </div>
      </SettingsCard>

      <SettingsCard title="Hard Cap">
        <div className="flex items-center justify-between gap-6 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-brand-dark">Hard Cap</p>
            <p className="mt-0.5 text-xs text-brand-muted">
              A salary limit no team can exceed under any circumstance
            </p>
          </div>
          <Toggle
            label="Hard Cap"
            checked={form.hardCapEnabled}
            onChange={(v) => set("hardCapEnabled", v)}
            disabled={!canEdit}
          />
        </div>
        {form.hardCapEnabled ? (
          <div className="px-5 py-4">
            <div className="rounded-lg bg-brand-soft/60 p-4">
              <label
                htmlFor="hard-cap-threshold"
                className="text-[11px] font-bold uppercase tracking-wide text-brand-muted"
              >
                Hard Cap Threshold
              </label>
              <select
                id="hard-cap-threshold"
                value={form.hardCapThreshold}
                disabled={!canEdit}
                onChange={(e) =>
                  set("hardCapThreshold", e.target.value as HardCapThreshold)
                }
                className="mt-2 w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:ring-2 focus:ring-brand-cta/30 disabled:bg-brand-soft/50"
              >
                {THRESHOLD_OPTIONS.map((threshold) => (
                  <option key={threshold} value={threshold}>
                    {HARD_CAP_LABEL[threshold]}
                  </option>
                ))}
              </select>
              {form.hardCapThreshold !== "none" ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-muted">
                  <LuInfo className="h-3.5 w-3.5 shrink-0" />
                  Teams cannot exceed{" "}
                  {HARD_CAP_LABEL[form.hardCapThreshold]} (
                  {THRESHOLD_PERCENT[form.hardCapThreshold]}%) under any trade
                  or signing scenario.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </SettingsCard>

      {canEdit ? (
        <SaveBar
          dirty={dirty}
          saving={saving}
          saved={done}
          error={error}
          onSave={save}
          onDiscard={() => {
            setError(null);
            clearDone();
            setForm(saved);
          }}
        />
      ) : null}
    </div>
  );
}
