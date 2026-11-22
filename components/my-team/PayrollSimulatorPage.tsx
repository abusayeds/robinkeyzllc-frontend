"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { FiPlus, FiRotateCcw, FiSave, FiTrash2 } from "react-icons/fi";
import { useMyLeaguesQuery } from "@/lib/store/api/endpoints/leagueApi";
import { useTeamRosterQuery } from "@/lib/store/api/endpoints/rosterApi";
import { usePayrollOutlookQuery } from "@/lib/store/api/endpoints/salaryApi";
import { useLeagueTeamsQuery } from "@/lib/store/api/endpoints/teamApi";
import NumberField from "@/components/ui/NumberField";
import { useAppSelector } from "@/lib/store/hooks";
import { CONTRACTS_SUBNAV } from "./subnav";
import { money } from "@/lib/money";
import { useLeagueSalariesQuery } from "@/lib/store/api/endpoints/salaryApi";

const short = (value: number) => {
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
};

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

/**
 * One column plan for both tables.
 *
 * The summary and the per-player grid are separate tables, one above the
 * other, and a browser sizes each to its own contents — so the same season
 * landed in two different places and the pair read as crooked. Fixed widths,
 * shared by both, put every year in one column down the whole page.
 */
const LABEL_WIDTH = 190;
const YEAR_WIDTH = 124;
const ACTION_WIDTH = 44;

const tableWidth = (seasonCount: number) =>
  LABEL_WIDTH + seasonCount * YEAR_WIDTH + ACTION_WIDTH;

function Columns({ seasons }: { seasons: number[] }) {
  return (
    <colgroup>
      <col style={{ width: LABEL_WIDTH }} />
      {seasons.map((year) => (
        <col key={year} style={{ width: YEAR_WIDTH }} />
      ))}
      <col style={{ width: ACTION_WIDTH }} />
    </colgroup>
  );
}

/** A line in the scenario: either a real contract or one the user invented. */
type ScenarioRow = {
  key: string;
  name: string;
  salaries: Record<number, number>;
  isHypothetical: boolean;
};

export default function PayrollSimulatorPage() {
  const pathname = usePathname();
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data: memberships = [] } = useMyLeaguesQuery(undefined, {
    skip: !leagueId,
  });
  const myTeamId = useMemo(
    () =>
      memberships.find((league) => league.id === leagueId)?.team?.id ?? null,
    [memberships, leagueId],
  );

  const { data: teamList } = useLeagueTeamsQuery(leagueId as number, {
    skip: !leagueId,
  });
  const teams = useMemo(() => teamList?.teams ?? [], [teamList]);

  // An owner simulates their own books and nobody else's: the selector here
  // let them open another team's payroll, which the simulator was never for.
  const activeTeamId = myTeamId;

  const { data: roster } = useTeamRosterQuery(
    { leagueId: leagueId as number, teamId: activeTeamId as number },
    { skip: !leagueId || !activeTeamId },
  );
  const { data: outlook, isLoading } = usePayrollOutlookQuery(
    { leagueId: leagueId as number, teamId: activeTeamId as number },
    { skip: !leagueId || !activeTeamId },
  );

  const seasons = useMemo(
    () => (outlook ? outlook.seasons.map((s) => s.seasonStartYear) : []),
    [outlook],
  );

  /** The real contracts, as the scenario starts out. */
  const baseline = useMemo<ScenarioRow[]>(() => {
    if (!roster) return [];
    return roster.players
      .filter((player) => player.contract)
      .map((player) => ({
        key: `p${player.id}`,
        name: player.name,
        salaries: Object.fromEntries(
          (player.contract?.seasons ?? []).map((season) => [
            season.seasonStartYear,
            season.capHit,
          ]),
        ),
        isHypothetical: false,
      }));
  }, [roster]);

  const [rows, setRows] = useState<ScenarioRow[]>([]);
  const [newName, setNewName] = useState("");

  /**
   * Every contract in the league, so typing a name fills in his real deal.
   *
   * The point of the simulator is planning trades, and that means pricing
   * players who are not on this roster. Without this an owner had to leave the
   * page, read someone's yearly breakdown off the Contracts page and type it
   * back in a season at a time.
   */
  const { data: salaries } = useLeagueSalariesQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );

  const leagueContracts = useMemo(() => {
    const out: {
      key: string;
      name: string;
      teamAbbr: string;
      salaries: Record<number, number>;
    }[] = [];
    for (const team of salaries?.teams ?? []) {
      for (const contract of team.contracts) {
        out.push({
          key: `c${contract.id}`,
          name: contract.name,
          teamAbbr: team.abbr,
          salaries: Object.fromEntries(
            contract.seasons.map((season) => [
              season.seasonStartYear,
              season.capHit,
            ]),
          ),
        });
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [salaries]);

  /** The names worth offering for what has been typed so far. */
  const suggestions = useMemo(() => {
    const needle = newName.trim().toLowerCase();
    if (needle.length < 2) return [];
    const onBoard = new Set(rows.map((row) => row.name.toLowerCase()));
    return leagueContracts
      .filter(
        (row) =>
          row.name.toLowerCase().includes(needle) &&
          !onBoard.has(row.name.toLowerCase()),
      )
      .slice(0, 6);
  }, [newName, leagueContracts, rows]);

  /**
   * A scenario is a plan, not a record, so it is kept in this browser rather
   * than on the server: nobody else should see it, and it must never be
   * mistaken for a contract. It is dropped as soon as the real roster moves.
   */
  const scenarioKey = activeTeamId ? `avora:simulator:${activeTeamId}` : null;
  const [saved, setSaved] = useState(false);

  const saveScenario = () => {
    if (!scenarioKey) return;
    try {
      window.localStorage.setItem(scenarioKey, JSON.stringify(rows));
      setSaved(true);
    } catch {
      // A private window, or storage turned off. The scenario still works on
      // screen; it just will not be here next time.
    }
  };

  // Reset the scenario whenever the real contracts change underneath it —
  // switching team, or an import landing. Editing on top of someone else's
  // roster would be worse than losing the edits.
  useEffect(() => {
    if (!scenarioKey) {
      setRows(baseline);
      return;
    }
    try {
      const stored = window.localStorage.getItem(scenarioKey);
      const parsed = stored ? (JSON.parse(stored) as ScenarioRow[]) : null;
      setRows(Array.isArray(parsed) && parsed.length > 0 ? parsed : baseline);
    } catch {
      setRows(baseline);
    }
    setSaved(false);
  }, [baseline, scenarioKey]);

  const dirty = useMemo(
    () => JSON.stringify(rows) !== JSON.stringify(baseline),
    [rows, baseline],
  );

  const scenarioTotals = useMemo(
    () =>
      seasons.map((year) =>
        rows.reduce((sum, row) => sum + (row.salaries[year] ?? 0), 0),
      ),
    [rows, seasons],
  );

  const setSalary = (key: string, year: number, value: number) =>
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? { ...row, salaries: { ...row.salaries, [year]: value } }
          : row,
      ),
    );

  /**
   * Adds a line to the scenario.
   *
   * With `salaries` it is a real contract copied in, which is what picking a
   * suggestion does; without, it is an empty line to price by hand. Either way
   * it is marked hypothetical, because nothing on this page is a contract.
   */
  const addRow = (name: string, salaries: Record<number, number> = {}) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRows((prev) => [
      ...prev,
      {
        key: `h${Date.now()}`,
        name: trimmed,
        salaries: { ...salaries },
        isHypothetical: true,
      },
    ]);
    setNewName("");
  };

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league to run the simulator.
      </p>
    );
  }

  /** Whether any season in the window has a cap to measure against at all. */
  const hasAnyCap = (outlook?.seasons ?? []).some(
    (season) => season.salaryCap > 0,
  );

  /** The seasons the Super Admin has not entered a cap for yet. */
  const missingCapSeasons = (outlook?.seasons ?? [])
    .filter((season) => season.salaryCap <= 0)
    .map((season) => season.seasonStartYear);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">
            Payroll Simulator
          </h1>
          <p className="text-sm text-brand-muted">
            Change a salary or add a signing and see what it does to the books.
            Saving keeps the scenario for you alone — no contract is touched.
          </p>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-1 border-b border-brand-border">
        {CONTRACTS_SUBNAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`relative px-3 py-2.5 text-sm transition ${
              pathname === item.href
                ? "font-semibold text-brand-cta-dark"
                : "font-medium text-brand-muted hover:text-brand-dark"
            }`}
          >
            {item.label}
            {pathname === item.href ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-cta" />
            ) : null}
          </a>
        ))}
      </nav>

      {isLoading || !outlook ? (
        <p className="text-sm text-brand-muted">Loading…</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-brand-border bg-white shadow-card">
            <table
              className="w-full table-fixed text-sm"
              style={{ minWidth: tableWidth(seasons.length) }}
            >
              <Columns seasons={seasons} />
              <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-2.5">Season</th>
                  {seasons.map((year) => (
                    <th key={year} className="px-3 py-2.5 text-right">
                      {seasonLabel(year)}
                    </th>
                  ))}
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                <tr>
                  <td className="px-4 py-2.5 text-brand-muted">
                    Committed today
                  </td>
                  {outlook.seasons.map((season) => (
                    <td
                      key={season.seasonStartYear}
                      className="px-3 py-2.5 text-right text-brand-dark"
                    >
                      {short(season.committed)}
                    </td>
                  ))}
                  <td />
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-brand-muted">
                    This scenario
                  </td>
                  {scenarioTotals.map((total, index) => {
                    const real = outlook.seasons[index];
                    const extra =
                      real.deadMoney + real.capHolds + total - real.committed;
                    return (
                      <td
                        key={seasons[index]}
                        className="px-3 py-2.5 text-right font-semibold text-brand-dark"
                      >
                        {short(total + real.deadMoney + real.capHolds)}
                        {extra !== 0 ? (
                          <span
                            className={`block text-[11px] font-normal ${
                              extra > 0 ? "text-red-500" : "text-brand-cta-dark"
                            }`}
                          >
                            {extra > 0 ? "+" : ""}
                            {short(extra)}
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                  <td />
                </tr>
                {hasAnyCap ? (
                  <tr>
                    <td className="px-4 py-2.5 text-brand-muted">
                      Cap space
                      <span className="block text-[11px]">
                        against each season&apos;s cap
                      </span>
                    </td>
                    {scenarioTotals.map((total, index) => {
                      const real = outlook.seasons[index];
                      // Article 2 holds a cap per league year. A season the
                      // Super Admin has not entered yet reads 0, and a dash is
                      // the honest answer rather than today's figure.
                      const seasonCap = real.salaryCap;
                      if (seasonCap <= 0) {
                        return (
                          <td
                            key={seasons[index]}
                            className="px-3 py-2.5 text-right text-brand-muted"
                            title="No salary cap entered for this league year."
                          >
                            —
                          </td>
                        );
                      }
                      const space =
                        seasonCap - (total + real.deadMoney + real.capHolds);
                      return (
                        <td
                          key={seasons[index]}
                          className={`px-3 py-2.5 text-right font-semibold ${
                            space < 0 ? "text-red-500" : "text-brand-cta-dark"
                          }`}
                        >
                          {short(space)}
                        </td>
                      );
                    })}
                    <td />
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {hasAnyCap && missingCapSeasons.length > 0 ? (
            <p className="text-[11px] text-brand-muted">
              No salary cap has been entered for{" "}
              {missingCapSeasons.map(seasonLabel).join(", ")}, so cap space is
              not shown for {missingCapSeasons.length === 1 ? "it" : "them"}.
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-brand-border bg-white shadow-card">
            <table
              className="w-full table-fixed text-sm"
              style={{ minWidth: tableWidth(seasons.length) }}
            >
              <Columns seasons={seasons} />
              <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-2.5">Player</th>
                  {seasons.map((year) => (
                    <th key={year} className="px-3 py-2.5 text-right">
                      {seasonLabel(year)}
                    </th>
                  ))}
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className={
                      row.isHypothetical ? "bg-brand-cta/5" : undefined
                    }
                  >
                    <td className="truncate px-4 py-2 font-medium text-brand-dark">
                      {row.name}
                      {row.isHypothetical ? (
                        <span className="ml-1.5 rounded bg-brand-cta/15 px-1 py-0.5 text-[10px] font-bold text-brand-cta-dark">
                          what if
                        </span>
                      ) : null}
                    </td>
                    {seasons.map((year) => (
                      <td key={year} className="px-3 py-1.5">
                        <NumberField
                          value={row.salaries[year] ?? 0}
                          onChange={(value) => setSalary(row.key, year, value)}
                          className="w-full rounded-lg border border-brand-border px-2 py-1 text-right text-xs text-brand-dark outline-none focus:border-brand-cta"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-1.5 text-right">
                      {row.isHypothetical ? (
                        <button
                          type="button"
                          onClick={() =>
                            setRows((prev) =>
                              prev.filter((r) => r.key !== row.key),
                            )
                          }
                          className="rounded p-1 text-brand-muted transition hover:bg-brand-soft hover:text-red-500"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={seasons.length + 2}
                      className="px-4 py-8 text-center text-sm text-brand-muted"
                    >
                      No contracts on this team yet. Add a hypothetical signing
                      below to try something out.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Typing a name offers the players already under contract in
                this league; picking one copies his real deal in, season by
                season. A name nobody matches is still added, as a blank line
                to price by hand. */}
            <div className="relative w-64">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const first = suggestions[0];
                  if (first) addRow(first.name, first.salaries);
                  else addRow(newName);
                }}
                placeholder="Add a player, or a hypothetical signing"
                autoComplete="off"
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
              />

              {suggestions.length > 0 ? (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-brand-border bg-white shadow-card">
                  {suggestions.map((option) => (
                    <li key={option.key}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addRow(option.name, option.salaries)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-brand-soft"
                      >
                        <span className="truncate text-brand-dark">
                          {option.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-brand-muted">
                          {option.teamAbbr}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                const first = suggestions[0];
                if (first) addRow(first.name, first.salaries);
                else addRow(newName);
              }}
              disabled={!newName.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-cta px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
            >
              <FiPlus className="h-4 w-4" />
              Add
            </button>
            {dirty ? (
              <button
                type="button"
                onClick={saveScenario}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-cta/40 bg-brand-cta/10 px-3 py-2 text-sm font-semibold text-brand-cta-dark transition hover:bg-brand-cta/15"
              >
                <FiSave className="h-4 w-4" />
                {saved ? "Saved" : "Save"}
              </button>
            ) : null}
            {dirty ? (
              <button
                type="button"
                onClick={() => {
                  setRows(baseline);
                  setSaved(false);
                  if (scenarioKey) {
                    try {
                      window.localStorage.removeItem(scenarioKey);
                    } catch {
                      // Nothing to undo if it was never stored.
                    }
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
              >
                <FiRotateCcw className="h-4 w-4" />
                Back to the real roster
              </button>
            ) : null}
          </div>

          <p className="text-[11px] text-brand-muted">
            Dead money ({money(outlook.seasons[0]?.deadMoney ?? 0)} this season)
            and cap holds are added to every scenario and cannot be edited here
            — they are not contracts.
          </p>
        </>
      )}
    </div>
  );
}
