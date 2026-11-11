"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { FiPlus, FiRotateCcw, FiTrash2 } from "react-icons/fi";
import { useMyLeaguesQuery } from "@/lib/store/api/endpoints/leagueApi";
import { useTeamRosterQuery } from "@/lib/store/api/endpoints/rosterApi";
import { usePayrollOutlookQuery } from "@/lib/store/api/endpoints/salaryApi";
import { useLeagueTeamsQuery } from "@/lib/store/api/endpoints/teamApi";
import NumberField from "@/components/ui/NumberField";
import { useAppSelector } from "@/lib/store/hooks";
import { CONTRACTS_SUBNAV } from "./subnav";
import TeamSelector from "./TeamSelector";
import { useViewedTeam } from "./viewedTeam";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const short = (value: number) => {
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
};

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

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

  const [activeTeamId, setViewTeamId] = useViewedTeam(myTeamId, teams);

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

  // Reset the scenario whenever the real contracts change underneath it —
  // switching team, or an import landing. Editing on top of someone else's
  // roster would be worse than losing the edits.
  useEffect(() => setRows(baseline), [baseline]);

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

  const addRow = () => {
    const name = newName.trim();
    if (!name) return;
    setRows((prev) => [
      ...prev,
      {
        key: `h${Date.now()}`,
        name,
        salaries: {},
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

  const salaryCap = outlook?.salaryCap ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">
            Payroll Simulator
          </h1>
          <p className="text-sm text-brand-muted">
            Change a salary or add a signing and see what it does to the books.
            Nothing here is saved.
          </p>
        </div>
        {teams.length > 0 ? (
          <TeamSelector
            teams={teams}
            value={activeTeamId}
            onChange={setViewTeamId}
            myTeamId={myTeamId}
          />
        ) : null}
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
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-2.5">Season</th>
                  {seasons.map((year) => (
                    <th key={year} className="px-3 py-2.5 text-right">
                      {seasonLabel(year)}
                    </th>
                  ))}
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
                </tr>
                {salaryCap > 0 ? (
                  <tr>
                    <td className="px-4 py-2.5 text-brand-muted">
                      Cap space
                      <span className="block text-[11px]">
                        against {short(salaryCap)}
                      </span>
                    </td>
                    {scenarioTotals.map((total, index) => {
                      const real = outlook.seasons[index];
                      const space =
                        salaryCap - (total + real.deadMoney + real.capHolds);
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
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {salaryCap > 0 && outlook.capIsCurrentSeasonOnly ? (
            <p className="text-[11px] text-brand-muted">
              Every season is measured against this league&apos;s one salary
              cap. Future caps are not stored, so later seasons assume today
              &apos;s figure.
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-brand-border bg-white shadow-card">
            <table className="w-full min-w-[760px] text-sm">
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
                    <td className="px-4 py-2 font-medium text-brand-dark">
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
                          className="w-28 rounded-lg border border-brand-border px-2 py-1 text-right text-xs text-brand-dark outline-none focus:border-brand-cta"
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
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRow()}
              placeholder="Add a hypothetical signing"
              className="w-56 rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
            />
            <button
              type="button"
              onClick={addRow}
              disabled={!newName.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-cta px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
            >
              <FiPlus className="h-4 w-4" />
              Add
            </button>
            {dirty ? (
              <button
                type="button"
                onClick={() => setRows(baseline)}
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
