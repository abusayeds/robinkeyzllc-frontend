import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";
import type { ApiLeagueRole, LeagueVisibility } from "./leagueApi";

export type LeagueSetupMode = "startup" | "import";
export type FreeAgencyStyle = "dynamic" | "auction";
export type HardCapThreshold =
  | "none"
  | "luxuryTax"
  | "firstApron"
  | "secondApron";

export const SETUP_MODE_LABEL: Record<LeagueSetupMode, string> = {
  startup: "Startup League",
  import: "Import League",
};

export const SETUP_MODE_BODY: Record<LeagueSetupMode, string> = {
  startup:
    "Build a new league using the startup player pool and draft process.",
  import:
    "Use imported player and existing contract data to establish the league.",
};

export const FREE_AGENCY_LABEL: Record<FreeAgencyStyle, string> = {
  dynamic: "Dynamic Free Agency",
  auction: "Bidding Auction",
};

export const HARD_CAP_LABEL: Record<HardCapThreshold, string> = {
  none: "None",
  luxuryTax: "Luxury Tax",
  firstApron: "First Apron",
  secondApron: "Second Apron",
};

export type TradingRules = {
  salaryMatching: boolean;
  apronRules: boolean;
  allowTradeExceptions: boolean;
  allowTradingTradeExceptions: boolean;
  allowDraftPickTrading: boolean;
  /** Rule 12.1 — how many drafts ahead a pick may be traded. */
  pickTradingWindowDrafts: number;
  commissionerTradeApproval: boolean;
};

export type PositionSlots = {
  guard: number;
  forward: number;
  center: number;
  flex: number;
  bench: number;
  ir: number;
};

export type RosterRules = {
  minRosterSize: number;
  maxRosterSize: number;
  maxTwoWay: number;
  slots: PositionSlots;
  pregameLockMinutes: number;
};

export const PREGAME_LOCK_OPTIONS: { value: number; label: string; headline: string }[] = [
  { value: 5, label: "5 mins", headline: "Strictest - closest to tip-off" },
  { value: 15, label: "15 mins", headline: "Light buffer window" },
  { value: 30, label: "30 mins", headline: "Half-hour pre-game cutoff" },
  { value: 60, label: "60 mins", headline: "Conservative - 1 hr before tip" },
];

export const SLOT_LABEL: Record<keyof PositionSlots, string> = {
  guard: "Guard",
  forward: "Forward",
  center: "Center",
  flex: "Flex",
  bench: "Bench",
  ir: "IR",
};

/**
 * The same multipliers the server uses. Kept here too so the panel can follow
 * the salary cap while it is being typed — scaling the saved thresholds by a
 * ratio cannot work once the saved cap is 0, which is where a new league starts.
 */
export const CAP_MULTIPLIERS = {
  salaryFloor: 0.9,
  luxuryTax: 1.215,
  firstApron: 1.27,
  secondApron: 1.345,
  maxPlayerSalary: 0.35,
} as const;

/** Worked out from salaryCap on the server, so never sent back. */
export type CapThresholds = {
  salaryFloor: number;
  luxuryTax: number;
  firstApron: number;
  secondApron: number;
  maxPlayerSalary: number;
};

export type LeagueSettings = {
  leagueId: number;
  setupMode: LeagueSetupMode;
  setupLocked: boolean;
  freeAgencyStyle: FreeAgencyStyle;
  trading: TradingRules;
  salaryCap: number;
  minPlayerSalary: number;
  hardCapEnabled: boolean;
  hardCapThreshold: HardCapThreshold;
  roster: RosterRules;
  thresholds: CapThresholds;
  updatedAt: string;
};

// The payload is flat even though the response nests the trading rules,
// because PATCH only ever carries the keys that actually changed.
export type LeagueSettingsPatch = Partial<
  TradingRules & {
    setupMode: LeagueSetupMode;
    freeAgencyStyle: FreeAgencyStyle;
    salaryCap: number;
    minPlayerSalary: number;
    hardCapEnabled: boolean;
    hardCapThreshold: HardCapThreshold;
    minRosterSize: number;
    maxRosterSize: number;
    maxTwoWay: number;
    slotGuard: number;
    slotForward: number;
    slotCenter: number;
    slotFlex: number;
    slotBench: number;
    slotIr: number;
    pregameLockMinutes: number;
  }
>;

export type LeagueIdentity = {
  id: number;
  name: string;
  logo: string | null;
  visibility: LeagueVisibility;
  teamCount: number;
  season: string;
};

export type LeagueMember = {
  userId: number;
  name: string;
  email: string;
  image: string | null;
  role: ApiLeagueRole;
  hasTeam: boolean;
  /** The team they manage in this league, or null when they hold none. */
  team: { id: number; name: string; abbr: string; logo: string | null } | null;
  joinedAt: string;
};

export const leagueSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueSettings: builder.query<LeagueSettings, number>({
      query: (leagueId) => `/leagues/${leagueId}/settings`,
      transformResponse: (r: ApiResponse<LeagueSettings>) => unwrap(r),
      providesTags: (_result, _error, leagueId) => [
        { type: "LeagueSettings" as const, id: leagueId },
      ],
    }),

    updateLeagueSettings: builder.mutation<
      LeagueSettings,
      { leagueId: number; patch: LeagueSettingsPatch }
    >({
      query: ({ leagueId, patch }) => ({
        url: `/leagues/${leagueId}/settings`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (r: ApiResponse<LeagueSettings>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "LeagueSettings" as const, id: leagueId },
      ],
    }),

    updateLeague: builder.mutation<
      LeagueIdentity,
      {
        leagueId: number;
        patch: {
          name?: string;
          logo?: string | null;
          visibility?: LeagueVisibility;
        };
      }
    >({
      query: ({ leagueId, patch }) => ({
        url: `/leagues/${leagueId}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (r: ApiResponse<LeagueIdentity>) => unwrap(r),
      // The league name and logo show up in the league list too.
      invalidatesTags: ["Leagues"],
    }),

    leagueMembers: builder.query<LeagueMember[], number>({
      query: (leagueId) => `/leagues/${leagueId}/members`,
      transformResponse: (r: ApiResponse<LeagueMember[]>) => unwrap(r),
      providesTags: (_result, _error, leagueId) => [
        { type: "LeagueMembers" as const, id: leagueId },
      ],
    }),

    addCoCommissioner: builder.mutation<
      { userId: number; role: ApiLeagueRole },
      { leagueId: number; userId: number }
    >({
      query: ({ leagueId, userId }) => ({
        url: `/leagues/${leagueId}/co-commissioners`,
        method: "POST",
        body: { userId },
      }),
      transformResponse: (
        r: ApiResponse<{ userId: number; role: ApiLeagueRole }>,
      ) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "LeagueMembers" as const, id: leagueId },
      ],
    }),

    removeCoCommissioner: builder.mutation<
      { userId: number; role: ApiLeagueRole },
      { leagueId: number; userId: number }
    >({
      query: ({ leagueId, userId }) => ({
        url: `/leagues/${leagueId}/co-commissioners/${userId}`,
        method: "DELETE",
      }),
      transformResponse: (
        r: ApiResponse<{ userId: number; role: ApiLeagueRole }>,
      ) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "LeagueMembers" as const, id: leagueId },
      ],
    }),
  }),
});

export const {
  useLeagueSettingsQuery,
  useUpdateLeagueSettingsMutation,
  useUpdateLeagueMutation,
  useLeagueMembersQuery,
  useAddCoCommissionerMutation,
  useRemoveCoCommissionerMutation,
} = leagueSettingsApi;
