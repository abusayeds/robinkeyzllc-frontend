"use client";

import { useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight, FiSearch } from "react-icons/fi";
import {
  TIER_LABEL,
  TIER_TONE,
  seasonTag,
  useLeagueHardCapsQuery,
  useLeagueSalariesQuery,
  type SalaryCap,
  type SalaryContract,
  type SalaryTeam,
  type TeamHardCap,
} from "@/lib/store/api/endpoints/salaryApi";
import {
  useTradeExceptionsQuery,
  type TradeExceptionRow,
} from "@/lib/store/api/endpoints/tradeApi";
import { useAppSelector } from "@/lib/store/hooks";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

/** Compact for the wide cap table, where eight full figures do not fit. */
const short = (value: number) => {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
};

const formatExpiry = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

function CapBar({
  team,
  cap,
  hardCap,
}: {
  team: SalaryTeam;
  cap: SalaryCap;
  hardCap?: TeamHardCap;
}) {
  if (cap.salaryCap <= 0) return null;

  // Measured against the second apron so every team is drawn on one scale and
  // the thresholds sit in the same place on each bar.
  const scale = cap.secondApron || cap.salaryCap;
  const width = Math.min(100, (team.totalCommitted / scale) * 100);
  const capMark = (cap.salaryCap / scale) * 100;
  const taxMark = (cap.luxuryTax / scale) * 100;

  return (
    <div className="relative mt-2 h-1.5 w-full rounded-full bg-brand-soft">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-brand-cta"
        style={{ width: `${width}%` }}
      />
      <span
        className="absolute inset-y-0 w-px bg-brand-muted/60"
        style={{ left: `${capMark}%` }}
        title={`Salary cap ${money(cap.salaryCap)}`}
      />
      <span
        className="absolute inset-y-0 w-px bg-orange-400"
        style={{ left: `${taxMark}%` }}
        title={`Luxury tax ${money(cap.luxuryTax)}`}
      />
      {/* Rule 4.1 — a ceiling the team cannot cross, so it is drawn heavier
          than the thresholds it may pass through. */}
      {hardCap?.ceiling ? (
        <span
          className="absolute -inset-y-0.5 w-0.5 rounded bg-red-500"
          style={{ left: `${(hardCap.ceiling / scale) * 100}%` }}
          title={`Hard cap ${money(hardCap.ceiling)}`}
        />
      ) : null}
    </div>
  );
}

/**
 * Rule 4.7 — the ceiling, the room left under it, and the move that bought it.
 *
 * The reserve is spelled out rather than folded into one figure: a team that
 * looks to have room and is refused anyway is the question this answers
 * (Rule 4.8).
 */
function HardCapNote({ hardCap }: { hardCap: TeamHardCap }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
        Hard cap · {hardCap.apronLabel}
      </p>
      <p
        className={`mt-1 text-xs font-medium ${
          hardCap.pass ? "text-brand-dark" : "text-red-600"
        }`}
      >
        {hardCap.message}
      </p>
      {hardCap.triggerLabel ? (
        <p className="mt-1 text-[11px] text-brand-muted">
          {hardCap.triggerLabel}
        </p>
      ) : null}
      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-brand-muted">
        <div className="flex gap-1">
          <dt className="font-semibold">Ceiling</dt>
          <dd>{hardCap.ceiling === null ? "—" : money(hardCap.ceiling)}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-semibold">Team salary</dt>
          <dd>{money(hardCap.teamSalary)}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-semibold">Roster reserve</dt>
          <dd>
            {money(hardCap.reserve)}
            {hardCap.openSpots > 0
              ? ` · ${hardCap.openSpots} spot${hardCap.openSpots === 1 ? "" : "s"} at ${money(hardCap.rookieMinimum)}`
              : ""}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-semibold">Roster</dt>
          <dd>
            {hardCap.rosterCount} of {hardCap.rosterMinimum} minimum
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * A team's Traded Player Exceptions (Rule 7.6).
 *
 * Read-only: an exception is created and spent by the trade engine, and
 * nothing in Article 7 lets a commissioner write one by hand.
 */
function ExceptionList({
  exceptions,
}: {
  exceptions: TradeExceptionRow[];
}) {
  return (
    <div className="border-t border-brand-border px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
        Trade exceptions ·{" "}
        {money(exceptions.reduce((sum, row) => sum + row.remaining, 0))}{" "}
        remaining
      </p>
      <ul className="mt-1.5 space-y-1">
        {exceptions.map((row) => (
          <li key={row.id} className="flex items-center justify-between text-xs">
            <span className="text-brand-dark">
              {row.label}
              <span className="ml-1.5 text-brand-muted">
                expires {formatExpiry(row.expiresAt)}
              </span>
            </span>
            <span className="text-brand-muted">
              {money(row.remaining)}
              {row.remaining !== row.amount ? ` of ${money(row.amount)}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContractRow({ contract }: { contract: SalaryContract }) {
  const tag = seasonTag(contract);

  return (
    <tr>
      <td className="px-4 py-2.5">
        <p className="flex items-center gap-1.5 font-medium text-brand-dark">
          {contract.name}
          {contract.slotType === "twoWay" ? (
            <span className="inline-flex rounded bg-brand-dark/10 px-1 py-0.5 text-[10px] font-bold text-brand-dark">
              TW
            </span>
          ) : null}
          {contract.rfaOnExpiry ? (
            <span
              className="inline-flex rounded bg-brand-soft px-1 py-0.5 text-[10px] font-bold text-brand-muted"
              title="Restricted free agent when this contract expires"
            >
              RFA
            </span>
          ) : null}
        </p>
        <p className="text-[11px] text-brand-muted">
          {[contract.position, `${contract.birdYears} bird`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </td>
      <td className="px-4 py-2.5 text-center text-brand-muted">
        {contract.years}
      </td>
      <td className="px-4 py-2.5 text-center">
        {tag ? (
          <span className="inline-flex rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-muted">
            {tag}
          </span>
        ) : (
          <span className="text-brand-border">—</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right text-brand-dark">
        {money(contract.capHit)}
      </td>
    </tr>
  );
}

function TeamPanel({
  team,
  cap,
  hardCap,
  exceptions,
}: {
  team: SalaryTeam;
  cap: SalaryCap;
  hardCap?: TeamHardCap;
  exceptions: TradeExceptionRow[];
}) {
  const [open, setOpen] = useState(false);

  const capped = hardCap?.apron ? hardCap : undefined;

  const hasDetail =
    team.contracts.length > 0 ||
    team.deadMoneyRows.length > 0 ||
    team.capHoldRows.length > 0 ||
    exceptions.length > 0 ||
    capped !== undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={!hasDetail}
        className="w-full px-4 py-3 text-left transition hover:bg-brand-soft/40 disabled:cursor-default disabled:hover:bg-transparent"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {hasDetail ? (
              open ? (
                <FiChevronDown className="h-4 w-4 text-brand-muted" />
              ) : (
                <FiChevronRight className="h-4 w-4 text-brand-muted" />
              )
            ) : (
              <span className="h-4 w-4" />
            )}
            <span
              className="h-8 w-1.5 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            <div>
              <p className="text-sm font-semibold text-brand-dark">
                {team.name}
              </p>
              <p className="text-[11px] text-brand-muted">
                {team.abbr} · {team.contractCount} contract
                {team.contractCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                Committed
              </p>
              <p className="text-sm font-semibold text-brand-dark">
                {money(team.totalCommitted)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                Cap space
              </p>
              <p
                className={`text-sm font-semibold ${
                  team.capSpace === null
                    ? "text-brand-muted"
                    : team.capSpace < 0
                      ? "text-red-500"
                      : "text-brand-dark"
                }`}
              >
                {team.capSpace === null ? "—" : money(team.capSpace)}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${TIER_TONE[team.tier]}`}
            >
              {TIER_LABEL[team.tier]}
            </span>
            {capped ? (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  capped.pass
                    ? "bg-red-50 text-red-600"
                    : "bg-red-600 text-white"
                }`}
                title={capped.message}
              >
                Hard cap · {capped.apronLabel}
                {capped.room === null
                  ? ""
                  : capped.pass
                    ? ` · ${short(capped.room)} room`
                    : ` · ${short(capped.shortfall)} over`}
              </span>
            ) : null}
          </div>
        </div>
        <CapBar team={team} cap={cap} hardCap={capped} />
      </button>

      {open ? (
        <div className="border-t border-brand-border">
          {capped ? <HardCapNote hardCap={capped} /> : null}

          {team.contracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                  <tr>
                    <th className="px-4 py-2">Player</th>
                    <th className="px-4 py-2 text-center">Yrs</th>
                    <th className="px-4 py-2 text-center">Tag</th>
                    <th className="px-4 py-2 text-right">Cap hit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {team.contracts.map((contract) => (
                    <ContractRow key={contract.id} contract={contract} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {team.deadMoneyRows.length > 0 ? (
            <div className="border-t border-brand-border px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                Dead money · {money(team.deadMoney)}
              </p>
              <ul className="mt-1.5 space-y-1">
                {team.deadMoneyRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-brand-dark">
                      {row.name}
                      {row.isStretched ? (
                        <span className="ml-1.5 text-brand-muted">
                          stretched
                        </span>
                      ) : null}
                    </span>
                    <span className="text-brand-muted">{money(row.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {team.capHoldRows.length > 0 ? (
            <div className="border-t border-brand-border px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                Cap holds · {money(team.capHolds)}
              </p>
              <ul className="mt-1.5 space-y-1">
                {team.capHoldRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-brand-dark">
                      {row.name}
                      {row.isQualifyingOffer ? (
                        <span className="ml-1.5 text-brand-muted">
                          qualifying offer
                        </span>
                      ) : null}
                    </span>
                    <span className="text-brand-muted">
                      {row.amount === 0 ? "to be set" : money(row.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {exceptions.length > 0 ? (
            <ExceptionList exceptions={exceptions} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function SalaryManagementPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data, isLoading } = useLeagueSalariesQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );

  const { data: hardCaps } = useLeagueHardCapsQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );

  const { data: exceptions = [] } = useTradeExceptionsQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );

  const [term, setTerm] = useState("");

  const hardCapByTeamId = useMemo(
    () => new Map((hardCaps?.teams ?? []).map((row) => [row.team.id, row])),
    [hardCaps],
  );

  const exceptionsByTeamId = useMemo(() => {
    const map = new Map<number, TradeExceptionRow[]>();
    for (const row of exceptions) {
      const list = map.get(row.team.id);
      if (list) list.push(row);
      else map.set(row.team.id, [row]);
    }
    return map;
  }, [exceptions]);

  // Rule 4.1 — a hard cap binds absolutely, so a team that has one is worth
  // saying out loud rather than leaving folded inside a panel.
  const cappedTeams = useMemo(
    () => (hardCaps?.teams ?? []).filter((row) => row.apron !== null),
    [hardCaps],
  );

  const teams = useMemo(() => {
    const all = data?.teams ?? [];
    const needle = term.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      (team) =>
        team.name.toLowerCase().includes(needle) ||
        team.abbr.toLowerCase().includes(needle) ||
        team.contracts.some((c) => c.name.toLowerCase().includes(needle)),
    );
  }, [data, term]);

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league to see its cap sheet.
      </p>
    );
  }

  const cap = data?.cap;
  const capIsSet = (cap?.salaryCap ?? 0) > 0;
  const anyContracts = (data?.teams ?? []).some((t) => t.contractCount > 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">
            Salary Management
          </h1>
          <p className="text-sm text-brand-muted">
            What every team has committed for{" "}
            {data ? seasonLabel(data.seasonStartYear) : "this season"}.
          </p>
        </div>
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search teams or players"
            className="w-60 rounded-lg border border-brand-border py-2 pl-9 pr-3 text-sm text-brand-dark outline-none focus:border-brand-cta"
          />
        </div>
      </div>

      {cap && !capIsSet ? (
        <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          This league has no salary cap set, so nothing can be measured against
          one. Set it in Salary Cap Settings.
        </div>
      ) : null}

      {cap && capIsSet ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Salary cap", value: cap.salaryCap },
            { label: "Floor", value: cap.salaryFloor },
            { label: "Luxury tax", value: cap.luxuryTax },
            { label: "First apron", value: cap.firstApron },
            { label: "Second apron", value: cap.secondApron },
            { label: "Max 0-6 yrs", value: cap.maxSalary0to6 },
            { label: "Max 10+ yrs", value: cap.maxSalary10Plus },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-brand-border bg-white p-3 shadow-card"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                {stat.label}
              </p>
              <p className="mt-0.5 text-lg font-bold text-brand-dark">
                {short(stat.value)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {cappedTeams.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <span className="font-semibold">
            {cappedTeams.length} team{cappedTeams.length === 1 ? "" : "s"}{" "}
            hard-capped this league year.
          </span>{" "}
          {cappedTeams
            .map(
              (row) =>
                `${row.team.abbr} (${row.apronLabel}${
                  row.pass ? "" : ", over"
                })`,
            )
            .join(" · ")}
        </div>
      ) : null}

      {isLoading ? <p className="text-sm text-brand-muted">Loading…</p> : null}

      {!isLoading && !anyContracts ? (
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-dark">
            No contracts in this league yet.
          </p>
          <p className="mt-1 text-sm text-brand-muted">
            Contracts arrive with Player Import, and change after that through
            trades and free agency.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {cap
          ? teams.map((team) => (
              <TeamPanel
                key={team.id}
                team={team}
                cap={cap}
                hardCap={hardCapByTeamId.get(team.id)}
                exceptions={exceptionsByTeamId.get(team.id) ?? []}
              />
            ))
          : null}
      </div>
    </div>
  );
}
