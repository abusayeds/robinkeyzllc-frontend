import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";
import type { CalendarPhase } from "./calendarApi";
import type { HardCapApron, Tier } from "./salaryApi";

export type TeamHolder = { id: number; name: string; image: string | null } | null;

/** How loudly an item asks to be dealt with. */
export type AttentionSeverity = "action" | "warning" | "info";

export type AttentionItem = {
  kind: string;
  severity: AttentionSeverity;
  title: string;
  detail: string;
  href: string;
  count: number;
};

export type DashboardEvent = {
  id: number;
  title: string;
  phase: CalendarPhase;
  startDate: string;
  endDate: string | null;
  isApproximate: boolean;
  displayLabel: string | null;
  time: string | null;
  /** Already running, which reads differently from "coming up". */
  isLive: boolean;
};

export type ActivityItem = {
  id: string;
  kind: "trade" | "signing" | "pick";
  at: string;
  title: string;
  detail: string;
};

export type DraftAssetYear = {
  seasonStartYear: number;
  firstRound: number;
  secondRound: number;
  /** Picks whose seat belongs to another team (Article 12). */
  viaTrade: number;
};

export type DashboardException = {
  id: number;
  label: string;
  amount: number;
  remaining: number;
  expiresAt: string;
};

/** Rule 4.7 — `apron` is null when no ceiling applies, which is most teams. */
export type DashboardHardCap = {
  apron: HardCapApron | null;
  apronLabel: string | null;
  ceiling: number | null;
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

export type TeamDashboard = {
  seasonStartYear: number;
  season: string;
  league: { id: number; name: string; logo: string | null };
  team: {
    id: number;
    name: string;
    abbr: string;
    color: string;
    logo: string | null;
    owner: TeamHolder;
    coOwner: TeamHolder;
    /** Whether the signed-in user holds this team, which gates the actions. */
    isMine: boolean;
    myRole: "owner" | "coOwner" | null;
  };
  cap: {
    isSet: boolean;
    source: "default" | "custom";
    salaryCap: number;
    salaryFloor: number;
    luxuryTax: number;
    firstApron: number;
    secondApron: number;
    payroll: number;
    deadMoney: number;
    capHolds: number;
    teamSalary: number;
    capSpace: number | null;
    tier: Tier;
    tierLabel: string;
    /** Rule 3.5 — tracked and shown, with no penalty in Version 1. */
    belowFloor: boolean;
    floorShortfall: number;
  };
  hardCap: DashboardHardCap;
  roster: {
    standard: number;
    twoWay: number;
    injuredReserve: number;
    rightsHeld: number;
    minRosterSize: number;
    maxRosterSize: number;
    maxTwoWay: number;
    /** Two-way players excluded, the way Rule 4.8 counts (see the service). */
    rosterForMinimum: number;
    openSpots: number;
    belowMinimum: boolean;
    overMaximum: boolean;
    overTwoWay: boolean;
  };
  attention: AttentionItem[];
  upcoming: DashboardEvent[];
  activity: ActivityItem[];
  draftAssets: { total: number; byYear: DraftAssetYear[] };
  exceptions: DashboardException[];
};

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    teamDashboard: builder.query<
      TeamDashboard,
      { leagueId: number; teamId: number }
    >({
      query: ({ leagueId, teamId }) =>
        `/leagues/${leagueId}/dashboard/${teamId}`,
      transformResponse: (r: ApiResponse<TeamDashboard>) => unwrap(r),
      // Everything on this page is derived: a trade, a signing, a roster move
      // or a settings change all land here, and each of those already
      // invalidates one of these tags.
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Overview" as const, id: leagueId },
        { type: "Salaries" as const, id: leagueId },
        { type: "Rosters" as const, id: leagueId },
        { type: "Trades" as const, id: leagueId },
      ],
    }),
  }),
});

export const { useTeamDashboardQuery } = dashboardApi;
