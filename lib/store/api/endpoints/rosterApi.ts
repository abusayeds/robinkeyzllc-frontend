import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

export type SlotType = "standard" | "twoWay" | "injuredReserve";
export type LeaguePlayerStatus =
  | "rostered"
  | "rightsHeld"
  | "freeAgent"
  | "waived";

export const SLOT_LABEL: Record<SlotType, string> = {
  standard: "Roster",
  twoWay: "Two-way",
  injuredReserve: "Injured reserve",
};

export const STATUS_LABEL: Record<LeaguePlayerStatus, string> = {
  rostered: "Rostered",
  rightsHeld: "Rights held",
  freeAgent: "Free agent",
  waived: "Waived",
};

export type ContractSeason = {
  seasonStartYear: number;
  salary: number;
  capHit: number;
  optionType: "player" | "team" | "earlyTermination" | null;
  guaranteeType: "full" | "partial" | "none";
  guaranteedAmount: number | null;
};

export type RosterPlayer = {
  id: number;
  playerId: number;
  name: string;
  position: string | null;
  nbaTeam: string | null;
  experience: number | null;
  experienceIsEstimated: boolean;
  birdYears: number;
  status: LeaguePlayerStatus;
  slotType: SlotType;
  contract: {
    id: number;
    type: string;
    signedVia: string;
    startSeasonStartYear: number;
    endSeasonStartYear: number;
    years: number;
    rfaOnExpiry: boolean;
    seasons: ContractSeason[];
  } | null;
  /** Null when he has no contract this season — not the same as zero. */
  salary: number | null;
  capHit: number | null;
};

export type RosterTeam = {
  id: number;
  name: string;
  abbr: string;
  color: string;
  logo: string | null;
  counts: {
    standard: number;
    twoWay: number;
    injuredReserve: number;
    rightsHeld: number;
    total: number;
  };
  warnings: string[];
  players: RosterPlayer[];
};

export type RosterRules = {
  minRosterSize: number;
  maxRosterSize: number;
  maxTwoWay: number;
  slotGuard: number;
  slotForward: number;
  slotCenter: number;
  slotFlex: number;
  slotBench: number;
  slotIr: number;
} | null;

export type LeagueRosters = {
  seasonStartYear: number;
  rules: RosterRules;
  teams: RosterTeam[];
  unassigned: RosterPlayer[];
};

export const rosterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueRosters: builder.query<LeagueRosters, number>({
      query: (leagueId) => `/leagues/${leagueId}/rosters`,
      transformResponse: (r: ApiResponse<LeagueRosters>) => unwrap(r),
      providesTags: (_result, _error, leagueId) => [
        { type: "Rosters" as const, id: leagueId },
      ],
    }),
  }),
});

export const { useLeagueRostersQuery } = rosterApi;

export type TeamHolderUser = {
  id: number;
  name: string;
  image: string | null;
} | null;

export type TeamRosterView = {
  seasonStartYear: number;
  rules: RosterRules;
  team: {
    id: number;
    name: string;
    abbr: string;
    color: string;
    logo: string | null;
    owner: TeamHolderUser;
    coOwner: TeamHolderUser;
  };
  counts: {
    standard: number;
    twoWay: number;
    injuredReserve: number;
    rightsHeld: number;
  };
  cap: {
    salaryCap: number;
    payroll: number;
    deadMoney: number;
    capHolds: number;
    committed: number;
    capSpace: number | null;
  };
  deadMoneyRows: {
    id: number;
    playerId: number;
    name: string;
    amount: number;
    isStretched: boolean;
  }[];
  capHoldRows: {
    id: number;
    playerId: number;
    name: string;
    amount: number;
    isQualifyingOffer: boolean;
  }[];
  players: RosterPlayer[];
};

export const teamRosterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    teamRoster: builder.query<
      TeamRosterView,
      { leagueId: number; teamId: number }
    >({
      query: ({ leagueId, teamId }) => `/leagues/${leagueId}/rosters/${teamId}`,
      transformResponse: (r: ApiResponse<TeamRosterView>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Rosters" as const, id: leagueId },
      ],
    }),

    setRosterSlot: builder.mutation<
      TeamRosterView,
      {
        leagueId: number;
        teamId: number;
        leaguePlayerId: number;
        slotType: SlotType;
      }
    >({
      query: ({ leagueId, teamId, leaguePlayerId, slotType }) => ({
        url: `/leagues/${leagueId}/rosters/${teamId}/players/${leaguePlayerId}/slot`,
        method: "PATCH",
        body: { slotType },
      }),
      transformResponse: (r: ApiResponse<TeamRosterView>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Rosters" as const, id: leagueId },
        { type: "Overview" as const, id: leagueId },
      ],
    }),
  }),
});

export const { useTeamRosterQuery, useSetRosterSlotMutation } = teamRosterApi;
