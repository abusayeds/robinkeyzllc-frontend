"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { FiX } from "react-icons/fi";
import type { RosterPlayer } from "@/lib/store/features/rostersSlice";

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function moneyFull(m: number) {
  return `$${Math.round(m * 1_000_000).toLocaleString()}`;
}

function seedFrom(id: string) {
  return [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
}

export default function PlayerDetailModal({
  player,
  onClose,
  onAddToBlock,
  actionLabel = "Add to Trade Block",
}: {
  player: RosterPlayer | null;
  onClose: () => void;
  onAddToBlock?: (id: string) => void;
  actionLabel?: string;
}) {
  useEffect(() => {
    if (!player) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [player, onClose]);

  const derived = useMemo(() => {
    if (!player) return null;
    const seed = seedFrom(player.id);
    const base = player.salary * 0.82;
    const contract = Array.from({ length: 5 }, (_, i) => {
      const yearStart = 2022 + i;
      const salary = base * (1 + 0.06 * i);
      const status =
        i < 2 ? "Completed" : i === 2 ? "Active" : i === 3 ? "Guaranteed" : "Player Option";
      return {
        year: `${yearStart}-${String((yearStart + 1) % 100).padStart(2, "0")}`,
        salary,
        status,
      };
    });

    const games = Array.from({ length: 5 }, (_, i) => {
      const d = 10 - i * 2;
      const wl = (seed + i) % 3 === 0 ? "L" : "W";
      const a = 108 + ((seed + i * 7) % 24);
      const b = a - (wl === "W" ? 4 + (i % 6) : -(3 + (i % 5)));
      return {
        date: `May ${d}`,
        opp: `${i % 2 ? "@" : "vs"} ${["CHO", "MIL", "IND", "DEN", "NYK"][i]}`,
        min: 32 + ((seed + i) % 8),
        pts: Math.round(player.pts + ((seed + i * 3) % 9) - 4),
        reb: Math.round(player.reb + (i % 4) - 1),
        ast: Math.round(player.ast + (i % 3) - 1),
        threes: Math.max(0, Math.round(player.threes + (i % 3) - 1)),
        fg: Math.round((player.fgPct + ((i % 4) - 1) / 100) * 100),
        result: `${wl}${a}-${b}`,
      };
    });

    const career = Array.from({ length: 5 }, (_, i) => {
      const yr = 2024 - i;
      return {
        season: `${yr}-${String((yr + 1) % 100).padStart(2, "0")}`,
        team: player.nbaTeam,
        gp: 70 + ((seed + i) % 12),
        gs: 60 + ((seed + i) % 20),
        ppg: (player.pts - i * 1.4).toFixed(1),
        rpg: Math.max(0, player.reb - i * 0.4).toFixed(1),
        apg: Math.max(0, player.ast - i * 0.3).toFixed(1),
        spg: Math.max(0, player.stl - i * 0.05).toFixed(1),
        fg: pct(player.fgPct - i * 0.01),
        tp: pct(player.ftPct - 0.4 - i * 0.01),
      };
    });

    return { contract, games, career };
  }, [player]);

  if (!player || !derived) return null;

  const avg = [
    ["PTS", player.pts.toFixed(1)],
    ["REB", player.reb.toFixed(1)],
    ["AST", player.ast.toFixed(1)],
    ["STL", player.stl.toFixed(1)],
    ["BLK", player.blk.toFixed(1)],
    ["FG%", (player.fgPct * 100).toFixed(1)],
    ["3PM", player.threes.toFixed(1)],
    ["FT%", (player.ftPct * 100).toFixed(1)],
    ["TO", player.to.toFixed(1)],
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={player.name}
    >
      <div
        className="flex max-h-[92vh] supports-[height:100dvh]:max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-brand-dark">
              {player.name}
            </h2>
            <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-muted">
              {player.pos}
            </span>
            <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-muted">
              {player.nbaTeam}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-4">
            <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-forest">
              <Image
                src="/image/randomuser.jpg"
                alt={player.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </span>
            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
              {[
                ["HT", player.ht],
                ["WT", `${player.wt} lbs`],
                ["AGE", String(player.age)],
                ["EXP", `${player.exp} yrs`],
                ["DRAFT", player.draftInfo],
                ["CONTRACT", `${player.contractYearsLeft} yrs left`],
                ["AAV", moneyFull(player.salary)],
                ["POS SLOT", player.slot],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10px] font-semibold uppercase text-brand-muted">
                    {k}
                  </p>
                  <p className="font-semibold text-brand-dark">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
              Season Averages (2024-25)
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {avg.map(([k, v]) => (
                <span key={k} className="text-center">
                  <span className="block text-lg font-bold text-brand-dark">
                    {v}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-brand-muted">
                    {k}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                Contract Breakdown
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-brand-muted">
                    <th className="text-left font-semibold">Year</th>
                    <th className="text-right font-semibold">Base Salary</th>
                    <th className="text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {derived.contract.map((c) => (
                    <tr key={c.year}>
                      <td className="py-1.5 text-brand-dark">{c.year}</td>
                      <td className="py-1.5 text-right text-brand-dark">
                        {moneyFull(c.salary)}
                      </td>
                      <td
                        className={`py-1.5 text-right font-medium ${
                          c.status === "Active"
                            ? "text-brand-cta-dark"
                            : "text-brand-muted"
                        }`}
                      >
                        {c.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                Game Log (Last 5)
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-brand-muted">
                    <th className="text-left font-semibold">Date</th>
                    <th className="text-left font-semibold">Opp</th>
                    <th className="text-center font-semibold">PTS</th>
                    <th className="text-center font-semibold">REB</th>
                    <th className="text-center font-semibold">AST</th>
                    <th className="text-right font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {derived.games.map((g) => (
                    <tr key={g.date}>
                      <td className="py-1.5 text-brand-dark">{g.date}</td>
                      <td className="py-1.5 text-brand-muted">{g.opp}</td>
                      <td className="py-1.5 text-center">{g.pts}</td>
                      <td className="py-1.5 text-center">{g.reb}</td>
                      <td className="py-1.5 text-center">{g.ast}</td>
                      <td
                        className={`py-1.5 text-right font-medium ${
                          g.result.startsWith("W")
                            ? "text-brand-cta-dark"
                            : "text-red-500"
                        }`}
                      >
                        {g.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
              Career Stats
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-brand-muted">
                    <th className="text-left font-semibold">Season</th>
                    <th className="text-left font-semibold">Team</th>
                    <th className="text-center font-semibold">GP</th>
                    <th className="text-center font-semibold">GS</th>
                    <th className="text-center font-semibold">PPG</th>
                    <th className="text-center font-semibold">RPG</th>
                    <th className="text-center font-semibold">APG</th>
                    <th className="text-center font-semibold">SPG</th>
                    <th className="text-center font-semibold">FG%</th>
                    <th className="text-center font-semibold">3P%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {derived.career.map((c) => (
                    <tr key={c.season}>
                      <td className="py-1.5 font-medium text-brand-dark">
                        {c.season}
                      </td>
                      <td className="py-1.5 text-brand-muted">{c.team}</td>
                      <td className="py-1.5 text-center">{c.gp}</td>
                      <td className="py-1.5 text-center">{c.gs}</td>
                      <td className="py-1.5 text-center">{c.ppg}</td>
                      <td className="py-1.5 text-center">{c.rpg}</td>
                      <td className="py-1.5 text-center">{c.apg}</td>
                      <td className="py-1.5 text-center">{c.spg}</td>
                      <td className="py-1.5 text-center">{c.fg}</td>
                      <td className="py-1.5 text-center">{c.tp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            Close
          </button>
          {onAddToBlock ? (
            <button
              type="button"
              onClick={() => {
                onAddToBlock(player.id);
                onClose();
              }}
              className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
