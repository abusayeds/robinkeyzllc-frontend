"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { FiPlus, FiCheck, FiX, FiLock, FiTrash2 } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  canManageLeague,
  setActiveLeague,
} from "@/lib/store/features/activeLeagueSlice";
import { avatarSrc, initials } from "@/lib/avatar";
import { useSavedFlash } from "@/lib/useSavedFlash";
import SaveBar from "@/components/ui/SaveBar";
import Toggle from "@/components/ui/Toggle";
import {
  FREE_AGENCY_LABEL,
  SETUP_MODE_BODY,
  SETUP_MODE_LABEL,
  UPLOAD_ACCEPT_IMAGE,
  getApiErrorMessage,
  useAddCoCommissionerMutation,
  useLeagueMembersQuery,
  useLeagueSettingsQuery,
  useRemoveCoCommissionerMutation,
  useUpdateLeagueMutation,
  useUpdateLeagueSettingsMutation,
  useUploadFileMutation,
  validateUploadFile,
  type FreeAgencyStyle,
  type LeagueSettings,
  type LeagueSettingsPatch,
  type LeagueSetupMode,
  type TradingRules,
} from "@/lib/store/api";

const SETUP_MODES: LeagueSetupMode[] = ["startup", "import"];
const FA_STYLES: FreeAgencyStyle[] = ["dynamic", "auction"];

// The trading rules that are switches. `pickTradingWindowDrafts` is a
// number and gets its own row, so it has to be kept out of this list.
type TradingToggle = {
  [K in keyof TradingRules]: TradingRules[K] extends boolean ? K : never;
}[keyof TradingRules];

const TRADING_RULES: {
  key: TradingToggle;
  label: string;
  hint: string;
}[] = [
  {
    key: "salaryMatching",
    label: "Salary Matching",
    hint: "Require teams to match salary in trades to stay within cap",
  },
  {
    key: "apronRules",
    label: "NBA Apron Rules",
    hint: "Enforce NBA apron restrictions on teams above the tax threshold",
  },
  {
    key: "allowTradeExceptions",
    label: "Allow Trade Exceptions",
    hint: "Enable teams to generate trade exceptions from transactions",
  },
  {
    key: "allowTradingTradeExceptions",
    label: "Allow Trading of Trade Exceptions",
    hint: "Allow teams to include trade exceptions as assets in deals",
  },
  {
    key: "allowDraftPickTrading",
    label: "Allow Draft Pick Trading",
    hint: "Allow teams to trade future draft picks in transactions",
  },
  {
    key: "commissionerTradeApproval",
    label: "Commissioner Trade Approval",
    hint: "On — Commissioner must approve trades before they are processed. Off — Trades process automatically once all teams accept.",
  },
];

type Draft = {
  name: string;
  logo: string | null;
  isPublic: boolean;
  setupMode: LeagueSetupMode;
  freeAgencyStyle: FreeAgencyStyle;
  trading: TradingRules;
};

function SettingsCard({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-brand-border bg-white shadow-card">
      <div className="border-b border-brand-border px-5 py-4">
        <h2 className="text-base font-semibold text-brand-dark">{title}</h2>
        <p className="mt-0.5 text-sm text-brand-muted">{desc}</p>
      </div>
      <div className="divide-y divide-brand-border">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  control,
}: {
  label: string;
  hint: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-dark">{label}</p>
        <p className="mt-0.5 text-xs text-brand-muted">{hint}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function toDraft(settings: LeagueSettings, name: string, logo: string | null, isPublic: boolean): Draft {
  return {
    name,
    logo,
    isPublic,
    setupMode: settings.setupMode,
    freeAgencyStyle: settings.freeAgencyStyle,
    trading: { ...settings.trading },
  };
}

function CoCommissioners({
  leagueId,
  canEdit,
}: {
  leagueId: number;
  canEdit: boolean;
}) {
  const { data: members = [], isLoading } = useLeagueMembersQuery(leagueId);
  const [addCoCommissioner, { isLoading: adding }] =
    useAddCoCommissionerMutation();
  const [removeCoCommissioner] = useRemoveCoCommissionerMutation();

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coCommissioners = members.filter((m) => m.role === "coCommissioner");

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter(
        (m) =>
          m.role === "member" &&
          (m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)),
      )
      .slice(0, 5);
  }, [search, members]);

  async function add(userId: number) {
    setError(null);
    try {
      await addCoCommissioner({ leagueId, userId }).unwrap();
      setSearch("");
      setShowAdd(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not add that co-commissioner."));
    }
  }

  async function remove(userId: number) {
    setError(null);
    try {
      await removeCoCommissioner({ leagueId, userId }).unwrap();
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not remove that co-commissioner."),
      );
    }
  }

  return (
    <SettingsCard
      title="Co-Commissioner"
      desc="Assign a co-commissioner for this league. This is optional — a league does not need one."
    >
      <div className="px-5 py-4">
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-brand-muted">Loading members…</p>
          ) : coCommissioners.length === 0 ? (
            <p className="text-sm text-brand-muted">
              No co-commissioners assigned yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {coCommissioners.map((member) => {
                const avatar = avatarSrc(member.image);
                return (
                  <li
                    key={member.userId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-soft/30 px-4 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-forest text-[10px] font-semibold text-brand-accent">
                        {avatar ? (
                          <Image
                            src={avatar}
                            alt={member.name}
                            width={32}
                            height={32}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials(member.name)
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-brand-dark">
                          {member.name}
                        </span>
                        <span className="block truncate text-xs text-brand-muted">
                          {member.email}
                        </span>
                      </span>
                    </span>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => remove(member.userId)}
                        className="shrink-0 text-red-500 transition hover:text-red-600"
                        aria-label={`Remove ${member.name} as co-commissioner`}
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
            >
              {error}
            </p>
          ) : null}

          {!canEdit ? null : showAdd ? (
            <div className="rounded-lg border border-brand-cta/30 bg-brand-cta/5 p-4">
              <p className="text-xs font-semibold text-brand-dark">
                Add Co-Commissioner
              </p>
              <div className="relative mt-2 flex gap-2">
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Search by name or email"
                  className="flex-1 rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                />
                {showSuggestions && suggestions.length > 0 ? (
                  <ul className="absolute left-0 top-full z-10 mt-1 w-full max-w-[calc(100%-56px)] overflow-hidden rounded-lg border border-brand-border bg-white py-1 shadow-card">
                    {suggestions.map((member) => (
                      <li key={member.userId}>
                        <button
                          type="button"
                          disabled={adding}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            add(member.userId);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-brand-soft disabled:opacity-60"
                        >
                          <span className="font-semibold text-brand-dark">
                            {member.name}
                          </span>
                          <span className="truncate text-brand-muted">
                            {member.email}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    setSearch("");
                  }}
                  className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
                >
                  Cancel
                </button>
              </div>
              <p className="mt-2 text-xs text-brand-muted">
                {search.trim() && suggestions.length === 0
                  ? "No league member matches that. Only members of this league can be promoted."
                  : "Pick a league member from the list to promote them."}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
            >
              <FiPlus className="h-4 w-4" />
              Add Co-Commissioner
            </button>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}

export default function CommissionerSettingsPage() {
  const dispatch = useAppDispatch();
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);

  const {
    data: settings,
    isLoading,
    isError,
    error: loadError,
  } = useLeagueSettingsQuery(leagueId as number, { skip: !leagueId });

  const [updateSettings, { isLoading: savingSettings }] =
    useUpdateLeagueSettingsMutation();
  const [updateLeague, { isLoading: savingLeague }] = useUpdateLeagueMutation();
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { saved: done, flash, clear: clearDone } = useSavedFlash();

  // The league name, logo and visibility live on League, the rest on
  // LeagueSettings, so the editor is built from both. Re-syncing only when one
  // of those actually changed keeps a refetch from discarding edits in
  // progress.
  const syncedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!settings || !activeLeague) return;
    const key = [
      settings.updatedAt,
      activeLeague.name,
      activeLeague.logo ?? "",
      activeLeague.visibility,
    ].join("|");
    if (syncedKey.current === key) return;
    syncedKey.current = key;
    setForm(
      toDraft(
        settings,
        activeLeague.name,
        activeLeague.logo,
        activeLeague.visibility === "public",
      ),
    );
    setError(null);
  }, [settings, activeLeague]);

  const saved = useMemo(
    () =>
      settings && activeLeague
        ? toDraft(
            settings,
            activeLeague.name,
            activeLeague.logo,
            activeLeague.visibility === "public",
          )
        : null,
    [settings, activeLeague],
  );

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
          Open a league from Avora Home to configure its settings.
        </p>
      </div>
    );
  }

  if (isLoading || !form || !saved) {
    return (
      <p className="py-20 text-center text-sm text-brand-muted">
        Loading settings…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-20 text-center text-sm font-medium text-red-600">
        {getApiErrorMessage(loadError, "Could not load league settings.")}
      </p>
    );
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const setTrading = (key: TradingToggle, value: boolean) =>
    setForm((f) =>
      f ? { ...f, trading: { ...f.trading, [key]: value } } : f,
    );

  async function pickLogo(file: File | undefined) {
    setError(null);
    clearDone();
    if (!file) return;

    const invalid = validateUploadFile(file, UPLOAD_ACCEPT_IMAGE);
    if (invalid) {
      setError(invalid);
      return;
    }

    try {
      const uploaded = await uploadFile(file).unwrap();
      set("logo", uploaded.path);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not upload the logo."));
    }
  }

  async function save() {
    if (!form || !saved) return;
    setError(null);
    clearDone();

    // Only the keys that actually changed are sent, so a PATCH never
    // overwrites a field someone else edited in the meantime.
    const leaguePatch: {
      name?: string;
      logo?: string | null;
      visibility?: "private" | "public";
    } = {};
    if (form.name.trim() !== saved.name) leaguePatch.name = form.name.trim();
    if (form.logo !== saved.logo) leaguePatch.logo = form.logo;
    if (form.isPublic !== saved.isPublic) {
      leaguePatch.visibility = form.isPublic ? "public" : "private";
    }

    const settingsPatch: LeagueSettingsPatch = {};
    if (form.setupMode !== saved.setupMode) {
      settingsPatch.setupMode = form.setupMode;
    }
    if (form.freeAgencyStyle !== saved.freeAgencyStyle) {
      settingsPatch.freeAgencyStyle = form.freeAgencyStyle;
    }
    for (const rule of TRADING_RULES) {
      if (form.trading[rule.key] !== saved.trading[rule.key]) {
        settingsPatch[rule.key] = form.trading[rule.key];
      }
    }
    if (
      form.trading.pickTradingWindowDrafts !==
      saved.trading.pickTradingWindowDrafts
    ) {
      settingsPatch.pickTradingWindowDrafts =
        form.trading.pickTradingWindowDrafts;
    }

    try {
      if (Object.keys(leaguePatch).length) {
        const league = await updateLeague({
          leagueId: leagueId as number,
          patch: leaguePatch,
        }).unwrap();

        // The header and league list read the name and logo from here.
        dispatch(
          setActiveLeague({
            ...(activeLeague as NonNullable<typeof activeLeague>),
            name: league.name,
            logo: league.logo,
            visibility: league.visibility,
          }),
        );
      }

      if (Object.keys(settingsPatch).length) {
        await updateSettings({
          leagueId: leagueId as number,
          patch: settingsPatch,
        }).unwrap();
      }

      flash();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save the settings."));
    }
  }

  const saving = savingSettings || savingLeague;
  const logoPreview = avatarSrc(form.logo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">League Settings</h1>
        <p className="text-sm text-brand-muted">
          {canEdit
            ? "Configure league identity, setup, visibility, and trading rules."
            : "These settings are managed by the commissioner of this league."}
        </p>
      </div>

      <SettingsCard
        title="League Information"
        desc="Set the basic identity of this league."
      >
        <Row
          label="League Logo"
          hint="Upload a logo to represent your league"
          control={
            <div className="flex items-center gap-3">
              {form.logo ? (
                <button
                  type="button"
                  onClick={() => set("logo", null)}
                  disabled={!canEdit}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500 transition hover:underline disabled:opacity-50"
                >
                  <FiTrash2 className="h-3 w-3" />
                  Remove
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={!canEdit || uploading}
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-dashed border-brand-border text-brand-muted transition hover:border-brand-cta hover:text-brand-cta disabled:opacity-60"
              >
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt={form.name}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : uploading ? (
                  <span className="text-[10px]">Uploading…</span>
                ) : (
                  <FiPlus className="h-5 w-5" />
                )}
              </button>
              <input
                ref={logoRef}
                type="file"
                accept={UPLOAD_ACCEPT_IMAGE}
                hidden
                onChange={(e) => {
                  pickLogo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          }
        />
        <div className="px-5 py-4">
          <label
            htmlFor="league-name"
            className="text-sm font-semibold text-brand-dark"
          >
            League Name
          </label>
          <p className="mt-0.5 text-xs text-brand-muted">
            This name will appear throughout the AVORA app
          </p>
          <input
            id="league-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            disabled={!canEdit}
            maxLength={80}
            className="mt-2 w-full rounded-lg border border-brand-cta bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:ring-2 focus:ring-brand-cta/30 disabled:border-brand-border disabled:bg-brand-soft/50"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="League Setup"
        desc="Choose how players and contract information will be introduced into the league."
      >
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          {SETUP_MODES.map((mode) => {
            const active = form.setupMode === mode;
            const locked = settings?.setupLocked && !active;
            return (
              <button
                key={mode}
                type="button"
                disabled={!canEdit || locked}
                onClick={() => set("setupMode", mode)}
                className={`rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? "border-brand-cta bg-brand-cta/5"
                    : "border-brand-border bg-blue-50/40 hover:border-brand-cta/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      active
                        ? "border-brand-cta bg-brand-cta text-white"
                        : "border-brand-border"
                    }`}
                  >
                    {active ? <FiCheck className="h-3 w-3" /> : null}
                  </span>
                  <span className="text-sm font-semibold text-brand-dark">
                    {SETUP_MODE_LABEL[mode]}
                  </span>
                  {locked ? (
                    <FiLock className="h-3 w-3 text-brand-muted" />
                  ) : null}
                </div>
                <p className="mt-1.5 text-xs text-brand-muted">
                  {SETUP_MODE_BODY[mode]}
                </p>
              </button>
            );
          })}
        </div>
        <div className="px-5 py-4">
          <div className="rounded-lg bg-amber-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
              Current Setup
            </p>
            <p className="mt-1 text-xs text-amber-800">
              <span className="font-semibold">
                {SETUP_MODE_LABEL[form.setupMode]}
              </span>{" "}
              is active. The league will use{" "}
              {form.setupMode === "import"
                ? "imported player and existing contract data."
                : "the startup player pool and draft process."}
            </p>
            {settings?.setupLocked ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-800">
                <FiLock className="h-3 w-3" />
                Locked — players have already been brought into this league.
              </p>
            ) : null}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="League Visibility"
        desc="Control whether this league can be discovered from the AVORA Home Page."
      >
        <Row
          label="Make this League Public"
          hint="Public leagues can be displayed as open leagues for users to discover and join."
          control={
            <Toggle
              label="Make this League Public"
              checked={form.isPublic}
              onChange={(v) => set("isPublic", v)}
              disabled={!canEdit}
            />
          }
        />
      </SettingsCard>

      <SettingsCard
        title="Trading Rules"
        desc="Configure rules for trades and transactions in this league."
      >
        {TRADING_RULES.map((rule) => (
          <Row
            key={rule.key}
            label={rule.label}
            hint={rule.hint}
            control={
              <Toggle
                label={rule.label}
                checked={form.trading[rule.key]}
                onChange={(v) => setTrading(rule.key, v)}
                disabled={!canEdit}
              />
            }
          />
        ))}
        <Row
          label="Pick Trading Window"
          hint="How many drafts ahead a pick may be traded. The rule book's own number is 7."
          control={
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={10}
                value={form.trading.pickTradingWindowDrafts}
                disabled={!canEdit || !form.trading.allowDraftPickTrading}
                onChange={(e) =>
                  setForm((f) =>
                    f
                      ? {
                          ...f,
                          trading: {
                            ...f.trading,
                            pickTradingWindowDrafts: Math.min(
                              10,
                              Math.max(1, Number(e.target.value) || 1),
                            ),
                          },
                        }
                      : f,
                  )
                }
                className="w-20 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-dark outline-none focus:border-brand-cta disabled:bg-brand-soft disabled:text-brand-muted"
              />
              <span className="text-xs text-brand-muted">drafts</span>
            </div>
          }
        />
        <Row
          label="Free Agency Style"
          hint="Choose how free agents are acquired by teams."
          control={
            <div className="flex rounded-lg border border-brand-border p-0.5">
              {FA_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => set("freeAgencyStyle", style)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                    form.freeAgencyStyle === style
                      ? "bg-brand-dark text-white"
                      : "text-brand-muted hover:text-brand-dark"
                  }`}
                >
                  {FREE_AGENCY_LABEL[style]}
                </button>
              ))}
            </div>
          }
        />
      </SettingsCard>

      <CoCommissioners leagueId={leagueId} canEdit={canEdit} />

      {canEdit ? (
        <SaveBar
          dirty={dirty}
          saving={saving}
          saved={done}
          error={error}
          disabled={uploading}
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
