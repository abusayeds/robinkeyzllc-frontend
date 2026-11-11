import { baseApi, unwrap } from "../baseApi";
import type { TeamIntelStatus } from "./teamApi";
import type { ApiResponse } from "../types";

export type SlotType = "standard" | "twoWay" | "injuredReserve";
export type LeaguePlayerStatus =
  "rostered" | "rightsHeld" | "freeAgent" | "waived";

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
  headshot: string | null;
  /** Null when he is healthy — the feed only carries the injured. */
  injury: { status: string; returnDate: string | null } | null;
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

/** One season of money a waived player leaves behind. */
export type DeadSeason = { seasonStartYear: number; amount: number };

export type WaivePreview = {
  playerName: string;
  seasonStartYear: number;
  /** The seasons still owed, as the contract stands. */
  straight: DeadSeason[];
  straightTotal: number;
  /** Rule 10.15 — null when the stretch is unavailable, with a reason below. */
  stretch: DeadSeason[] | null;
  stretchYears: number;
  stretchBlockedReason: string | null;
  /** Rule 10.15 — 15% of the cap, the ceiling on a team's stretched salary. */
  stretchLimit: number;
  stretchAlreadyUsed: number;
};

export type WaiveResult = {
  playerName: string;
  stretched: boolean;
  seasons: DeadSeason[];
  total: number;
};

/** Rules 10.2 to 10.8 — what an extension may be worth and how long it runs. */
export type ExtensionLimits = {
  kind: "veteran" | "rookieScale";
  bird: "full" | "early" | "none";
  priorSalary: number;
  /** Rule 10.2 — caps every season below it. */
  maximumSalary: number;
  /** Rules 10.7 / 10.8 — the most the first new season may pay. */
  maxFirstYear: number;
  /** Which rule produced the ceiling, so the screen can say why. */
  maxFirstYearBasis: string;
  maxSeasons: number;
  /** Rule 10.5, as an amount rather than a rate. */
  raiseStep: number;
  firstSeasonStartYear: number;
};

/**
 * Either the limits, or the reason there are none.
 *
 * A refusal is a field rather than an error: the screen has to be able to say
 * whether an owner should come back next season or never.
 */
export type ExtensionOffer =
  | {
      eligible: false;
      blockedReason: string;
      playerName: string;
    }
  | {
      eligible: true;
      blockedReason: null;
      playerName: string;
      current: {
        contractId: number;
        startSeasonStartYear: number;
        endSeasonStartYear: number;
        finalSeasonSalary: number;
      };
      limits: ExtensionLimits;
    };

export type ExtensionYear = {
  seasonStartYear: number;
  salary: number;
  optionType: "player" | "team" | null;
};

export type ExtensionResult = {
  playerName: string;
  contract: {
    id: number;
    startSeasonStartYear: number;
    endSeasonStartYear: number;
    years: ExtensionYear[];
  };
  total: number;
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
    /** League Intel, set by this team's own owner. Null when unset. */
    intelStatus: TeamIntelStatus | null;
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

    waivePreview: builder.query<
      WaivePreview,
      { leagueId: number; teamId: number; leaguePlayerId: number }
    >({
      query: ({ leagueId, teamId, leaguePlayerId }) =>
        `/leagues/${leagueId}/rosters/${teamId}/players/${leaguePlayerId}/waive-preview`,
      transformResponse: (r: ApiResponse<WaivePreview>) => unwrap(r),
      // Not tagged: it is a question about a contract that has not changed,
      // asked once when the confirmation opens.
    }),

    waivePlayer: builder.mutation<
      WaiveResult,
      {
        leagueId: number;
        teamId: number;
        leaguePlayerId: number;
        stretch: boolean;
      }
    >({
      query: ({ leagueId, teamId, leaguePlayerId, stretch }) => ({
        url: `/leagues/${leagueId}/rosters/${teamId}/players/${leaguePlayerId}/waive`,
        method: "POST",
        body: { stretch },
      }),
      transformResponse: (r: ApiResponse<WaiveResult>) => unwrap(r),
      // A waive empties a roster spot, writes dead money and ends a contract,
      // so the roster, the cap sheet and the transactions feed all move.
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Rosters" as const, id: leagueId },
        { type: "Salaries" as const, id: leagueId },
        { type: "Trades" as const, id: leagueId },
        { type: "Overview" as const, id: leagueId },
      ],
    }),

    extensionLimits: builder.query<
      ExtensionOffer,
      { leagueId: number; teamId: number; leaguePlayerId: number }
    >({
      query: ({ leagueId, teamId, leaguePlayerId }) =>
        `/leagues/${leagueId}/rosters/${teamId}/players/${leaguePlayerId}/extension`,
      transformResponse: (r: ApiResponse<ExtensionOffer>) => unwrap(r),
      // Tagged on rosters: signing one extension changes whether the next
      // player on the same team can have one.
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Rosters" as const, id: leagueId },
      ],
    }),

    offerExtension: builder.mutation<
      ExtensionResult,
      {
        leagueId: number;
        teamId: number;
        leaguePlayerId: number;
        years: ExtensionYear[];
      }
    >({
      query: ({ leagueId, teamId, leaguePlayerId, years }) => ({
        url: `/leagues/${leagueId}/rosters/${teamId}/players/${leaguePlayerId}/extension`,
        method: "POST",
        body: { years },
      }),
      transformResponse: (r: ApiResponse<ExtensionResult>) => unwrap(r),
      // A second contract on the player, so the roster, the cap sheet and the
      // multi-season outlook all move.
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Rosters" as const, id: leagueId },
        { type: "Salaries" as const, id: leagueId },
        { type: "Overview" as const, id: leagueId },
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

export const {
  useTeamRosterQuery,
  useSetRosterSlotMutation,
  useWaivePreviewQuery,
  useWaivePlayerMutation,
  useExtensionLimitsQuery,
  useOfferExtensionMutation,
} = teamRosterApi;
