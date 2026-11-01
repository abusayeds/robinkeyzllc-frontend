"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  requestTrade,
  toggleSaved,
  type TradePlayer,
} from "@/lib/store/features/tradeSlice";
import PlayerRow from "./PlayerRow";
import TradeSidebar from "./TradeSidebar";
import { tradePlayerToRosterPlayer } from "./adapter";
import PlayerDetailModal from "@/components/my-team/PlayerDetailModal";

const POSITIONS = ["All Position", "PG", "SG", "SF", "PF", "C"] as const;
const SALARY = ["Salary: Any", "Under $10M", "$10M – $20M", "$20M+"] as const;
const AGE = ["Age: All", "Under 25", "25 – 30", "Over 30"] as const;

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
  const dispatch = useAppDispatch();
  const router = useRouter();
  const available = useAppSelector((state) => state.trade.available);
  const savedPlayers = useAppSelector((state) => state.trade.savedPlayers);
  const savedIds = useMemo(
    () => new Set(savedPlayers.map((p) => p.id)),
    [savedPlayers]
  );

  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<string>(POSITIONS[0]);
  const [salary, setSalary] = useState<string>(SALARY[0]);
  const [age, setAge] = useState<string>(AGE[0]);
  const [detail, setDetail] = useState<TradePlayer | null>(null);

  const filtered = useMemo(() => {
    return available.filter((player) => {
      if (
        search &&
        !`${player.name} ${player.team}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      if (position !== POSITIONS[0] && player.position !== position) return false;
      if (salary === "Under $10M" && player.salary >= 10) return false;
      if (salary === "$10M – $20M" && (player.salary < 10 || player.salary > 20))
        return false;
      if (salary === "$20M+" && player.salary <= 20) return false;
      if (age === "Under 25" && player.age >= 25) return false;
      if (age === "25 – 30" && (player.age < 25 || player.age > 30)) return false;
      if (age === "Over 30" && player.age <= 30) return false;
      return true;
    });
  }, [available, search, position, salary, age]);

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
          <Select value={position} options={POSITIONS} onChange={setPosition} />
          <Select value={salary} options={SALARY} onChange={setSalary} />
          <Select value={age} options={AGE} onChange={setAge} />
        </div>

        <p className="text-xs text-brand-muted">
          Showing {filtered.length} of {available.length} players available for
          trade
        </p>

        <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
          {filtered.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-brand-muted">
              No players match your filters.
            </p>
          ) : (
            <div className="divide-y divide-brand-border">
              {filtered.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  saved={savedIds.has(player.id)}
                  onToggleSave={() =>
                    dispatch(
                      toggleSaved({
                        id: player.id,
                        name: player.name,
                        salary: player.salary,
                      })
                    )
                  }
                  onOpenDetail={() => setDetail(player)}
                  onTrade={() => {
                    dispatch(
                      requestTrade({
                        playerId: player.id,
                        name: player.name,
                        position: player.position,
                        team: player.team,
                        salary: player.salary,
                      })
                    );
                    router.push("/my-team/trade-center");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <TradeSidebar />
      </div>

      <PlayerDetailModal
        player={detail ? tradePlayerToRosterPlayer(detail) : null}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
