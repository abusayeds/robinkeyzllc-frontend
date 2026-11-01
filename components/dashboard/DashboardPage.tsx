"use client";

import { useState } from "react";
import { FiRepeat, FiUserPlus, FiUserMinus } from "react-icons/fi";
import { useAppSelector } from "@/lib/store/hooks";
import { Card, CardHeader } from "@/components/ui/Card";
import StandingsModal from "./StandingsModal";

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function wins(record: string) {
  return Number(record.split("-")[0] ?? 0);
}

function losses(record: string) {
  return Number(record.split("-")[1] ?? 0);
}

function TeamLogo({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-forest text-xs font-bold text-brand-accent">
      {name.charAt(0)}
    </span>
  );
}

const transactionIcon: Record<string, React.ReactNode> = {
  "Trade Accepted": <FiRepeat className="h-4 w-4" />,
  "Player Signed": <FiUserPlus className="h-4 w-4" />,
  "Player Waived": <FiUserMinus className="h-4 w-4" />,
};

export default function DashboardPage() {
  const team = useAppSelector((state) => state.team);
  const league = useAppSelector((state) => state.league);
  const transactions = useAppSelector((state) => state.transactions.recent);
  const yourTeam = useAppSelector((state) =>
    state.league.leagueTeams.find((t) => t.yourTeam)
  );
  const [standingsOpen, setStandingsOpen] = useState(false);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
        {yourTeam?.franchise ?? team.name} Front Office
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => setStandingsOpen(true)}
          className="rounded-xl border border-brand-border bg-white p-5 text-left shadow-card transition hover:border-brand-cta/40 hover:shadow-md"
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-brand-muted">
            RECORD
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-brand-dark">
              {team.record}
            </span>
            <span className="rounded-full bg-brand-cta/15 px-2 py-0.5 text-xs font-semibold text-brand-cta-dark">
              {team.rank}
            </span>
          </div>
          <p className="mt-2 text-xs text-brand-muted">
            {team.name} · 2024–25 Season
          </p>
        </button>

        <Card>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-brand-muted">
            CAP STATUS
          </p>
          <p className="mt-2 text-2xl font-bold text-brand-dark">
            {team.capStatus}
          </p>
          <p className="mt-2 text-xs text-brand-muted">{team.capNote}</p>
        </Card>

        <Card>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-brand-muted">
            TOTAL SALARY
          </p>
          <p className="mt-2 text-2xl font-bold text-brand-cta-dark">
            {team.totalSalary}
          </p>
          <p className="mt-2 text-xs text-brand-muted">
            Cap Space: {team.capSpace}
          </p>
        </Card>

        <Card>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-brand-muted">
            UPCOMING EVENT
          </p>
          <ul className="mt-2 space-y-1.5">
            {team.upcomingEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-brand-dark">{event.title}</span>
                <span className="text-brand-muted">{event.date}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Matchups + Player News */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={`Week ${league.week} Matchups`}
            href="/league/schedule"
          />
          <div className="divide-y divide-brand-border">
            {league.matchups.map((matchup) => (
              <div key={matchup.id} className="py-1">
                {[
                  { team: matchup.awayTeam, record: matchup.awayRecord },
                  { team: matchup.homeTeam, record: matchup.homeRecord },
                ].map((side) => (
                  <div
                    key={side.team}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <TeamLogo name={side.team} />
                      <span className="text-sm font-medium text-brand-dark">
                        {side.team}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        wins(side.record) >= losses(side.record)
                          ? "text-brand-cta-dark"
                          : "text-red-500"
                      }`}
                    >
                      {side.record.replace("-", " - ")}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Player News" href="/league/news" />
          <div className="divide-y divide-brand-border">
            {league.playerNews.map((news) => (
              <div
                key={news.id}
                className="flex items-start justify-between py-3"
              >
                <div className="flex items-start gap-3">
                  <TeamLogo name={news.player} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brand-dark">
                        {news.player}
                      </span>
                      {news.status === "OUT" ? (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                          OUT
                        </span>
                      ) : news.status === "Questionable" ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          Q
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-brand-muted">
                      {news.note}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-brand-muted">
                  {news.timeAgo}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Category Standings + Recent Transactions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Category Standings" href="/league/standings" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {league.categoryStandings.map((category) => {
              const tone =
                category.rank <= 5
                  ? "bg-brand-cta"
                  : category.rank <= 12
                    ? "bg-amber-400"
                    : "bg-red-400";
              return (
                <div key={category.label} className="flex items-center gap-2">
                  <span className="w-9 shrink-0 text-xs font-semibold text-brand-dark">
                    {category.label}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-border">
                    <span
                      className={`block h-full rounded-full ${tone}`}
                      style={{ width: `${category.value}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-xs text-brand-muted">
                    {ordinal(category.rank)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Transactions" href="/league/transactions" />
          <ul className="space-y-3">
            {transactions.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
                  {transactionIcon[item.type] ?? <FiRepeat className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-brand-dark">
                      {item.type}
                    </span>
                    <span className="shrink-0 text-xs text-brand-muted">
                      {item.date}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-brand-muted">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <StandingsModal
        open={standingsOpen}
        onClose={() => setStandingsOpen(false)}
      />
    </div>
  );
}
