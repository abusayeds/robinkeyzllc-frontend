"use client";

import { useMemo, useState } from "react";
import { FiCheck, FiEdit2, FiX } from "react-icons/fi";
import {
  BIRD_LABEL,
  useFreeAgentPoolQuery,
  type FreeAgent,
} from "@/lib/store/api/endpoints/freeAgencyApi";
import { useEditPlayerServiceMutation } from "@/lib/store/api/endpoints/salaryApi";
import { useLeagueTeamsQuery } from "@/lib/store/api/endpoints/teamApi";
import { money } from "@/lib/money";

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

type Draft = {
  yearsOfService: string;
  birdYears: string;
  birdRightsTeamId: string;
};

const draftOf = (row: FreeAgent): Draft => ({
  yearsOfService: row.experience === null ? "" : String(row.experience),
  birdYears: String(row.birdYears),
  birdRightsTeamId: row.birdRightsTeam ? String(row.birdRightsTeam.id) : "",
});

/**
 * The league's free agents, with the three figures no feed can supply.
 *
 * Years of service and bird years decide which contracts a player is even
 * offered, and bird years are earned under a team that may no longer roster
 * him, so all three are the commissioner's to set.
 */
export default function FreeAgentRosterTable({
  leagueId,
  canEdit,
}: {
  leagueId: number;
  canEdit: boolean;
}) {
  const { data, isLoading } = useFreeAgentPoolQuery({ leagueId });
  const { data: teamList } = useLeagueTeamsQuery(leagueId);
  const [save, { isLoading: saving }] = useEditPlayerServiceMutation();

  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [type, setType] = useState<"all" | "UFA" | "RFA">("all");

  const teams = useMemo(() => teamList?.teams ?? [], [teamList]);

  const rows = useMemo(() => {
    const all = data?.players ?? [];
    const needle = term.trim().toLowerCase();
    return all.filter((row) => {
      if (type !== "all" && row.faType !== type) return false;
      if (!needle) return true;
      return row.name.toLowerCase().includes(needle);
    });
  }, [data, term, type]);

  const begin = (row: FreeAgent) => {
    setError(null);
    setEditing(row.leaguePlayerId);
    setDraft(draftOf(row));
  };

  const cancel = () => {
    setEditing(null);
    setDraft(null);
  };

  const commit = async (row: FreeAgent) => {
    if (!draft) return;
    setError(null);

    // Only what actually changed is sent: the endpoint treats a missing
    // field as "leave it alone", which is not the same as sending the old
    // value back and clearing the estimated flag with it.
    const body: {
      birdYears?: number;
      yearsOfService?: number;
      birdRightsTeamId?: number | null;
    } = {};

    const birdYears = Number(draft.birdYears);
    if (Number.isFinite(birdYears) && birdYears !== row.birdYears) {
      body.birdYears = birdYears;
    }

    if (draft.yearsOfService.trim() !== "") {
      const years = Number(draft.yearsOfService);
      if (Number.isFinite(years) && years !== row.experience) {
        body.yearsOfService = years;
      }
    }

    const picked =
      draft.birdRightsTeamId === "" ? null : Number(draft.birdRightsTeamId);
    if (picked !== (row.birdRightsTeam?.id ?? null)) {
      body.birdRightsTeamId = picked;
    }

    if (Object.keys(body).length === 0) {
      cancel();
      return;
    }

    try {
      await save({
        leagueId,
        leaguePlayerId: row.leaguePlayerId,
        ...body,
      }).unwrap();
      cancel();
    } catch (e) {
      setError(errorText(e, "That player could not be updated."));
    }
  };

  if (isLoading) {
    return <p className="text-sm text-brand-muted">Loading free agents…</p>;
  }

  if ((data?.players.length ?? 0) === 0) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-8 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No free agents in this league.
        </p>
        <p className="mt-1 text-sm text-brand-muted">
          Players appear here once they are waived, their contracts expire, or
          an import leaves them unsigned.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "UFA", "RFA"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              type === value
                ? "bg-brand-cta text-white"
                : "border border-brand-border text-brand-muted hover:bg-brand-soft"
            }`}
          >
            {value === "all" ? "All" : value}
          </button>
        ))}
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search free agents"
          className="ml-auto w-56 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-dark outline-none focus:border-brand-cta"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand-border bg-white shadow-card">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
              <th className="px-4 py-2.5">Player</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Last salary</th>
              <th className="px-4 py-2.5">Service yrs</th>
              <th className="px-4 py-2.5">Bird yrs</th>
              <th className="px-4 py-2.5">Bird rights held by</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const open = editing === row.leaguePlayerId;
              return (
                <tr
                  key={row.leaguePlayerId}
                  className="border-b border-brand-border/60 last:border-0"
                >
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-brand-dark">{row.name}</p>
                    <p className="text-[11px] text-brand-muted">
                      {row.position ?? "—"}
                      {row.nbaTeam ? ` · ${row.nbaTeam}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        row.faType === "RFA"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-brand-soft text-brand-muted"
                      }`}
                    >
                      {row.faType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-brand-muted">
                    {row.previousSalary === null
                      ? "—"
                      : money(row.previousSalary)}
                  </td>

                  <td className="px-4 py-2.5">
                    {open && draft ? (
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={draft.yearsOfService}
                        onChange={(e) =>
                          setDraft({ ...draft, yearsOfService: e.target.value })
                        }
                        className="w-20 rounded border border-brand-border px-2 py-1 text-sm outline-none focus:border-brand-cta"
                      />
                    ) : (
                      <span className="text-brand-dark">
                        {row.experience ?? "—"}
                        {row.experienceIsEstimated &&
                        row.experience !== null ? (
                          <span
                            title="Worked out from played seasons, not entered by hand."
                            className="ml-1 text-[11px] text-brand-muted"
                          >
                            est.
                          </span>
                        ) : null}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    {open && draft ? (
                      <input
                        type="number"
                        min={0}
                        max={3}
                        value={draft.birdYears}
                        onChange={(e) =>
                          setDraft({ ...draft, birdYears: e.target.value })
                        }
                        className="w-20 rounded border border-brand-border px-2 py-1 text-sm outline-none focus:border-brand-cta"
                      />
                    ) : (
                      <span className="text-brand-dark">
                        {row.birdYears}
                        <span className="ml-1 text-[11px] text-brand-muted">
                          {BIRD_LABEL[row.birdRights]}
                        </span>
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    {open && draft ? (
                      <select
                        value={draft.birdRightsTeamId}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            birdRightsTeamId: e.target.value,
                          })
                        }
                        className="w-44 rounded border border-brand-border px-2 py-1 text-sm outline-none focus:border-brand-cta"
                      >
                        <option value="">Nobody</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-brand-dark">
                        {row.birdRightsTeam?.name ?? "—"}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2.5 text-right">
                    {!canEdit ? null : open ? (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void commit(row)}
                          aria-label="Save"
                          className="rounded p-1.5 text-brand-cta-dark transition hover:bg-brand-cta/10 disabled:opacity-50"
                        >
                          <FiCheck className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancel}
                          aria-label="Cancel"
                          className="rounded p-1.5 text-brand-muted transition hover:bg-brand-soft"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => begin(row)}
                        aria-label={`Edit ${row.name}`}
                        className="rounded p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-brand-muted">
          No free agents match that filter.
        </p>
      ) : null}
    </div>
  );
}
