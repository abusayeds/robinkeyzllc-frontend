"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LuLock } from "react-icons/lu";
import { useAppSelector } from "@/lib/store/hooks";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import { useSavedFlash } from "@/lib/useSavedFlash";
import NumberField from "@/components/ui/NumberField";
import SaveBar from "@/components/ui/SaveBar";
import {
  PREGAME_LOCK_OPTIONS,
  SLOT_LABEL,
  getApiErrorMessage,
  useLeagueSettingsQuery,
  useUpdateLeagueSettingsMutation,
  type LeagueSettingsPatch,
  type PositionSlots,
  type RosterRules,
} from "@/lib/store/api";

const SLOT_ROWS: { key: keyof PositionSlots; label: string }[] = [
  { key: "guard", label: "Guard (G)" },
  { key: "forward", label: "Forward (F)" },
  { key: "center", label: "Center (C)" },
  { key: "flex", label: "Flex" },
  { key: "bench", label: "Bench" },
  { key: "ir", label: "Injured Reserve (IR)" },
];

function SettingsCard({
  title,
  desc,
  action,
  children,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-brand-border bg-white shadow-card">
      <div className="flex items-start justify-between gap-4 border-b border-brand-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-brand-dark">{title}</h2>
          {desc ? (
            <p className="mt-0.5 text-sm text-brand-muted">{desc}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="divide-y divide-brand-border">{children}</div>
    </section>
  );
}

function NumberRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-dark">{label}</p>
        <p className="mt-0.5 text-xs text-brand-muted">{hint}</p>
      </div>
      {disabled ? (
        <span className="w-16 shrink-0 rounded-lg border border-brand-border bg-brand-soft/50 px-2.5 py-1.5 text-center text-sm text-brand-dark">
          {value}
        </span>
      ) : (
        <NumberField
          value={value}
          onChange={onChange}
          className="w-16 shrink-0 rounded-lg border border-brand-border bg-white px-2.5 py-1.5 text-center text-sm text-brand-dark outline-none focus:ring-2 focus:ring-brand-cta/30"
        />
      )}
    </div>
  );
}

export default function RosterRulesPage() {
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

  const [form, setForm] = useState<RosterRules | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { saved: done, flash, clear: clearDone } = useSavedFlash();

  // Re-sync only when the server copy actually moved on. A refetch that
  // returns the same data must not throw away edits in progress.
  const syncedAt = useRef<string | null>(null);
  useEffect(() => {
    if (!settings || syncedAt.current === settings.updatedAt) return;
    syncedAt.current = settings.updatedAt;
    setForm({
      ...settings.roster,
      slots: { ...settings.roster.slots },
    });
    setError(null);
  }, [settings]);

  const saved = settings?.roster ?? null;

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(saved),
    [form, saved],
  );

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to configure its roster rules.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-20 text-center text-sm font-medium text-red-600">
        {getApiErrorMessage(loadError, "Could not load the roster rules.")}
      </p>
    );
  }

  if (isLoading || !form || !saved) {
    return (
      <p className="py-20 text-center text-sm text-brand-muted">
        Loading roster rules…
      </p>
    );
  }

  const set = <K extends keyof RosterRules>(key: K, value: RosterRules[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const setSlot = (key: keyof PositionSlots, value: number) =>
    setForm((f) => (f ? { ...f, slots: { ...f.slots, [key]: value } } : f));

  const totalSlots = Object.values(form.slots).reduce((a, b) => a + b, 0);
  const activeSlots = totalSlots - form.slots.ir;

  async function save() {
    if (!form || !saved) return;
    setError(null);
    clearDone();

    const patch: LeagueSettingsPatch = {};
    if (form.minRosterSize !== saved.minRosterSize) {
      patch.minRosterSize = form.minRosterSize;
    }
    if (form.maxRosterSize !== saved.maxRosterSize) {
      patch.maxRosterSize = form.maxRosterSize;
    }
    if (form.maxTwoWay !== saved.maxTwoWay) patch.maxTwoWay = form.maxTwoWay;
    if (form.pregameLockMinutes !== saved.pregameLockMinutes) {
      patch.pregameLockMinutes = form.pregameLockMinutes;
    }
    // Written out one by one: the API field names differ from the slot keys,
    // and an indexed assignment loses the type of each field.
    const { slots } = form;
    if (slots.guard !== saved.slots.guard) patch.slotGuard = slots.guard;
    if (slots.forward !== saved.slots.forward) patch.slotForward = slots.forward;
    if (slots.center !== saved.slots.center) patch.slotCenter = slots.center;
    if (slots.flex !== saved.slots.flex) patch.slotFlex = slots.flex;
    if (slots.bench !== saved.slots.bench) patch.slotBench = slots.bench;
    if (slots.ir !== saved.slots.ir) patch.slotIr = slots.ir;

    if (!Object.keys(patch).length) return;

    try {
      await updateSettings({ leagueId: leagueId as number, patch }).unwrap();
      flash();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save the roster rules."));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
          Roster Rules
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          {canEdit
            ? "Define roster size limits and position slot configuration."
            : "These rules are managed by the commissioner of this league."}
        </p>
      </div>

      <SettingsCard
        title="Roster Limits"
        desc="Define roster size limits and two-way contract allowance."
      >
        <NumberRow
          label="Min Roster Size"
          hint="Minimum active players a team must carry"
          value={form.minRosterSize}
          onChange={(v) => set("minRosterSize", v)}
          disabled={!canEdit}
        />
        <NumberRow
          label="Max Roster Size"
          hint="Maximum active players allowed"
          value={form.maxRosterSize}
          onChange={(v) => set("maxRosterSize", v)}
          disabled={!canEdit}
        />
        <NumberRow
          label="Max Two-Way Contracts"
          hint="Two-way contract spots per team"
          value={form.maxTwoWay}
          onChange={(v) => set("maxTwoWay", v)}
          disabled={!canEdit}
        />
      </SettingsCard>

      <SettingsCard
        title="Position Slots (per team)"
        desc="Set these to whatever suits your league. They are not forced to match the roster limits above."
        action={
          <span className="shrink-0 rounded-md bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-muted">
            {totalSlots} total
          </span>
        }
      >
        {SLOT_ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-6 px-5 py-4"
          >
            <p className="text-sm font-semibold text-brand-dark">{row.label}</p>
            {canEdit ? (
              <NumberField
                value={form.slots[row.key]}
                onChange={(v) => setSlot(row.key, v)}
                className="w-16 shrink-0 rounded-lg border border-brand-border bg-white px-2.5 py-1.5 text-center text-sm text-brand-dark outline-none focus:ring-2 focus:ring-brand-cta/30"
              />
            ) : (
              <span className="w-16 shrink-0 rounded-lg border border-brand-border bg-brand-soft/50 px-2.5 py-1.5 text-center text-sm text-brand-dark">
                {form.slots[row.key]}
              </span>
            )}
          </div>
        ))}
        <div className="px-5 py-4">
          <dl className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-brand-muted">
                Slots excluding {SLOT_LABEL.ir}
              </dt>
              <dd className="font-semibold text-brand-dark">{activeSlots}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-brand-muted">Max Roster Size</dt>
              <dd className="font-semibold text-brand-dark">
                {form.maxRosterSize}
              </dd>
            </div>
          </dl>
          {activeSlots !== form.maxRosterSize ? (
            <p className="mt-2 text-xs text-brand-muted">
              These two do not match. That is allowed — the slot layout decides
              how a lineup is filled, while Max Roster Size caps how many
              players a team may hold.
            </p>
          ) : null}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Pregame Roster Lock"
        desc="Players are locked from lineup changes once their game is within the cutoff window. This prevents GMs from swapping players in or out after tip-off times are known."
        action={
          canEdit ? (
            <select
              value={form.pregameLockMinutes}
              onChange={(e) =>
                set("pregameLockMinutes", Number(e.target.value))
              }
              aria-label="Pregame lock window"
              className="shrink-0 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-dark outline-none focus:ring-2 focus:ring-brand-cta/30"
            >
              {PREGAME_LOCK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="shrink-0 rounded-lg border border-brand-border bg-brand-soft/50 px-3 py-1.5 text-sm text-brand-dark">
              {form.pregameLockMinutes} mins
            </span>
          )
        }
      >
        <div className="px-5 py-4">
          <div className="rounded-lg border border-brand-cta/20 bg-brand-cta/5 p-4">
            <ul className="space-y-1.5 text-xs text-brand-muted">
              <li className="flex gap-2">
                <LuLock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-cta-dark" />
                With a {form.pregameLockMinutes}-minute window, a player whose
                game tips off at 7:00 PM locks at{" "}
                {(() => {
                  const tip = new Date(2000, 0, 1, 19, 0);
                  tip.setMinutes(tip.getMinutes() - form.pregameLockMinutes);
                  return tip.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                })()}
                .
              </li>
              <li className="pl-[22px]">
                Locked players cannot be moved: starting lineup ↔ bench, added
                to IR, or dropped.
              </li>
              <li className="pl-[22px]">
                The lock applies per-player — teammates with later games remain
                editable until their own cutoff.
              </li>
              <li className="pl-[22px]">
                Tip-off times are entered by hand, so the lock only applies once
                a game time has been recorded for that day.
              </li>
            </ul>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PREGAME_LOCK_OPTIONS.map((option) => {
              const active = form.pregameLockMinutes === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => set("pregameLockMinutes", option.value)}
                  className={`rounded-lg border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    active
                      ? "border-brand-cta bg-brand-cta/5"
                      : "border-brand-border bg-white hover:border-brand-cta/40"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      active ? "text-brand-cta-dark" : "text-brand-dark"
                    }`}
                  >
                    {option.label}
                  </p>
                  <p className="mt-0.5 text-xs text-brand-muted">
                    {option.headline}
                  </p>
                  {active ? (
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-brand-cta-dark">
                      Selected
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
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
            setForm({ ...saved, slots: { ...saved.slots } });
          }}
        />
      ) : null}
    </div>
  );
}
