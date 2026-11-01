import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";
import type { CalendarPhase } from "./calendarApi";

export type TeamTotals = {
  id: number;
  name: string;
  abbr: string;
  color: string;
  logo: string | null;
  hasOwner: boolean;
  rosterCount: number;
  twoWayCount: number;
  payroll: number;
};

export type LeagueOverview = {
  league: {
    id: number;
    name: string;
    logo: string | null;
    season: string;
    seasonStartYear: number;
    visibility: "private" | "public";
    setupMode: "startup" | "import" | null;
    setupLocked: boolean;
  };
  setup: {
    teamsCreated: number;
    teamCount: number;
    membersJoined: number;
    pendingInvites: number;
    salaryCapSet: boolean;
    rosterRulesSet: boolean;
    calendarEvents: number;
    playersImported: number;
  };
  teams: {
    total: number;
    max: number;
    withOwner: number;
    withoutOwner: TeamTotals[];
  };
  players: {
    total: number;
    rostered: number;
    freeAgents: number;
    rightsHeld: number;
  };
  payroll: {
    salaryCap: number;
    salaryFloor: number | null;
    luxuryTax: number | null;
    firstApron: number | null;
    secondApron: number | null;
    capSource: "default" | "custom";
    total: number;
    contractedPlayers: number;
    averageTeamPayroll: number | null;
    averagePlayerSalary: number | null;
    highest: TeamTotals | null;
    lowest: TeamTotals | null;
  };
  attention: {
    pendingInvites: number;
    pendingOffers: number;
    teamsWithoutOwner: number;
    overRoster: {
      id: number;
      name: string;
      abbr: string;
      rosterCount: number;
      maxRosterSize: number | null;
    }[];
  };
  /** Rule 3.5 — shown, but not something to fix. */
  tracking: {
    belowFloor: {
      id: number;
      name: string;
      abbr: string;
      payroll: number;
      salaryFloor: number;
    }[];
  };
  upcoming: {
    id: number;
    title: string;
    phase: CalendarPhase;
    startDate: string;
    endDate: string | null;
    isApproximate: boolean;
    displayLabel: string | null;
  }[];
  teamTotals: TeamTotals[];
};

export const overviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueOverview: builder.query<LeagueOverview, number>({
      query: (leagueId) => `/leagues/${leagueId}/overview`,
      transformResponse: (r: ApiResponse<LeagueOverview>) => unwrap(r),
      // Every one of these numbers comes from somewhere else, so the overview
      // has to follow all of them.
      providesTags: (_result, _error, leagueId) => [
        { type: "Overview" as const, id: leagueId },
        { type: "Teams" as const, id: leagueId },
        { type: "Rosters" as const, id: leagueId },
        { type: "Salaries" as const, id: leagueId },
        { type: "FreeAgency" as const, id: leagueId },
        { type: "Invites" as const, id: leagueId },
      ],
    }),
  }),
});

export const { useLeagueOverviewQuery } = overviewApi;
