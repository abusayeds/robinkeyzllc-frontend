"use client";

import { useState } from "react";
import { LuInfo, LuRefreshCw } from "react-icons/lu";
import { getApiErrorMessage } from "@/lib/store/api";
import {
  useNightlyStatusQuery,
  useRunNightlyMutation,
  useSyncBackfillMutation,
  useSyncCareersMutation,
  useSyncInjuriesMutation,
  useSyncPlayersMutation,
  useSyncRunsQuery,
  useSyncSeasonAveragesMutation,
  useSyncTeamsMutation,
} from "@/lib/store/api/endpoints/nbaSyncApi";

/** An NBA season starts in the autumn, so January belongs to last year's. */
const currentSeason = () => {
  const now = new Date();
  return now.getUTCMonth() >= 8
    ? now.getUTCFullYear()
    : now.getUTCFullYear() - 1;
};

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** The 1st of October in a season's starting year: before any game of it. */
const seasonOpening = (startYear: number) => `${startYear}-10-01`;

const when = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "—";

const STATUS_STYLE: Record<string, string> = {
  succeeded: "bg-green-50 text-green-700",
  running: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
};

/**
 * Where a Super Admin pulls NBA data in, and sees what the last pull did.
 *
 * These ran only on the nightly cron and by hand against the API before, which
 * is how a season's averages came to be missing on a live deployment: a card
 * with no published figures falls back to totalling the game lines held here,
 * and those start the day this deployment did. Nothing on this page is
 * destructive — every sync upserts, so running one twice corrects rather than
 * duplicates.
 */
export default function NbaDataSyncPage() {
  const season = currentSeason();

  const { data: status } = useNightlyStatusQuery();
  const { data: runs = [], isLoading: runsLoading } = useSyncRunsQuery();

  const [backfillStart, setBackfillStart] = useState(seasonOpening(season));
  const [backfillEnd, setBackfillEnd] = useState(isoDay(new Date()));

  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [syncTeams] = useSyncTeamsMutation();
  const [syncPlayers] = useSyncPlayersMutation();
  const [syncSeasonAverages] = useSyncSeasonAveragesMutation();
  const [syncCareers] = useSyncCareersMutation();
  const [syncBackfill] = useSyncBackfillMutation();
  const [syncInjuries] = useSyncInjuriesMutation();
  const [runNightly] = useRunNightlyMutation();

  /**
   * One handler for every button. A sync is a long request with no progress to
   * report, so the only honest feedback is which one is running and what it
   * said when it stopped.
   */
  const start = async (
    key: string,
    run: () => Promise<unknown>,
    done: string,
  ) => {
    if (busy) return;
    setBusy(key);
    setNote(null);
    setError(null);
    try {
      await run();
      setNote(done);
    } catch (e) {
      setError(getApiErrorMessage(e, "That sync could not be completed."));
    } finally {
      setBusy(null);
    }
  };

  const ACTIONS: {
    key: string;
    label: string;
    hint: string;
    run: () => Promise<unknown>;
    done: string;
  }[] = [
    {
      key: "averages",
      label: `Season Averages (${seasonLabel(season)})`,
      hint: "The figures on a player card. The feed's own published season averages, not a total of the nights stored here.",
      run: () => syncSeasonAverages({ season }).unwrap(),
      done: "Season averages are up to date.",
    },
    {
      key: "careers",
      label: "Career Stats (all seasons)",
      hint: "Every earlier season each rostered player played, for the career table. One request per hundred players per season, so give it a few minutes.",
      run: () => syncCareers({}).unwrap(),
      done: "Career stats pulled. Player cards now show every season.",
    },
    {
      key: "players",
      label: "Players",
      hint: "Height, weight, college, draft line and current NBA team for every active player.",
      run: () => syncPlayers().unwrap(),
      done: "Player details are up to date.",
    },
    {
      key: "teams",
      label: "Teams",
      hint: "The 30 franchises. Run before players: a player row points at a team.",
      run: () => syncTeams().unwrap(),
      done: "NBA teams are up to date.",
    },
    {
      key: "injuries",
      label: "Injuries",
      hint: "Replaces the whole board — a player the feed stops returning is healthy again.",
      run: () => syncInjuries().unwrap(),
      done: "Injury board refreshed.",
    },
    {
      key: "nightly",
      label: "Run Nightly Job Now",
      hint: "Last two nights of games and lines, injuries, then any league week due to settle.",
      run: () => runNightly().unwrap(),
      done: "Nightly job finished.",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-xl border border-brand-border bg-brand-soft px-4 py-3 text-[13px] text-brand-dark">
        <LuInfo className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted" />
        <div>
          <p className="font-semibold">
            Averages come from the feed, not from the games stored here.
          </p>
          <p className="mt-0.5 text-brand-muted">
            A player card reads the published season averages first. Where none
            exist it falls back to totalling the lines in this database, which
            only go back to the day syncing started — so a player 17 games into
            a season reads as however many nights have been pulled. Run{" "}
            <span className="font-semibold">Season Averages</span> to fix the
            current season and{" "}
            <span className="font-semibold">Career Stats</span> to fill every
            earlier one.
          </p>
        </div>
      </div>

      {status ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="API Key"
            value={status.keyConfigured ? "Configured" : "Missing"}
            tone={status.keyConfigured ? "good" : "bad"}
          />
          <StatCard label="Nightly Schedule" value={status.schedule} />
          <StatCard
            label="Last Games Sync"
            value={when(status.lastGamesSync?.finishedAt ?? null)}
          />
          <StatCard
            label="Weeks Awaiting Settlement"
            value={String(status.weeksAwaitingSettlement)}
          />
        </div>
      ) : null}

      {note ? (
        <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
          {note}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {ACTIONS.map((action) => (
          <div
            key={action.key}
            className="flex flex-col justify-between gap-3 rounded-xl border border-brand-border bg-white p-4 shadow-card"
          >
            <div>
              <h3 className="text-sm font-bold text-brand-dark">
                {action.label}
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-brand-muted">
                {action.hint}
              </p>
            </div>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void start(action.key, action.run, action.done)}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-cta px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
            >
              {busy === action.key ? (
                <LuRefreshCw className="h-4 w-4 animate-spin" />
              ) : null}
              {busy === action.key ? "Running…" : "Run"}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <h3 className="text-sm font-bold text-brand-dark">Backfill Game Log</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-brand-muted">
          Walks a date range, games then every night&apos;s box scores. This is
          what fills the game log for the nights before syncing started. A whole
          season is about 170 requests.
        </p>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              From
            </span>
            <input
              type="date"
              value={backfillStart}
              onChange={(e) => setBackfillStart(e.target.value)}
              className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              To
            </span>
            <input
              type="date"
              value={backfillEnd}
              onChange={(e) => setBackfillEnd(e.target.value)}
              className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
            />
          </label>
          <button
            type="button"
            disabled={busy !== null || !backfillStart || !backfillEnd}
            onClick={() =>
              void start(
                "backfill",
                async () => {
                  const result = await syncBackfill({
                    start: backfillStart,
                    end: backfillEnd,
                  }).unwrap();
                  if (result.failedNights.length > 0) {
                    throw new Error(
                      `${result.nights - result.failedNights.length} of ${result.nights} nights pulled. These failed and can be run again: ${result.failedNights.join(", ")}.`,
                    );
                  }
                },
                "Backfill finished. The game log now covers that range.",
              )
            }
            className="inline-flex items-center gap-2 rounded-lg bg-brand-cta px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
          >
            {busy === "backfill" ? (
              <LuRefreshCw className="h-4 w-4 animate-spin" />
            ) : null}
            {busy === "backfill" ? "Running…" : "Backfill"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
        <div className="border-b border-brand-border px-4 py-3">
          <h3 className="text-sm font-bold text-brand-dark">Recent Runs</h3>
        </div>

        {runsLoading ? (
          <p className="px-4 py-6 text-sm text-brand-muted">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="px-4 py-6 text-sm text-brand-muted">
            Nothing has been synced yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                  <th className="px-4 py-2">Job</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Created</th>
                  <th className="px-4 py-2 text-right">Updated</th>
                  <th className="px-4 py-2 text-right">Skipped</th>
                  <th className="px-4 py-2">Started</th>
                  <th className="px-4 py-2">Finished</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b border-brand-border/60 last:border-0"
                  >
                    <td className="px-4 py-2 font-semibold text-brand-dark">
                      {run.job}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                          STATUS_STYLE[run.status] ??
                          "bg-brand-soft text-brand-muted"
                        }`}
                        // The message is the whole point of a failed row.
                        title={run.error ?? undefined}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-brand-muted">
                      {run.created}
                    </td>
                    <td className="px-4 py-2 text-right text-brand-muted">
                      {run.updated}
                    </td>
                    <td className="px-4 py-2 text-right text-brand-muted">
                      {run.skipped}
                    </td>
                    <td className="px-4 py-2 text-brand-muted">
                      {when(run.startedAt)}
                    </td>
                    <td className="px-4 py-2 text-brand-muted">
                      {when(run.finishedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-bold ${
          tone === "good"
            ? "text-green-700"
            : tone === "bad"
              ? "text-red-600"
              : "text-brand-dark"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
