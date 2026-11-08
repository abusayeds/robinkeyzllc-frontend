"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DraftPicksTable from "@/components/transactions/DraftPicksTable";
import { pickRowsForTeam } from "@/components/transactions/pickRows";
import { useDraftPicksQuery } from "@/lib/store/api/endpoints/draftApi";
import { useMyLeaguesQuery } from "@/lib/store/api/endpoints/leagueApi";
import { useLeagueTeamsQuery } from "@/lib/store/api/endpoints/teamApi";
import { useTradeExceptionsQuery } from "@/lib/store/api/endpoints/tradeApi";
import { useAppSelector } from "@/lib/store/hooks";
import TeamSelector from "./TeamSelector";
import { CONTRACTS_SUBNAV } from "./subnav";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

/**
 * Rule 7.6 — a TPE lasts a year from the day it was created.
 *
 * `isActive` and `remaining` come from the server; the label is worked out here
 * because it is only ever shown.
 */
function exceptionStatus(row: { remaining: number; expiresAt: string }) {
  if (new Date(row.expiresAt).getTime() < Date.now()) return "Expired";
  return row.remaining > 0 ? "Active" : "Used";
}

export default function DraftPicksPage() {
  const pathname = usePathname();
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data: memberships = [] } = useMyLeaguesQuery(undefined, {
    skip: !leagueId,
  });
  const myTeamId = useMemo(
    () => memberships.find((league) => league.id === leagueId)?.team?.id ?? null,
    [memberships, leagueId],
  );

  const { data: teams = [] } = useLeagueTeamsQuery(leagueId as number, {
    skip: !leagueId,
  });

  const [viewTeamId, setViewTeamId] = useState<number | null>(null);
  const teamId = viewTeamId ?? myTeamId ?? teams[0]?.id ?? null;
  const team = teams.find((t) => t.id === teamId);

  const { data: inventory, isLoading } = useDraftPicksQuery(
    leagueId as number,
    { skip: !leagueId },
  );

  const { data: exceptions = [] } = useTradeExceptionsQuery(
    { leagueId: leagueId as number, teamId: teamId as number },
    { skip: !leagueId || !teamId },
  );

  const picks = useMemo(
    () => pickRowsForTeam(inventory, teamId),
    [inventory, teamId],
  );

  function exportPicks() {
    const header = [
      "Year",
      "Round",
      "Pick",
      "Source",
      "Protection",
      "Notes",
    ];
    const rows = picks.map((pick) => [
      pick.year,
      pick.round,
      pick.pick,
      pick.source,
      pick.protectionText,
      pick.notes,
    ]);

    const escape = (value: string | number) => {
      const text = String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const csv = [header, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${team?.abbr ?? "team"}-draft-picks.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to see its draft picks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">
            Draft Picks &amp; Ownership
          </h1>
          <p className="text-sm text-brand-muted">
            All Picks · {team?.name ?? "—"}
          </p>
        </div>
        <TeamSelector
          teams={teams}
          value={teamId}
          onChange={setViewTeamId}
          myTeamId={myTeamId}
        />
      </div>

      <div className="flex flex-wrap border-b border-brand-border">
        {CONTRACTS_SUBNAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-3 py-2.5 text-sm transition ${
                active
                  ? "font-semibold text-brand-cta-dark"
                  : "font-medium text-brand-muted hover:text-brand-dark"
              }`}
            >
              {item.label}
              {active ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-cta" />
              ) : null}
            </Link>
          );
        })}
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-muted">Loading draft picks…</p>
      ) : (
        <DraftPicksTable
          picks={picks}
          lastSynced={
            inventory ? `${inventory.currentSeasonStartYear} league year` : "—"
          }
          onExport={picks.length > 0 ? exportPicks : undefined}
        />
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-brand-dark">
          Traded Player Exceptions
        </h2>
        <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
          {exceptions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-brand-muted">
              This team holds no trade exceptions. One is created when a team
              sends out more salary than it takes back (Rule 7.6).
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-soft text-[11px] uppercase tracking-[0.08em] text-brand-muted">
                    <th className="px-4 py-2.5 text-left font-semibold">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold">
                      Date Created
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold">
                      Expiration Date
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {exceptions.map((tpe) => {
                    const status = exceptionStatus(tpe);
                    return (
                      <tr key={tpe.id} className="hover:bg-brand-soft/60">
                        <td className="px-4 py-3 font-medium text-brand-dark">
                          {tpe.label}
                        </td>
                        <td className="px-4 py-3 text-brand-muted">
                          {/* A TPE expires a year after it was made, so the
                              creation date is the expiry less a year. */}
                          {formatDate(
                            new Date(
                              new Date(tpe.expiresAt).setUTCFullYear(
                                new Date(tpe.expiresAt).getUTCFullYear() - 1,
                              ),
                            ).toISOString(),
                          )}
                        </td>
                        <td className="px-4 py-3 text-brand-muted">
                          {formatDate(tpe.expiresAt)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-brand-cta-dark">
                          {money(tpe.remaining)}
                          {tpe.remaining !== tpe.amount ? (
                            <span className="ml-1 text-xs font-normal text-brand-muted">
                              of {money(tpe.amount)}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold ${
                              status === "Active"
                                ? "text-brand-cta-dark"
                                : "text-brand-muted"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="border-t border-brand-border px-4 py-2.5 text-xs text-brand-muted">
            TPEs expire 1 year from the date created. Use in a trade to absorb
            salary.
          </p>
        </div>
      </div>
    </div>
  );
}
