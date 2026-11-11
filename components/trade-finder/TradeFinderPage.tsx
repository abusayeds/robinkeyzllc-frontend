"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import {
  useTradeFinderQuery,
  type FinderPlayer,
} from "@/lib/store/api/endpoints/tradeApi";
import { useLeagueTransactionsQuery } from "@/lib/store/api/endpoints/transactionsApi";
import { useAppSelector } from "@/lib/store/hooks";
import PlayerRow from "./PlayerRow";
import TradeSidebar from "./TradeSidebar";

const ALL_POSITIONS = "All Position";
const SALARY = ["Salary: Any", "Under $10M", "$10M – $20M", "$20M+"] as const;
const AGE = ["Age: All", "Under 25", "25 – 30", "Over 30"] as const;

const MILLION = 1_000_000;

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark outline-none transition focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export default function TradeFinderPage() {
  const router = useRouter();
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data, isLoading } = useTradeFinderQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );

  // The sidebar's "Recently Listed" card: AVORA has no trade block, so it
  // shows who has actually changed hands lately, which is the same question a
  // manager shopping around is asking.
  const { data: feed } = useLeagueTransactionsQuery(
    { leagueId: leagueId as number, take: 20 },
    { skip: !leagueId },
  );

  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<string>(ALL_POSITIONS);
  const [salary, setSalary] = useState<string>(SALARY[0]);
  const [age, setAge] = useState<string>(AGE[0]);

  // A watchlist is the viewer's own scratch note, so it lives in the page
  // rather than on the server.
  const [saved, setSaved] = useState<FinderPlayer[]>([]);
  const savedIds = useMemo(
    () => new Set(saved.map((player) => player.id)),
    [saved],
  );

  const available = useMemo(
    // Your own players are not someone you trade for.
    () => (data?.players ?? []).filter((player) => !player.isMine),
    [data],
  );

  /**
   * The positions this league's players actually have.
   *
   * The source feed describes a player as "G", "F", "C" or a hyphenated pair
   * like "G-F" — there is no PG/SG/SF/PF anywhere in it. A fixed list written
   * from the design's labels gives four options that can never match a single
   * player, so the list is built from the pool, the same way the draft board
   * builds its chips.
   */
  const positions = useMemo(() => {
    const found = new Set<string>();
    for (const player of available) {
      for (const part of (player.position ?? "").split("-")) {
        const value = part.trim();
        if (value) found.add(value);
      }
    }
    return [ALL_POSITIONS, ...[...found].sort()];
  }, [available]);

  const filtered = useMemo(() => {
    return available.filter((player) => {
      const haystack = `${player.name} ${player.team?.name ?? ""} ${player.nbaTeam ?? ""}`;
      if (search && !haystack.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (position !== ALL_POSITIONS) {
        // "G" has to match "G-F" as well as "G", so the stored value is split
        // the same way the list was built — `includes` on the raw string
        // would also let "C" match "C-F", which is the same player, but would
        // let any future label match a substring of another.
        const parts = (player.position ?? "")
          .split("-")
          .map((part) => part.trim());
        if (!parts.includes(position)) return false;
      }

      const millions = (player.salary ?? 0) / MILLION;
      if (salary === "Under $10M" && millions >= 10) return false;
      if (salary === "$10M – $20M" && (millions < 10 || millions > 20)) {
        return false;
      }
      if (salary === "$20M+" && millions <= 20) return false;

      // A player with no birthdate on file cannot be filtered out by age: the
      // age is unknown, not wrong.
      if (age !== AGE[0] && player.age !== null) {
        if (age === "Under 25" && player.age >= 25) return false;
        if (age === "25 – 30" && (player.age < 25 || player.age > 30)) {
          return false;
        }
        if (age === "Over 30" && player.age <= 30) return false;
      }

      return true;
    });
  }, [available, search, position, salary, age]);

  const recentlyTraded = useMemo(
    () =>
      (feed?.transactions ?? [])
        .filter((item) => item.type === "Trade Accepted")
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          name: item.description,
          team: item.teams ?? "",
          date: item.date,
        })),
    [feed],
  );

  function toggleSave(player: FinderPlayer) {
    setSaved((list) =>
      list.some((row) => row.id === player.id)
        ? list.filter((row) => row.id !== player.id)
        : [...list, player],
    );
  }

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to browse its rosters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Trade Finder</h1>
        <p className="text-sm text-brand-muted">
          Browse rosters league-wide and start a trade with any team.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players or teams..."
                className="w-full rounded-lg border border-brand-border bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-brand-muted focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20"
              />
            </div>
            <Select
              value={position}
              options={positions}
              onChange={setPosition}
            />
            <Select value={salary} options={SALARY} onChange={setSalary} />
            <Select value={age} options={AGE} onChange={setAge} />
          </div>

          <p className="text-xs text-brand-muted">
            Showing {filtered.length} of {available.length} players available
            for trade
            {data?.statsSeason
              ? ` · ${data.statsSeason}-${String((data.statsSeason + 1) % 100).padStart(2, "0")} averages`
              : ""}
          </p>

          <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
            {isLoading ? (
              <p className="px-5 py-10 text-center text-sm text-brand-muted">
                Loading rosters…
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-brand-muted">
                {available.length === 0
                  ? "No other team has a rostered player yet."
                  : "No players match your filters."}
              </p>
            ) : (
              <div className="divide-y divide-brand-border">
                {filtered.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    saved={savedIds.has(player.id)}
                    onToggleSave={() => toggleSave(player)}
                    onOpenDetail={() => router.push("/my-team/trade-center")}
                    onTrade={() => router.push("/my-team/trade-center")}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <TradeSidebar
          recentlyTraded={recentlyTraded}
          saved={saved}
          onRemoveSaved={(id) =>
            setSaved((list) => list.filter((row) => row.id !== id))
          }
        />
      </div>
    </div>
  );
}
