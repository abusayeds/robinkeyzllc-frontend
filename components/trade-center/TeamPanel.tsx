"use client";

import { useState } from "react";
import { FiChevronDown, FiChevronRight, FiPlus, FiX } from "react-icons/fi";
import type { EvaluatedTeam } from "@/lib/store/api/endpoints/tradeApi";
import { TIER_LABEL, type Tier } from "@/lib/store/api/endpoints/salaryApi";
import TeamLogo from "@/components/ui/TeamLogo";

/** The trade center shows whole dollars, never an abbreviated figure. */
const money = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

const signed = (value: number) =>
  `${value >= 0 ? "+" : "-"}${money(Math.abs(value))}`;

/** Rule 12.6 — what happens in the year a protection holds. */
export type ProtectionOutcome = "rollover" | "convert" | "end";

export type PickedAsset = {
  kind: "player" | "tradeException" | "draftPick";
  fromTeamId: number;
  /** Null until a destination is chosen, which only matters above two teams. */
  toTeamId: number | null;
  leaguePlayerId?: number;
  tradeExceptionId?: number;
  draftPickId?: number;
  label: string;
  /** What it adds to the salary-matching sum. Zero for a pick. */
  salary: number;
  /** Shown under the name, e.g. the position or "via BOS". */
  sub?: string;
  /** The draft this pick is in, so a rollover year can be offered. */
  pickYear?: number;

  // Rules 12.5-12.7 — the terms the two owners agree on for this pick.
  protectedTopN?: number | null;
  protectionOutcome?: ProtectionOutcome | null;
  protectionFinalYear?: number | null;
  protectionNote?: string | null;
};

/**
 * Rule 12.5 — the covers owners actually use. Top-14 is "lottery protected"
 * because that is what everyone calls it; the rule is the same.
 */
export const PROTECTION_OPTIONS: {
  topN: number | null;
  label: string;
  blurb: string;
}[] = [
  {
    topN: null,
    label: "Unprotected",
    blurb: "Conveys wherever it lands.",
  },
  {
    topN: 14,
    label: "Lottery Protected",
    blurb: "Conveys only outside the lottery, picks 15-30.",
  },
  {
    topN: 5,
    label: "Top-5 Protected",
    blurb: "Stays put if it lands in the top 5.",
  },
  {
    topN: 10,
    label: "Top-10 Protected",
    blurb: "Stays put if it lands in the top 10.",
  },
];

/** Rule 12.6 — what the obligation becomes when the protection holds. */
export const PROTECTION_OUTCOMES: {
  value: ProtectionOutcome;
  label: string;
}[] = [
  { value: "rollover", label: "Rolls over to a later draft" },
  { value: "convert", label: "Converts to a second-round pick" },
  { value: "end", label: "Obligation ends" },
];

export const assetKey = (asset: PickedAsset) =>
  asset.kind === "player"
    ? `p${asset.leaguePlayerId}`
    : asset.kind === "draftPick"
      ? `d${asset.draftPickId}`
      : `e${asset.tradeExceptionId}`;

/** The tier badge colour, from where the team lands after the trade. */
const TIER_TONE: Record<string, string> = {
  belowCap: "bg-brand-cta/15 text-brand-cta-dark",
  overCap: "bg-brand-soft text-brand-muted",
  luxuryTax: "bg-amber-100 text-amber-700",
  firstApron: "bg-orange-100 text-orange-700",
  secondApron: "bg-red-100 text-red-600",
  capNotSet: "bg-brand-soft text-brand-muted",
};

export type TeamCard = {
  id: number;
  name: string;
  abbr: string;
  logo: string | null;
};

export default function TeamPanel({
  team,
  isMine,
  record,
  place,
  evaluation,
  sending,
  receiving,
  otherTeams,
  onAddAsset,
  onRemoveAsset,
  onRetarget,
  onProtect,
  onRemoveTeam,
  canRemoveTeam,
}: {
  team: TeamCard;
  isMine: boolean;
  record: string | null;
  place: string | null;
  evaluation: EvaluatedTeam | null;
  sending: PickedAsset[];
  receiving: PickedAsset[];
  otherTeams: TeamCard[];
  onAddAsset: () => void;
  onRemoveAsset: (asset: PickedAsset) => void;
  onRetarget: (asset: PickedAsset, toTeamId: number) => void;
  /** Rules 12.5-12.7 — the pick's agreed terms changed on the card. */
  onProtect: (asset: PickedAsset, terms: ProtectionTerms) => void;
  onRemoveTeam: () => void;
  canRemoveTeam: boolean;
}) {
  const sendingTotal = sending.reduce((sum, asset) => sum + asset.salary, 0);
  const receivingTotal = receiving.reduce((sum, asset) => sum + asset.salary, 0);

  const tier = evaluation?.tier ?? "capNotSet";

  return (
    <div className="flex flex-col rounded-xl border border-brand-border bg-white shadow-card">
      <div className="border-b border-brand-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TeamLogo
              name={team.name}
              src={team.logo}
              className="h-7 w-7 shrink-0"
            />
            <p className="truncate text-sm font-bold text-brand-dark">
              {team.name}
            </p>
            {isMine ? (
              <span className="shrink-0 rounded-full bg-brand-cta/15 px-2 py-0.5 text-[10px] font-bold text-brand-cta-dark">
                +You
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                TIER_TONE[tier] ?? TIER_TONE.capNotSet
              }`}
            >
              {evaluation?.tierLabel ?? TIER_LABEL[tier as Tier] ?? tier}
            </span>
            {canRemoveTeam ? (
              <button
                type="button"
                onClick={onRemoveTeam}
                aria-label={`Remove ${team.name}`}
                className="rounded p-0.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
              >
                <FiX className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-1 text-[11px] text-brand-muted">
          {record ?? "No games played"}
          {place ? ` · ${place} Place` : ""}
        </p>
      </div>

      <div className="flex-1 space-y-2 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
          Sending ({sending.length} asset{sending.length === 1 ? "" : "s"} ·{" "}
          {money(sendingTotal)})
        </p>

        {sending.map((asset) => (
          <AssetRow
            key={assetKey(asset)}
            asset={asset}
            otherTeams={otherTeams}
            onRemove={() => onRemoveAsset(asset)}
            onRetarget={(toTeamId) => onRetarget(asset, toTeamId)}
            onProtect={(terms) => onProtect(asset, terms)}
          />
        ))}

        {receiving.length > 0 ? (
          <>
            <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
              Receiving ({receiving.length} asset
              {receiving.length === 1 ? "" : "s"} · {money(receivingTotal)})
            </p>
            {receiving.map((asset) => (
              <div
                key={assetKey(asset)}
                className="flex items-center justify-between gap-2 rounded-lg border border-brand-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-dark">
                    {asset.label}
                  </p>
                  {asset.salary > 0 ? (
                    <p className="text-[11px] text-brand-muted">
                      {money(asset.salary)}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs font-semibold text-brand-cta-dark">
                  + In
                </span>
              </div>
            ))}
          </>
        ) : null}

        <button
          type="button"
          onClick={onAddAsset}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-cta/50 px-3 py-2 text-xs font-semibold text-brand-cta-dark transition hover:bg-brand-cta/5"
        >
          <FiPlus className="h-3.5 w-3.5" /> Add Player or Draft Pick
        </button>
      </div>

      <div className="border-t border-brand-border px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
          {team.name} · Post-Trade Cap Summary
        </p>

        {evaluation ? (
          <>
            {/* The move the trade makes, before any of the figures behind it. */}
            {evaluation.tierChanged ? (
              <p className="mb-2 flex flex-wrap items-center gap-1 text-xs font-semibold text-brand-dark">
                <span className="text-brand-muted">
                  {evaluation.tierBeforeLabel}
                </span>
                <span className="text-brand-muted">→</span>
                <span>{evaluation.tierLabel}</span>
              </p>
            ) : null}

            <dl className="space-y-1 text-xs">
              <Row label="Players In" value={String(evaluation.playersIn)} />
              <Row label="Players Out" value={String(evaluation.playersOut)} />
              <Row
                label="Incoming Sal"
                value={money(evaluation.incoming)}
                tone="text-brand-cta-dark"
              />
              <Row
                label="Outgoing Sal"
                value={money(evaluation.outgoing)}
                tone="text-red-500"
              />
              <Row
                label="Cap Impact"
                value={signed(evaluation.capImpact)}
                tone={
                  evaluation.capImpact > 0
                    ? "text-red-500"
                    : "text-brand-cta-dark"
                }
              />
              <Row label="Salary Total" value={money(evaluation.salaryAfter)} />

              {evaluation.lines.map((line) => (
                <Row
                  key={line.label}
                  label={line.label}
                  value={`${money(line.difference)} ${line.isOver ? "Over" : "Under"}`}
                  tone={line.isOver ? "text-red-500" : "text-brand-cta-dark"}
                />
              ))}

              <Row
                label="Roster"
                value={`${evaluation.rosterAfter} of ${evaluation.maxRosterSize}`}
                tone={
                  evaluation.rosterAfter > evaluation.maxRosterSize ||
                  (evaluation.rosterMinimum > 0 &&
                    evaluation.rosterAfter < evaluation.rosterMinimum)
                    ? "text-red-500"
                    : "text-brand-dark"
                }
              />

              {evaluation.maxIncoming !== null ? (
                <div className="flex justify-between gap-2">
                  <dt className="min-w-0 text-brand-muted">
                    Max Incoming
                    {evaluation.maxIncomingRule ? (
                      <span className="block text-[10px] leading-tight text-brand-muted/80">
                        {evaluation.maxIncomingRule}
                      </span>
                    ) : null}
                  </dt>
                  <dd
                    className={`shrink-0 font-semibold ${
                      evaluation.incoming > evaluation.maxIncoming
                        ? "text-red-500"
                        : "text-brand-dark"
                    }`}
                  >
                    {money(evaluation.maxIncoming)}
                  </dd>
                </div>
              ) : null}

              {evaluation.hardCap ? (
                <Row
                  label="Hard Cap"
                  value={`${evaluation.hardCap.label} · ${money(evaluation.hardCap.amount)}`}
                  tone="text-orange-700"
                />
              ) : null}
            </dl>
          </>
        ) : (
          <p className="text-xs text-brand-muted">Working out the numbers…</p>
        )}
      </div>
    </div>
  );
}

export type ProtectionTerms = {
  protectedTopN: number | null;
  protectionOutcome: ProtectionOutcome | null;
  protectionFinalYear: number | null;
  protectionNote: string | null;
};

/** Rules 12.5-12.7 in one line, the same wording the server uses. */
function protectionSummary(asset: PickedAsset): string {
  if (!asset.protectedTopN) return "Unprotected";
  const cover =
    asset.protectedTopN === 14
      ? "Lottery protected"
      : `Top-${asset.protectedTopN} protected`;
  switch (asset.protectionOutcome) {
    case "rollover":
      return asset.protectionFinalYear
        ? `${cover}, rolls over to ${asset.protectionFinalYear} unprotected`
        : `${cover}, rolls over`;
    case "convert":
      return `${cover}, converts to a second-round pick`;
    case "end":
      return `${cover}, obligation ends if it holds`;
    default:
      return `${cover} — needs an outcome`;
  }
}

/**
 * One asset on its way out, with the pick terms folded away underneath.
 *
 * Only a pick expands: a player carries no terms, and a row that opens onto
 * nothing invites a click that does not pay off.
 */
function AssetRow({
  asset,
  otherTeams,
  onRemove,
  onRetarget,
  onProtect,
}: {
  asset: PickedAsset;
  otherTeams: TeamCard[];
  onRemove: () => void;
  onRetarget: (toTeamId: number) => void;
  onProtect: (terms: ProtectionTerms) => void;
}) {
  const [open, setOpen] = useState(false);
  const isPick = asset.kind === "draftPick";
  const protectedPick = Boolean(asset.protectedTopN);

  // Rule 12.7 — a rollover has to name a year after the draft the pick is in.
  const rolloverYears = asset.pickYear
    ? [1, 2, 3, 4].map((step) => (asset.pickYear as number) + step)
    : [];

  const setTerms = (patch: Partial<ProtectionTerms>) =>
    onProtect({
      protectedTopN: asset.protectedTopN ?? null,
      protectionOutcome: asset.protectionOutcome ?? null,
      protectionFinalYear: asset.protectionFinalYear ?? null,
      protectionNote: asset.protectionNote ?? null,
      ...patch,
    });

  return (
    <div className="rounded-lg border border-brand-border bg-brand-soft/40 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          disabled={!isPick}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={isPick ? open : undefined}
          className="min-w-0 flex-1 text-left disabled:cursor-default"
        >
          <p className="truncate text-sm font-medium text-brand-dark">
            {asset.label}
            {asset.sub ? (
              <span className="ml-1.5 text-[10px] font-semibold text-brand-muted">
                {asset.sub}
              </span>
            ) : null}
          </p>
          <p className="flex items-center gap-1 truncate text-[11px] text-brand-muted">
            {isPick ? (
              <>
                {open ? (
                  <FiChevronDown className="h-3 w-3 shrink-0" />
                ) : (
                  <FiChevronRight className="h-3 w-3 shrink-0" />
                )}
                <span
                  className={
                    protectedPick && !asset.protectionOutcome
                      ? "text-amber-600"
                      : undefined
                  }
                >
                  {protectionSummary(asset)}
                </span>
              </>
            ) : asset.kind === "player" ? (
              money(asset.salary)
            ) : (
              `Trade exception · ${money(asset.salary)}`
            )}
          </p>
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${asset.label}`}
          className="shrink-0 rounded p-0.5 text-brand-muted transition hover:text-red-500"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      {otherTeams.length > 1 ? (
        <div className="mt-1.5">
          <p className="text-[10px] text-brand-muted">Going to:</p>
          <select
            value={asset.toTeamId ?? ""}
            onChange={(e) => onRetarget(Number(e.target.value))}
            className={`mt-0.5 w-full rounded-md border bg-white px-2 py-1 text-xs outline-none focus:border-brand-cta ${
              asset.toTeamId ? "border-brand-border" : "border-amber-400"
            }`}
          >
            <option value="" disabled>
              Select team…
            </option>
            {otherTeams.map((other) => (
              <option key={other.id} value={other.id}>
                {other.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {isPick && open ? (
        <div className="mt-2 border-t border-brand-border pt-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
            Protection
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {PROTECTION_OPTIONS.map((option) => {
              const active = (asset.protectedTopN ?? null) === option.topN;
              return (
                <button
                  key={option.label}
                  type="button"
                  title={option.blurb}
                  onClick={() =>
                    setTerms(
                      option.topN === null
                        ? {
                            protectedTopN: null,
                            protectionOutcome: null,
                            protectionFinalYear: null,
                          }
                        : {
                            protectedTopN: option.topN,
                            // A protection with no outcome is an obligation
                            // nobody can settle, so one is chosen up front.
                            protectionOutcome:
                              asset.protectionOutcome ?? "convert",
                          },
                    )
                  }
                  className={`rounded-lg border px-2 py-1.5 text-left text-[11px] transition ${
                    active
                      ? "border-brand-cta bg-brand-cta/10 text-brand-cta-dark"
                      : "border-brand-border text-brand-dark hover:bg-white"
                  }`}
                >
                  <span className="block font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>

          {protectedPick ? (
            <>
              <label className="mt-2 block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                  If the protection holds
                </span>
                <select
                  value={asset.protectionOutcome ?? "convert"}
                  onChange={(e) =>
                    setTerms({
                      protectionOutcome: e.target
                        .value as ProtectionOutcome,
                      protectionFinalYear:
                        e.target.value === "rollover"
                          ? (asset.protectionFinalYear ??
                            rolloverYears[0] ??
                            null)
                          : null,
                    })
                  }
                  className="w-full rounded-md border border-brand-border bg-white px-2 py-1 text-xs outline-none focus:border-brand-cta"
                >
                  {PROTECTION_OUTCOMES.map((outcome) => (
                    <option key={outcome.value} value={outcome.value}>
                      {outcome.label}
                    </option>
                  ))}
                </select>
              </label>

              {asset.protectionOutcome === "rollover" &&
              rolloverYears.length > 0 ? (
                <label className="mt-2 block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                    Conveys unprotected in
                  </span>
                  <select
                    value={
                      asset.protectionFinalYear ?? rolloverYears[0]
                    }
                    onChange={(e) =>
                      setTerms({
                        protectionFinalYear: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-md border border-brand-border bg-white px-2 py-1 text-xs outline-none focus:border-brand-cta"
                  >
                    {rolloverYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </>
          ) : null}

          <label className="mt-2 block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Protection Notes (Optional)
            </span>
            <textarea
              value={asset.protectionNote ?? ""}
              onChange={(e) =>
                setTerms({ protectionNote: e.target.value || null })
              }
              maxLength={280}
              rows={2}
              placeholder="Anything the fields above cannot hold…"
              className="w-full resize-none rounded-md border border-brand-border bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-cta"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  tone = "text-brand-dark",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-brand-muted">{label}</dt>
      <dd className={`font-semibold ${tone}`}>{value}</dd>
    </div>
  );
}
