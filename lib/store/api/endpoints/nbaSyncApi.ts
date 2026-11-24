import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

/** One recorded pull from the NBA feed. */
export type SyncRun = {
  id: number;
  job: string;
  status: "running" | "succeeded" | "failed";
  created: number;
  updated: number;
  skipped: number;
  cursor: string | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
};

/** What the nightly job is wired to do, and what it has left to do. */
export type NightlyStatus = {
  schedule: string;
  backfillNights: number;
  keyConfigured: boolean;
  lastGamesSync: SyncRun | null;
  lastStatsSync: SyncRun | null;
  weeksAwaitingSettlement: number;
};

/** What a date-range backfill reports when it finishes. */
export type BackfillResult = {
  nights: number;
  gamesCreated: number;
  gamesUpdated: number;
  linesCreated: number;
  linesUpdated: number;
  linesSkipped: number;
  failedNights: string[];
};

export const nbaSyncApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    syncRuns: builder.query<SyncRun[], void>({
      query: () => `/nba/sync/runs`,
      transformResponse: (r: ApiResponse<SyncRun[]>) => unwrap(r),
      providesTags: ["NbaSync"],
    }),

    nightlyStatus: builder.query<NightlyStatus, void>({
      query: () => `/nba/sync/nightly`,
      transformResponse: (r: ApiResponse<NightlyStatus>) => unwrap(r),
      providesTags: ["NbaSync"],
    }),

    syncTeams: builder.mutation<SyncRun, void>({
      query: () => ({ url: `/nba/sync/teams`, method: "POST" }),
      transformResponse: (r: ApiResponse<SyncRun>) => unwrap(r),
      invalidatesTags: ["NbaSync"],
    }),

    /** Height, weight, draft line and current team for every active player. */
    syncPlayers: builder.mutation<SyncRun, void>({
      query: () => ({ url: `/nba/sync/players`, method: "POST" }),
      transformResponse: (r: ApiResponse<SyncRun>) => unwrap(r),
      invalidatesTags: ["NbaSync"],
    }),

    /**
     * This season's averages as the feed publishes them.
     *
     * The figures a player card shows. Without them the card falls back to
     * totalling the game lines this deployment happens to hold, which reads a
     * 17-game season as however many nights have been pulled.
     */
    syncSeasonAverages: builder.mutation<SyncRun, { season?: number }>({
      query: ({ season }) => ({
        url: season
          ? `/nba/sync/season-averages?season=${season}`
          : `/nba/sync/season-averages`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<SyncRun>) => unwrap(r),
      invalidatesTags: ["NbaSync", "Rosters", "Salaries", "DraftPool"],
    }),

    /**
     * Every earlier season each rostered player played, for the career table.
     *
     * One request per hundred players per season, so this is the slow one.
     */
    syncCareers: builder.mutation<SyncRun, { from?: number }>({
      query: ({ from }) => ({
        url: from ? `/nba/sync/careers?from=${from}` : `/nba/sync/careers`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<SyncRun>) => unwrap(r),
      invalidatesTags: ["NbaSync", "Rosters", "Salaries", "DraftPool"],
    }),

    /** Games then every night's lines, across a date range. */
    syncBackfill: builder.mutation<
      BackfillResult,
      { start: string; end: string }
    >({
      query: ({ start, end }) => ({
        url: `/nba/sync/backfill?start=${start}&end=${end}`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<BackfillResult>) => unwrap(r),
      invalidatesTags: ["NbaSync", "Rosters", "Salaries", "DraftPool"],
    }),

    syncInjuries: builder.mutation<SyncRun, void>({
      query: () => ({ url: `/nba/sync/injuries`, method: "POST" }),
      transformResponse: (r: ApiResponse<SyncRun>) => unwrap(r),
      invalidatesTags: ["NbaSync", "Rosters"],
    }),

    /** Last night's games and lines, injuries, then any week due to settle. */
    runNightly: builder.mutation<NightlyStatus, void>({
      query: () => ({ url: `/nba/sync/nightly`, method: "POST" }),
      transformResponse: (r: ApiResponse<NightlyStatus>) => unwrap(r),
      invalidatesTags: ["NbaSync", "Rosters", "Salaries", "Standings"],
    }),
  }),
});

export const {
  useSyncRunsQuery,
  useNightlyStatusQuery,
  useSyncTeamsMutation,
  useSyncPlayersMutation,
  useSyncSeasonAveragesMutation,
  useSyncCareersMutation,
  useSyncBackfillMutation,
  useSyncInjuriesMutation,
  useRunNightlyMutation,
} = nbaSyncApi;
