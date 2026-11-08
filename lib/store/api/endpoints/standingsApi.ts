import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

/**
 * Nine-category head-to-head, which is what `League.scoringType` says and what
 * the standings screen shows: FG%, FT%, 3PTM, PTS, REB, AST, STL, BLK, TO.
 */
export type CategoryKey =
  | "fgPct"
  | "ftPct"
  | "threes"
  | "pts"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "to";

export type StatCategories = Record<CategoryKey, number>;

export type Conference = "East" | "West";

export type StandingRow = {
  id: number;
  team: string;
  abbr: string;
  logo: string | null;
  color: string;
  conference: Conference;
  w: number;
  l: number;
  t: number;
  /** Record inside the team's division, or its conference when it has none. */
  div: string;
  l10: string;
  streak: string;
  /** Categories taken all season. */
  ptsFor: number;
  /** Categories given up. */
  ptsAgainst: number;
};

export type WeekPhase = "regular" | "playoffs";

export type ScheduleWeekRow = {
  weekNumber: number;
  startDate: string;
  endDate: string;
  phase: WeekPhase;
  isSettled: boolean;
};

export type LeagueStandings = {
  season: string;
  seasonStartYear: number;
  /** 0 before a schedule has been drawn. */
  week: number;
  weeks: ScheduleWeekRow[];
  settledWeeks: number;
  standings: StandingRow[];
};

export type CategoryTeamRow = StatCategories & {
  teamId: number;
  /** The week's league-wide score — `9 x teams` at best. */
  weekPoints: number;
  /** Categories taken over the range asked for. */
  categoryWins: number;
  /** Matchups won all season, whatever range is asked for. */
  h2hWins: number;
};

export type CategoryTotals = {
  seasonStartYear: number;
  categories: {
    key: CategoryKey;
    label: string;
    percent: boolean;
    lowerBetter: boolean;
  }[];
  teams: CategoryTeamRow[];
};

export type PlayoffTeam = { seed: number; team: string; teamId: number };

export type PlayoffSeries = {
  id: string;
  round: "Semifinal" | "Conference Final" | "Championship";
  /** "Final" on the championship, which belongs to neither conference. */
  conference: Conference | "Final";
  home?: PlayoffTeam;
  away?: PlayoffTeam;
  /** Categories taken that week, which is how a round is decided. */
  homeWins: number;
  awayWins: number;
  winnerId?: number;
  live?: boolean;
};

export type Playoffs = {
  title: string;
  statusLabel: string;
  series: PlayoffSeries[];
};

export type GeneratedSchedule = {
  seasonStartYear: number;
  weeks: number;
  regularWeeks: number;
  playoffWeeks: number;
  matchups: number;
};

/** The period toggle: year to date, one week, or a range of dates. */
export type CategoryRange =
  | { kind: "ytd" }
  | { kind: "week"; week: number }
  | { kind: "dates"; from: string; to: string };

const rangeQuery = (range: CategoryRange) => {
  if (range.kind === "week") return `?week=${range.week}`;
  if (range.kind === "dates") return `?from=${range.from}&to=${range.to}`;
  return "";
};

export const standingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueStandings: builder.query<LeagueStandings, { leagueId: number }>({
      query: ({ leagueId }) => `/leagues/${leagueId}/standings`,
      transformResponse: (r: ApiResponse<LeagueStandings>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Standings" as const, id: leagueId },
      ],
    }),

    categoryTotals: builder.query<
      CategoryTotals,
      { leagueId: number; range: CategoryRange }
    >({
      query: ({ leagueId, range }) =>
        `/leagues/${leagueId}/standings/categories${rangeQuery(range)}`,
      transformResponse: (r: ApiResponse<CategoryTotals>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Standings" as const, id: leagueId },
      ],
    }),

    leaguePlayoffs: builder.query<Playoffs, { leagueId: number }>({
      query: ({ leagueId }) => `/leagues/${leagueId}/standings/playoffs`,
      transformResponse: (r: ApiResponse<Playoffs>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Standings" as const, id: leagueId },
      ],
    }),

    generateSchedule: builder.mutation<
      GeneratedSchedule,
      { leagueId: number; start?: string; end?: string }
    >({
      query: ({ leagueId, start, end }) => {
        const params = new URLSearchParams();
        if (start) params.set("start", start);
        if (end) params.set("end", end);
        const qs = params.toString();
        return {
          url: `/leagues/${leagueId}/schedule/generate${qs ? `?${qs}` : ""}`,
          method: "POST",
        };
      },
      transformResponse: (r: ApiResponse<GeneratedSchedule>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Standings" as const, id: leagueId },
        { type: "Schedule" as const, id: leagueId },
      ],
    }),

    settleWeeks: builder.mutation<
      { settled: number[] },
      { leagueId: number }
    >({
      query: ({ leagueId }) => ({
        url: `/leagues/${leagueId}/schedule/settle`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<{ settled: number[] }>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Standings" as const, id: leagueId },
        { type: "Schedule" as const, id: leagueId },
      ],
    }),
  }),
});

export const {
  useLeagueStandingsQuery,
  useCategoryTotalsQuery,
  useLeaguePlayoffsQuery,
  useGenerateScheduleMutation,
  useSettleWeeksMutation,
} = standingsApi;

export type MatchupTeam = {
  id: number;
  name: string;
  abbr: string;
  logo: string | null;
  color: string;
  conference: Conference;
  /** "12-4", or "12-4-1" when the team has drawn a week. */
  record: string;
};

export type MatchupStatus = "upcoming" | "live" | "final";

export type ScheduleMatchup = {
  id: number;
  week: number;
  startDate: string;
  endDate: string;
  /** Null on a playoff slot nobody has qualified for yet. */
  homeId: number | null;
  awayId: number | null;
  /** Categories taken — the "score" of a nine-category week. */
  homeScore: number;
  awayScore: number;
  tied: number;
  winnerId: number | null;
  status: MatchupStatus;
  phase: WeekPhase;
  playoffRound: "semifinal" | "conferenceFinal" | "championship" | null;
  playoffConference: "east" | "west" | null;
  /**
   * Which categories each side took, by label. Empty until the week is
   * settled — a running total belongs on the matchup's own screen.
   */
  homeWonCategories: string[];
  awayWonCategories: string[];
};

export type LeagueMatchups = {
  seasonStartYear: number;
  currentWeek: number;
  teams: MatchupTeam[];
  matchups: ScheduleMatchup[];
};

export type MatchupCategory = {
  key: CategoryKey;
  label: string;
  percent: boolean;
  lowerBetter: boolean;
  home: number;
  away: number;
  /** True home took it, false away took it, null tied. */
  homeWins: boolean | null;
};

export type MatchupPlayerLine = {
  playerId: number;
  name: string;
  position: string | null;
  headshot: string | null;
  nbaTeam: string | null;
  /** How many games he played inside the week. 0 means he did not play. */
  games: number;
  fgm: number;
  fga: number;
  ftm: number;
  fta: number;
  threes: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
};

export type MatchupSide = {
  team: {
    id: number;
    name: string;
    abbr: string;
    logo: string | null;
    color: string;
    owner: { id: number; name: string } | null;
  } | null;
  categoryWins: number;
  weekPoints: number;
  playerCount: number;
  gamesPlayed: number;
  players: MatchupPlayerLine[];
} | null;

export type MatchupDetail = {
  id: number;
  week: number;
  startDate: string;
  endDate: string;
  status: MatchupStatus;
  phase: WeekPhase;
  playoffRound: string | null;
  playoffConference: string | null;
  homeScore: number;
  awayScore: number;
  tied: number;
  winnerId: number | null;
  categories: MatchupCategory[];
  home: MatchupSide;
  away: MatchupSide;
};

export const scheduleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueMatchups: builder.query<LeagueMatchups, { leagueId: number }>({
      query: ({ leagueId }) => `/leagues/${leagueId}/schedule/matchups`,
      transformResponse: (r: ApiResponse<LeagueMatchups>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Schedule" as const, id: leagueId },
      ],
    }),

    matchupDetail: builder.query<
      MatchupDetail,
      { leagueId: number; matchupId: number }
    >({
      query: ({ leagueId, matchupId }) =>
        `/leagues/${leagueId}/schedule/matchups/${matchupId}`,
      transformResponse: (r: ApiResponse<MatchupDetail>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Schedule" as const, id: leagueId },
      ],
    }),
  }),
});

export const { useLeagueMatchupsQuery, useMatchupDetailQuery } = scheduleApi;
