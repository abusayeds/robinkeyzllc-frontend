"use client";

import TeamLogo from "@/components/ui/TeamLogo";
import type { DraftSlot } from "@/lib/store/features/draftSlice";
import type { LeagueTeam } from "@/lib/store/features/leagueSlice";

export default function DraftClockCard({
  slot,
  onClockTeam,
  clock,
  strip,
  teamById,
  prospectName,
}: {
  slot: DraftSlot | undefined;
  onClockTeam: LeagueTeam | undefined;
  clock: { label: string; ratio: number };
  strip: DraftSlot[];
  teamById: Map<string, LeagueTeam>;
  prospectName: (s: DraftSlot) => string | undefined;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-brand-dark"
          style={{
            background: `conic-gradient(var(--brand-accent) ${
              clock.ratio * 360
            }deg, #e5ebe8 0deg)`,
          }}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
            {clock.label}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
            On the Clock · Round {slot?.round}, Pick {slot?.pick}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <TeamLogo
              name={onClockTeam?.name ?? ""}
              src={onClockTeam?.logo}
              className="h-6 w-6"
            />
            <p className="text-base font-bold text-brand-dark">
              {onClockTeam?.name}{" "}
              <span className="font-normal text-brand-muted">
                ({onClockTeam?.owner})
              </span>
            </p>
            <span className="rounded-full bg-brand-cta/15 px-2 py-0.5 text-[10px] font-bold text-brand-cta-dark">
              On the Clock
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {strip.map((s) => {
          const t = teamById.get(s.teamId);
          const isCurrent = s.overall === slot?.overall;
          return (
            <div
              key={s.overall}
              className={`w-36 shrink-0 rounded-lg border px-2.5 py-2 text-xs ${
                isCurrent
                  ? "border-brand-cta bg-brand-cta/5"
                  : "border-brand-border"
              }`}
            >
              <p className="text-[10px] font-semibold text-brand-muted">
                R{s.round}-P{s.pick}
              </p>
              <p className="truncate font-medium text-brand-dark">{t?.name}</p>
              <p className="truncate text-brand-muted">
                {isCurrent ? "On the Clock" : (prospectName(s) ?? "—")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
