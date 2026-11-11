"use client";

import TeamLogo from "@/components/ui/TeamLogo";
import type {
  BoardSlot,
  OnTheClock,
} from "@/lib/store/api/endpoints/draftLiveApi";

export default function DraftClockCard({
  onTheClock,
  ownerName,
  clock,
  strip,
}: {
  onTheClock: OnTheClock | null;
  /** Null when nobody owns the team on the clock, which is a real state. */
  ownerName: string | null;
  clock: { label: string; ratio: number; expired: boolean };
  strip: BoardSlot[];
}) {
  const team = onTheClock?.team ?? null;

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
            {onTheClock
              ? `On the Clock · Round ${onTheClock.round}, Pick ${onTheClock.pickInRound}`
              : "Every pick has been made"}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {team ? (
              <>
                <TeamLogo
                  name={team.name}
                  src={team.logo}
                  className="h-6 w-6"
                />
                <p className="text-base font-bold text-brand-dark">
                  {team.name}{" "}
                  {ownerName ? (
                    <span className="font-normal text-brand-muted">
                      ({ownerName})
                    </span>
                  ) : null}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    clock.expired
                      ? "bg-red-100 text-red-600"
                      : "bg-brand-cta/15 text-brand-cta-dark"
                  }`}
                >
                  {/* The server makes the pick on the next read, so this says
                      what is about to happen rather than claiming it has. */}
                  {clock.expired ? "Time Expired" : "On the Clock"}
                </span>
              </>
            ) : (
              <p className="text-base font-bold text-brand-dark">
                Draft complete
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {strip.map((slot) => {
          const isCurrent = slot.overall === onTheClock?.overall;
          return (
            <div
              key={slot.overall}
              className={`w-36 shrink-0 rounded-lg border px-2.5 py-2 text-xs ${
                isCurrent
                  ? "border-brand-cta bg-brand-cta/5"
                  : "border-brand-border"
              }`}
            >
              <p className="text-[10px] font-semibold text-brand-muted">
                R{slot.round}-P{slot.pickInRound}
              </p>
              <p className="truncate font-medium text-brand-dark">
                {slot.team.name}
              </p>
              <p className="truncate text-brand-muted">
                {isCurrent ? "On the Clock" : (slot.player?.name ?? "—")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
