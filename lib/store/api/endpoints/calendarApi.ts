import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

export const CALENDAR_PHASES = [
  "leagueYear",
  "freeAgency",
  "contracts",
  "nba",
  "draft",
  "roster",
  "season",
  "trades",
  "playoffs",
  "offseason",
] as const;

export type CalendarPhase = (typeof CALENDAR_PHASES)[number];

export const PHASE_LABEL: Record<CalendarPhase, string> = {
  leagueYear: "League Year",
  freeAgency: "Free Agency",
  contracts: "Contracts",
  nba: "NBA",
  draft: "Draft",
  roster: "Roster",
  season: "Season",
  trades: "Trades",
  playoffs: "Playoffs",
  offseason: "Offseason",
};

export const PHASE_COLOR: Record<CalendarPhase, string> = {
  leagueYear: "bg-emerald-100 text-emerald-700",
  freeAgency: "bg-green-100 text-green-700",
  contracts: "bg-blue-100 text-blue-700",
  nba: "bg-gray-200 text-gray-700",
  draft: "bg-purple-100 text-purple-700",
  roster: "bg-amber-100 text-amber-700",
  season: "bg-green-100 text-green-700",
  trades: "bg-orange-100 text-orange-700",
  playoffs: "bg-pink-100 text-pink-700",
  offseason: "bg-gray-100 text-gray-600",
};

export type CalendarEvent = {
  id: number;
  leagueId: number;
  season: string;
  title: string;
  phase: CalendarPhase;
  description: string;
  startDate: string;
  endDate: string | null;
  isApproximate: boolean;
  displayLabel: string | null;
  time: string | null;
  isDefault: boolean;
};

export type LeagueCalendar = {
  season: string;
  currentSeason: string;
  seasons: string[];
  events: CalendarEvent[];
};

// "2026-27" -> "2027-28". Mirrors the server, so the button can say which
// season it is about to create.
export const nextSeason = (season: string) => {
  const start = Number(season.slice(0, 4)) + 1;
  if (!Number.isInteger(start)) return season;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
};

export type CalendarEventInput = {
  title: string;
  phase: CalendarPhase;
  description?: string;
  startDate: string;
  endDate?: string | null;
  isApproximate?: boolean;
  displayLabel?: string | null;
  time?: string | null;
  season?: string;
};

// A stored date is a UTC instant, so it is read back in UTC too. Reading it
// locally would show the previous day for anyone west of Greenwich.
export const formatEventDate = (event: CalendarEvent) => {
  if (event.displayLabel) return event.displayLabel;

  const start = new Date(event.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  if (!event.endDate) return start;

  const end = new Date(event.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${start} – ${end}`;
};

/** yyyy-mm-dd for a date input, in UTC for the same reason. */
export const toDateInput = (iso: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

export const calendarApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueCalendar: builder.query<
      LeagueCalendar,
      { leagueId: number; season?: string }
    >({
      query: ({ leagueId, season }) => ({
        url: `/leagues/${leagueId}/calendar`,
        params: season ? { season } : {},
      }),
      transformResponse: (r: ApiResponse<LeagueCalendar>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Calendar" as const, id: leagueId },
      ],
    }),

    createCalendarEvent: builder.mutation<
      CalendarEvent,
      { leagueId: number; event: CalendarEventInput }
    >({
      query: ({ leagueId, event }) => ({
        url: `/leagues/${leagueId}/calendar`,
        method: "POST",
        body: event,
      }),
      transformResponse: (r: ApiResponse<CalendarEvent>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Calendar" as const, id: leagueId },
      ],
    }),

    updateCalendarEvent: builder.mutation<
      CalendarEvent,
      {
        leagueId: number;
        eventId: number;
        patch: Partial<Omit<CalendarEventInput, "season">>;
      }
    >({
      query: ({ leagueId, eventId, patch }) => ({
        url: `/leagues/${leagueId}/calendar/${eventId}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (r: ApiResponse<CalendarEvent>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Calendar" as const, id: leagueId },
      ],
    }),

    deleteCalendarEvent: builder.mutation<
      unknown,
      { leagueId: number; eventId: number }
    >({
      query: ({ leagueId, eventId }) => ({
        url: `/leagues/${leagueId}/calendar/${eventId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Calendar" as const, id: leagueId },
      ],
    }),

    rollOverCalendar: builder.mutation<
      { season: string; created: number },
      { leagueId: number; season?: string }
    >({
      query: ({ leagueId, season }) => ({
        url: `/leagues/${leagueId}/calendar/roll-over`,
        method: "POST",
        params: season ? { season } : {},
      }),
      transformResponse: (r: ApiResponse<{ season: string; created: number }>) =>
        unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Calendar" as const, id: leagueId },
      ],
    }),
  }),
});

export const {
  useLeagueCalendarQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
  useRollOverCalendarMutation,
} = calendarApi;
