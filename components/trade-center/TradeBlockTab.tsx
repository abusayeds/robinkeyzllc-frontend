"use client";

import { useMemo, useState } from "react";
import { FiAlertTriangle, FiSearch } from "react-icons/fi";
import { useTeamRosterQuery } from "@/lib/store/api/endpoints/rosterApi";
import {
  useListOnTradeBlockMutation,
  useRemoveFromTradeBlockMutation,
  useTradeBlockQuery,
  type TradeBlockEntry,
} from "@/lib/store/api/endpoints/tradeApi";
import TeamLogo from "@/components/ui/TeamLogo";
import { money } from "@/lib/money";

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

/** Stands in for a headshot, which the NBA feed does not supply. */
function Avatar({ name }: { name: string }) {
  const letters = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand-muted">
      {letters}
    </span>
  );
}

/**
 * The league's notice board. Listing a player reserves nothing and stops
 * nothing — it only saves owners from asking each other one at a time.
 */
export default function TradeBlockTab({
  leagueId,
  myTeamId,
  onProposeTo,
}: {
  leagueId: number;
  myTeamId: number | null;
  /** Opens the builder with that team already in the trade. */
  onProposeTo: (teamId: number) => void;
}) {
  const [term, setTerm] = useState("");
  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: block, isLoading } = useTradeBlockQuery({ leagueId });

  const { data: roster } = useTeamRosterQuery(
    { leagueId, teamId: myTeamId as number },
    { skip: !myTeamId },
  );

  const [list, { isLoading: listing }] = useListOnTradeBlockMutation();
  const [remove, { isLoading: removing }] = useRemoveFromTradeBlockMutation();

  const busy = listing || removing;

  const listedIds = useMemo(
    () => new Set((block?.entries ?? []).map((entry) => entry.leaguePlayerId)),
    [block],
  );

  const noteOf = useMemo(() => {
    const map = new Map<number, string | null>();
    for (const entry of block?.entries ?? []) {
      map.set(entry.leaguePlayerId, entry.note);
    }
    return map;
  }, [block]);

  // Everything listed in the league, this team's own included: an owner who
  // has just put a player up should be able to see him on the board the rest
  // of the league sees. Own listings are marked and offer no Propose button.
  const board = useMemo(() => {
    const entries = [...(block?.entries ?? [])].sort((a, b) => {
      const mine =
        Number(b.team.id === myTeamId) - Number(a.team.id === myTeamId);
      return mine !== 0 ? mine : a.name.localeCompare(b.name);
    });
    const needle = term.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(needle) ||
        entry.team.name.toLowerCase().includes(needle) ||
        entry.team.abbr.toLowerCase().includes(needle),
    );
  }, [block, myTeamId, term]);

  const toggleListing = async (leaguePlayerId: number) => {
    setError(null);
    try {
      if (listedIds.has(leaguePlayerId)) {
        await remove({ leagueId, leaguePlayerId }).unwrap();
      } else {
        await list({ leagueId, leaguePlayerId }).unwrap();
      }
    } catch (e) {
      setError(errorText(e, "That listing could not be changed."));
    }
  };

  const saveNote = async (leaguePlayerId: number) => {
    setError(null);
    try {
      await list({ leagueId, leaguePlayerId, note: note.trim() }).unwrap();
      setNoteFor(null);
      setNote("");
    } catch (e) {
      setError(errorText(e, "That note could not be saved."));
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-brand-border bg-white shadow-card">
          <div className="border-b border-brand-border px-4 py-3">
            <p className="text-sm font-semibold text-brand-dark">
              My Roster — tap to list on the block
            </p>
            <p className="text-[11px] text-brand-muted">
              A listing is a notice, nothing more. It does not reserve the
              player or stop you waiving or re-signing him.
            </p>
          </div>

          {!myTeamId ? (
            <p className="px-4 py-6 text-center text-sm text-brand-muted">
              You do not hold a team in this league, so there is nothing of
              yours to list.
            </p>
          ) : (roster?.players ?? []).length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-brand-muted">
              Your roster is empty.
            </p>
          ) : (
            <ul className="divide-y divide-brand-border">
              {(roster?.players ?? []).map((player) => {
                const listed = listedIds.has(player.id);
                const editing = noteFor === player.id;
                return (
                  <li key={player.id} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={player.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-brand-dark">
                            {player.name}
                          </p>
                          <p className="text-xs text-brand-muted">
                            {player.position ?? "—"}
                            {player.capHit !== null
                              ? ` · ${money(player.capHit)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {listed ? (
                          <button
                            type="button"
                            onClick={() => {
                              setNoteFor(editing ? null : player.id);
                              setNote(noteOf.get(player.id) ?? "");
                            }}
                            className="rounded-lg border border-brand-border px-2.5 py-1 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
                          >
                            {editing ? "Cancel" : "Note"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void toggleListing(player.id)}
                          disabled={busy}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                            listed
                              ? "bg-brand-cta/15 text-brand-cta-dark"
                              : "border border-brand-border text-brand-dark hover:bg-brand-soft"
                          }`}
                        >
                          {listed ? "On Block" : "List"}
                        </button>
                      </div>
                    </div>

                    {noteOf.get(player.id) && !editing ? (
                      <p className="mt-1.5 text-xs italic text-brand-muted">
                        “{noteOf.get(player.id)}”
                      </p>
                    ) : null}

                    {editing ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          maxLength={280}
                          placeholder="What you are after in return (optional)"
                          className="min-w-0 flex-1 rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-dark outline-none focus:border-brand-cta"
                        />
                        <button
                          type="button"
                          onClick={() => void saveNote(player.id)}
                          disabled={busy}
                          className="rounded-lg bg-brand-cta px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-brand-border bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-4 py-3">
            <p className="text-sm font-semibold text-brand-dark">
              Players on the Trade Block
            </p>
            <label className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-1.5 focus-within:border-brand-cta">
              <FiSearch className="h-3.5 w-3.5 shrink-0 text-brand-muted" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search players or teams..."
                className="w-36 text-xs text-brand-dark outline-none"
              />
            </label>
          </div>

          {isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-brand-muted">
              Loading…
            </p>
          ) : board.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-brand-dark">
                Nobody has listed a player yet.
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                List one of yours and the rest of the league will see it here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-brand-border">
              {board.map((entry) => (
                <Listing
                  key={entry.id}
                  entry={entry}
                  isMine={entry.team.id === myTeamId}
                  onProposeTo={() => onProposeTo(entry.team.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Listing({
  entry,
  isMine,
  onProposeTo,
}: {
  entry: TradeBlockEntry;
  isMine: boolean;
  onProposeTo: () => void;
}) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar name={entry.name} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
            <span className="truncate">{entry.name}</span>
            {isMine ? (
              <span className="shrink-0 rounded-full bg-brand-cta/15 px-2 py-0.5 text-[10px] font-semibold text-brand-cta-dark">
                Yours
              </span>
            ) : null}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-brand-muted">
            <TeamLogo
              name={entry.team.name}
              src={entry.team.logo}
              className="h-4 w-4 shrink-0"
            />
            <span className="truncate">{entry.team.name}</span>
          </p>
          <p className="truncate text-[11px] text-brand-muted">
            {entry.position ?? "—"}
            {entry.capHit !== null ? ` · ${money(entry.capHit)}` : ""}
            {entry.yearsLeft !== null
              ? ` · ${entry.yearsLeft} yr${entry.yearsLeft === 1 ? "" : "s"} left`
              : ""}
          </p>
        </div>
      </div>

      {entry.note ? (
        <p className="mt-2 text-xs italic text-brand-muted">“{entry.note}”</p>
      ) : null}

      {isMine ? null : (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onProposeTo}
            className="rounded-lg bg-brand-cta px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark"
          >
            Propose Trade
          </button>
        </div>
      )}
    </li>
  );
}
