import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";
import type { ContractSeason, LeaguePlayerStatus, SlotType } from "./rosterApi";

/**
 * One player's card, in one request.
 *
 * League-scoped although the player is global, because half of the card is
 * this league's own — his contract, his bird years, the team holding him —
 * while his bio, averages, career table and game log are the same everywhere.
 *
 * This replaces what the card used to invent: a game log and a career history
 * generated from a hash of the player id.
 */

export type PlayerBio = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  position: string | null;
  nbaTeam: string | null;
  nbaTeamName: string | null;
  /** As the feed sends it — "6-7". Null for a player no sync has reached. */
  height: string | null;
  /** Pounds, as text. Null for the same reason. */
  weight: string | null;
  college: string | null;
  country: string | null;
  /** Null until a Super Admin has imported his birthdate. */
  age: number | null;
  experience: number | null;
  experienceIsEstimated: boolean;
  /** "2021 Rd 1 Pk 14", or null for an undrafted player. */
  draftInfo: string | null;
  headshot: string | null;
  isActive: boolean;
};

export type PlayerInjury = {
  /** The feed's own words: "Out", "Day-To-Day", "Game Time Decision". */
  status: string;
  description: string | null;
  returnDate: string | null;
};

export type PlayerLeagueStanding = {
  leaguePlayerId: number;
  status: LeaguePlayerStatus;
  slotType: SlotType;
  birdYears: number;
  team: {
    id: number;
    name: string;
    abbr: string;
    logo: string | null;
  } | null;
};

export type PlayerContract = {
  id: number;
  type: string;
  signedVia: string;
  source: string;
  signedSeasonStartYear: number | null;
  startSeasonStartYear: number;
  endSeasonStartYear: number;
  years: number;
  /** Counted from this league's season, not from the first year of the deal. */
  yearsRemaining: number;
  rfaOnExpiry: boolean;
  seasons: ContractSeason[];
};

export type PlayerSeasonAverage = {
  season: number;
  gamesPlayed: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  threes: number;
  /** Whole percent — season makes over season attempts, not an average. */
  fgPct: number;
  ftPct: number;
};

export type PlayerCareerSeason = PlayerSeasonAverage & {
  /** Null when no stored line says which side he was on. "2TM" when traded. */
  team: string | null;
  fg3Pct: number;
};

export type PlayerGameLogRow = {
  date: string;
  opponent: string | null;
  isHome: boolean | null;
  /** Null for a game still in progress, or one whose side is unknown. */
  won: boolean | null;
  teamScore: number | null;
  opponentScore: number | null;
  minutes: string | null;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  threes: number;
  fgm: number;
  fga: number;
  ftm: number;
  fta: number;
  fgPct: number;
};

export type PlayerProfile = {
  seasonStartYear: number;
  player: PlayerBio;
  /** Null when he is healthy — the feed only carries the injured. */
  injury: PlayerInjury | null;
  /** Null for a player this league has never held, which a draft pool is full of. */
  league: PlayerLeagueStanding | null;
  contract: PlayerContract | null;
  /** Null before any season has been synced or backfilled. */
  seasonAverages: PlayerCareerSeason | null;
  career: PlayerCareerSeason[];
  gameLog: PlayerGameLogRow[];
};

export const playerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    playerProfile: builder.query<
      PlayerProfile,
      { leagueId: number; playerId: number }
    >({
      query: ({ leagueId, playerId }) =>
        `/leagues/${leagueId}/players/${playerId}/profile`,
      transformResponse: (r: ApiResponse<PlayerProfile>) => unwrap(r),
      // The league half of the card moves with a roster or a contract change;
      // the stats half is written by the nightly sync, which no mutation here
      // can touch.
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Rosters" as const, id: leagueId },
      ],
    }),
  }),
});

export const { usePlayerProfileQuery } = playerApi;
