import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

export type OfferStatus =
  "pending" | "accepted" | "declined" | "withdrawn" | "expired";

export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

export const OFFER_STATUS_TONE: Record<OfferStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-brand-cta/15 text-brand-cta-dark",
  declined: "bg-red-100 text-red-600",
  withdrawn: "bg-brand-soft text-brand-muted",
  expired: "bg-brand-soft text-brand-muted",
};

export type OfferCheck = {
  label: string;
  pass: boolean;
  detail?: string;
};

export type Offer = {
  id: number;
  status: OfferStatus;
  years: number;
  firstYearSalary: number;
  raisePct: number;
  contractType: string;
  signedVia: string;
  totalValue: number;
  /** What each year of the offer pays, worked out once on the server. */
  schedule: { yearIndex: number; salary: number }[];
  /** Rule 10.1 — one figure per season, and empty for every other type. */
  guaranteedAmounts: number[];
  checks: OfferCheck[];
  isLegal: boolean;
  expiresAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  team: {
    id: number;
    name: string;
    abbr: string;
    color: string;
    logo: string | null;
  };
  offeredBy: { id: number; name: string } | null;
  player: {
    leaguePlayerId: number;
    id: number;
    name: string;
    position: string | null;
    birdYears: number;
    status: string;
    currentTeam: { id: number; name: string; abbr: string } | null;
  };
};

export type FreeAgencyBoard = {
  seasonStartYear: number;
  windowOpen: boolean;
  window: {
    title: string;
    startDate: string;
    endDate: string | null;
  } | null;
  freeAgencyStyle: "dynamic" | "auction" | null;
  offers: Offer[];
};

export type BirdRights = "full" | "early" | "none";

export const BIRD_LABEL: Record<BirdRights, string> = {
  full: "Full Bird",
  early: "Early Bird",
  none: "Non-Bird",
};

export type PoolOffer = {
  id: number;
  team: { id: number; name: string; abbr: string; color: string };
  years: number;
  firstYearSalary: number;
  raisePct: number;
  contractType: string;
  signedVia: string;
  /** Rule 10.1 — one figure per season, and empty for every other type. */
  guaranteedAmounts: number[];
  totalValue: number;
  expiresAt: string | null;
  createdAt: string;
  isMine: boolean;
};

export type FreeAgent = {
  leaguePlayerId: number;
  playerId: number;
  name: string;
  position: string | null;
  nbaTeam: string | null;
  experience: number | null;
  experienceIsEstimated: boolean;
  birdYears: number;
  birdRights: BirdRights;
  status: string;
  faType: "UFA" | "RFA";
  rightsTeam: { id: number; name: string; abbr: string } | null;
  /** What he was paid in the last season of his previous deal, if any. */
  previousSalary: number | null;
  offers: PoolOffer[];
};

export type MyTeamBudget = {
  id: number;
  name: string;
  abbr: string;
  color: string;
  logo: string | null;
  salaryCap: number;
  minPlayerSalary: number;
  maxPlayerSalary: number;
  committed: number;
  capSpace: number | null;
  rosterCount: number;
  maxRosterSize: number;
  twoWayCount: number;
  maxTwoWay: number;
  hardCapEnabled: boolean;
  hardCapThreshold: number | null;
};

export type FreeAgentPool = {
  seasonStartYear: number;
  windowOpen: boolean;
  window: { title: string; startDate: string; endDate: string | null } | null;
  freeAgencyStyle: "dynamic" | "auction" | null;
  team: MyTeamBudget | null;
  players: FreeAgent[];
};

export type OfferInput = {
  leaguePlayerId: number;
  years: number;
  firstYearSalary: number;
  raisePct?: number;
  contractType?: string;
  signedVia?: string;
  /** Required for a partially guaranteed offer: one figure per season. */
  guaranteedAmounts?: number[];
  expiresAt?: string;
};

export const freeAgencyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueOffers: builder.query<FreeAgencyBoard, number>({
      query: (leagueId) => `/leagues/${leagueId}/free-agency/offers`,
      transformResponse: (r: ApiResponse<FreeAgencyBoard>) => unwrap(r),
      providesTags: (_result, _error, leagueId) => [
        { type: "FreeAgency" as const, id: leagueId },
      ],
    }),

    freeAgentPool: builder.query<
      FreeAgentPool,
      { leagueId: number; teamId?: number }
    >({
      query: ({ leagueId, teamId }) =>
        teamId
          ? `/leagues/${leagueId}/free-agency/players?teamId=${teamId}`
          : `/leagues/${leagueId}/free-agency/players`,
      transformResponse: (r: ApiResponse<FreeAgentPool>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "FreeAgency" as const, id: leagueId },
      ],
    }),

    submitOffer: builder.mutation<
      Offer,
      { leagueId: number; teamId: number; offer: OfferInput }
    >({
      query: ({ leagueId, teamId, offer }) => ({
        url: `/leagues/${leagueId}/free-agency/teams/${teamId}/offers`,
        method: "POST",
        body: offer,
      }),
      transformResponse: (r: ApiResponse<Offer>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "FreeAgency" as const, id: leagueId },
      ],
    }),

    acceptOffer: builder.mutation<Offer, { leagueId: number; offerId: number }>(
      {
        query: ({ leagueId, offerId }) => ({
          url: `/leagues/${leagueId}/free-agency/offers/${offerId}/accept`,
          method: "POST",
        }),
        transformResponse: (r: ApiResponse<Offer>) => unwrap(r),
        // Accepting writes a contract and moves a player, so the roster and cap
        // screens are no longer current either.
        invalidatesTags: (_result, _error, { leagueId }) => [
          { type: "FreeAgency" as const, id: leagueId },
          { type: "Rosters" as const, id: leagueId },
          { type: "Salaries" as const, id: leagueId },
        ],
      },
    ),

    declineOffer: builder.mutation<
      Offer,
      { leagueId: number; offerId: number }
    >({
      query: ({ leagueId, offerId }) => ({
        url: `/leagues/${leagueId}/free-agency/offers/${offerId}/decline`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<Offer>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "FreeAgency" as const, id: leagueId },
      ],
    }),

    withdrawOffer: builder.mutation<
      Offer,
      { leagueId: number; offerId: number }
    >({
      query: ({ leagueId, offerId }) => ({
        url: `/leagues/${leagueId}/free-agency/offers/${offerId}/withdraw`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<Offer>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "FreeAgency" as const, id: leagueId },
      ],
    }),
  }),
});

export const {
  useLeagueOffersQuery,
  useFreeAgentPoolQuery,
  useSubmitOfferMutation,
  useAcceptOfferMutation,
  useDeclineOfferMutation,
  useWithdrawOfferMutation,
} = freeAgencyApi;
