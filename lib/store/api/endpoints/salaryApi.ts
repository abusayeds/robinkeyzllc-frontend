import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";
import type { ContractSeason, SlotType } from "./rosterApi";

/** Article 3 of the AVORA CBA — the five tiers, named as the rule book names them. */
export type Tier =
  | "capNotSet"
  | "belowCap"
  | "overCap"
  | "luxuryTax"
  | "firstApron"
  | "secondApron";

export const TIER_LABEL: Record<Tier, string> = {
  capNotSet: "Cap not set",
  belowCap: "Below Cap",
  overCap: "Over Cap, Below Tax",
  luxuryTax: "Luxury Tax",
  firstApron: "First Apron",
  secondApron: "Second Apron",
};

/** Calm for healthy, warmer the further over a team is. */
export const TIER_TONE: Record<Tier, string> = {
  capNotSet: "bg-brand-soft text-brand-muted",
  belowCap: "bg-brand-cta/15 text-brand-cta-dark",
  overCap: "bg-amber-100 text-amber-700",
  luxuryTax: "bg-orange-100 text-orange-700",
  firstApron: "bg-red-100 text-red-600",
  secondApron: "bg-red-200 text-red-700",
};

export type SalaryContract = {
  id: number;
  leaguePlayerId: number;
  playerId: number;
  name: string;
  position: string | null;
  type: string;
  signedVia: string;
  slotType: SlotType;
  birdYears: number;
  isRightsHeld: boolean;
  startSeasonStartYear: number;
  endSeasonStartYear: number;
  years: number;
  rfaOnExpiry: boolean;
  salary: number;
  capHit: number;
  optionType: "player" | "team" | "earlyTermination" | null;
  guaranteeType: "full" | "partial" | "none" | null;
  guaranteedAmount: number | null;
  seasons: ContractSeason[];
};

export type DeadMoneyRow = {
  id: number;
  playerId: number;
  name: string;
  amount: number;
  isStretched: boolean;
};

export type CapHoldRow = {
  id: number;
  playerId: number;
  name: string;
  amount: number;
  isQualifyingOffer: boolean;
};

export type SalaryTeam = {
  id: number;
  name: string;
  abbr: string;
  color: string;
  logo: string | null;
  payroll: number;
  deadMoney: number;
  capHolds: number;
  totalCommitted: number;
  /** Null when the league has not set a cap — there is nothing to have room under. */
  capSpace: number | null;
  tier: Tier;
  tierLabel: string;
  /** Rule 3.5 — tracked and shown, with no penalty in Version 1. */
  belowFloor: boolean;
  contractCount: number;
  contracts: SalaryContract[];
  deadMoneyRows: DeadMoneyRow[];
  capHoldRows: CapHoldRow[];
};

export type SalaryCap = {
  salaryCap: number;
  /** Whether these came from the app's figures or the league's own (Rule 2.1). */
  source: "default" | "custom";
  minPlayerSalary: number;
  hardCapEnabled: boolean;
  hardCapThreshold: string | null;
  salaryFloor: number;
  luxuryTax: number;
  firstApron: number;
  secondApron: number;
  averagePlayerSalary: number;
  /** Rule 10.2 — the maximum depends on years of service. */
  maxSalary0to6: number;
  maxSalary7to9: number;
  maxSalary10Plus: number;
  nonTaxpayerMle: number;
  taxpayerMle: number;
  roomException: number;
  biAnnualException: number;
};

export type SalaryOverview = {
  seasonStartYear: number;
  cap: SalaryCap;
  teams: SalaryTeam[];
};

/**
 * The tag a season carries on screen, in the file's own shorthand.
 *
 * Takes the two fields rather than a whole season row, because the figures for
 * the current season are already flattened onto the contract and looking them
 * up again by amount would match the wrong year whenever two seasons pay the
 * same.
 */
export const seasonTag = (season: {
  optionType: ContractSeason["optionType"];
  guaranteeType: ContractSeason["guaranteeType"] | null;
}): string | null => {
  if (season.optionType === "player") return "PO";
  if (season.optionType === "team") return "TO";
  if (season.optionType === "earlyTermination") return "ETO";
  if (season.guaranteeType === "none") return "NG";
  if (season.guaranteeType === "partial") return "PG";
  return null;
};

export const salaryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueSalaries: builder.query<
      SalaryOverview,
      { leagueId: number; season?: number }
    >({
      query: ({ leagueId, season }) =>
        season
          ? `/leagues/${leagueId}/salaries?season=${season}`
          : `/leagues/${leagueId}/salaries`,
      transformResponse: (r: ApiResponse<SalaryOverview>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Salaries" as const, id: leagueId },
      ],
    }),
  }),
});

export const { useLeagueSalariesQuery } = salaryApi;

/** Article 4 — the two ceilings a move can buy. */
export type HardCapApron = "firstApron" | "secondApron";

/**
 * Rule 4.7 — what a hard-capped team is owed on screen: the ceiling, the room
 * left under it, and which move bought it.
 *
 * `apron` is null for most teams most of the time, which is the whole point of
 * Article 4: a hard cap is earned, not a tier every team sits in.
 */
export type TeamHardCap = {
  team: { id: number; name: string; abbr: string; logo: string | null };
  teamSalary: number;
  apron: HardCapApron | null;
  apronLabel: string | null;
  ceiling: number | null;
  /** Rule 4.8 — spots still to fill before the league's roster minimum. */
  openSpots: number;
  reserve: number;
  committed: number;
  room: number | null;
  pass: boolean;
  shortfall: number;
  message: string;
  trigger: string | null;
  triggerLabel: string | null;
  rosterCount: number;
  rosterMinimum: number;
  rookieMinimum: number;
};

export type LeagueHardCaps = {
  seasonStartYear: number;
  teams: TeamHardCap[];
};

export const hardCapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueHardCaps: builder.query<LeagueHardCaps, { leagueId: number }>({
      query: ({ leagueId }) => `/leagues/${leagueId}/cap/hard-caps`,
      transformResponse: (r: ApiResponse<LeagueHardCaps>) => unwrap(r),
      // A processed trade is what creates one, and trades already invalidate
      // Salaries, so no extra tag has to be minted for this.
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Salaries" as const, id: leagueId },
      ],
    }),
  }),
});

export const { useLeagueHardCapsQuery } = hardCapApi;

export type OutlookSeason = {
  seasonStartYear: number;
  payroll: number;
  deadMoney: number;
  capHolds: number;
  committed: number;
  capSpace: number | null;
  playerCount: number;
};

export type PayrollOutlook = {
  team: {
    id: number;
    name: string;
    abbr: string;
    color: string;
    logo: string | null;
  };
  firstSeasonStartYear: number;
  salaryCap: number;
  /** One cap covers every season, because a league stores only one. */
  capIsCurrentSeasonOnly: boolean;
  seasons: OutlookSeason[];
};

export const payrollApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    payrollOutlook: builder.query<
      PayrollOutlook,
      { leagueId: number; teamId: number }
    >({
      query: ({ leagueId, teamId }) =>
        `/leagues/${leagueId}/salaries/outlook/${teamId}`,
      transformResponse: (r: ApiResponse<PayrollOutlook>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Salaries" as const, id: leagueId },
      ],
    }),
  }),
});

export const { usePayrollOutlookQuery } = payrollApi;
