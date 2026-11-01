import type {
  Playoffs,
  PlayoffSeries,
  PlayoffTeam,
} from "@/lib/store/features/leagueSlice";

function TeamRow({
  team,
  wins,
  isWinner,
  align = "left",
}: {
  team?: PlayoffTeam;
  wins: number;
  isWinner: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3 py-2 ${
        isWinner ? "bg-brand-cta/10" : ""
      } ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      <div
        className={`flex min-w-0 items-center gap-2 ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-soft text-[10px] font-bold text-brand-muted">
          {team?.seed ?? "-"}
        </span>
        <span
          className={`truncate text-xs ${
            isWinner
              ? "font-bold text-brand-dark"
              : team
                ? "text-brand-dark"
                : "text-brand-muted"
          }`}
        >
          {team?.team ?? "TBD"}
        </span>
      </div>
      <span
        className={`shrink-0 text-xs font-semibold ${
          isWinner ? "text-brand-cta-dark" : "text-brand-muted"
        }`}
      >
        {wins}
      </span>
    </div>
  );
}

function SeriesCard({
  series,
  align = "left",
}: {
  series: PlayoffSeries;
  align?: "left" | "right";
}) {
  return (
    <div className="w-52 overflow-hidden rounded-lg border border-brand-border bg-white shadow-sm">
      <TeamRow
        team={series.home}
        wins={series.homeWins}
        isWinner={series.winnerId === series.home?.teamId}
        align={align}
      />
      <div className="border-t border-brand-border" />
      <TeamRow
        team={series.away}
        wins={series.awayWins}
        isWinner={series.winnerId === series.away?.teamId}
        align={align}
      />
      {series.live ? (
        <div className="flex items-center gap-1.5 border-t border-brand-border bg-brand-soft px-3 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-cta" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-cta-dark">
            Live
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Column({
  title,
  series,
  align = "left",
}: {
  title: string;
  series: PlayoffSeries[];
  align?: "left" | "right";
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
        {title}
      </p>
      <div className="flex flex-1 flex-col justify-around gap-6">
        {series.map((item) => (
          <SeriesCard key={item.id} series={item} align={align} />
        ))}
      </div>
    </div>
  );
}

export default function PlayoffBracket({ playoffs }: { playoffs: Playoffs }) {
  const pick = (conference: string, round: string) =>
    playoffs.series.filter(
      (s) => s.conference === conference && s.round === round
    );

  const finals = playoffs.series.find((s) => s.round === "Championship");

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-brand-border px-4 py-3">
        <h2 className="text-sm font-semibold text-brand-dark">
          {playoffs.title}
        </h2>
        <span className="flex items-center gap-1.5 rounded-full bg-brand-cta/10 px-2.5 py-1 text-[11px] font-semibold text-brand-cta-dark">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-cta" />
          {playoffs.statusLabel}
        </span>
      </div>

      <div className="overflow-x-auto p-6">
        <div className="mx-auto flex min-w-[900px] items-stretch justify-center gap-6">
          <Column title="East Semifinals" series={pick("East", "Semifinal")} />
          <Column
            title="East Final"
            series={pick("East", "Conference Final")}
          />

          <div className="flex flex-col items-center justify-center gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
              Championship
            </p>
            <div className="flex w-44 flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-cta/50 bg-brand-cta/5 px-4 py-8 text-center">
              <span className="text-3xl">🏆</span>
              <p className="mt-2 text-sm font-bold tracking-wide text-brand-dark">
                CHAMPION
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                {finals?.home?.team ?? "East winner"} vs{" "}
                {finals?.away?.team ?? "West winner"}
              </p>
            </div>
          </div>

          <Column
            title="West Final"
            series={pick("West", "Conference Final")}
            align="right"
          />
          <Column
            title="West Semifinals"
            series={pick("West", "Semifinal")}
            align="right"
          />
        </div>
      </div>
    </div>
  );
}
