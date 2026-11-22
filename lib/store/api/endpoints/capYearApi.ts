import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

/**
 * A league year's figures as the Super Admin entered them.
 *
 * These are the platform's defaults: a league that has not set its own cap
 * runs on them, and a commissioner's Salary Cap Settings page starts from
 * them rather than from zero.
 */
export type CapYear = {
  id: number;
  seasonStartYear: number;
  salaryCap: number;
  luxuryTax: number;
  firstApron: number;
  secondApron: number;
  averagePlayerSalary: number;
};

/** Rule 2.3 — the five figures entered for one league year. */
export type CapYearInput = {
  salaryCap: number;
  luxuryTax: number;
  firstApron: number;
  secondApron: number;
  averagePlayerSalary: number;
};

export const capYearApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    capYears: builder.query<CapYear[], void>({
      query: () => `/cap/years`,
      transformResponse: (r: ApiResponse<CapYear[]>) => unwrap(r),
      providesTags: ["CapYears"],
    }),

    /**
     * Rule 2.3 — the Super Admin enters a league year's figures.
     *
     * An upsert, so saving the same year again corrects it. Rule 2.6 keeps
     * this away from a league that has entered its own numbers: those are
     * never overwritten from here.
     */
    saveCapYear: builder.mutation<
      CapYear,
      { seasonStartYear: number } & CapYearInput
    >({
      query: ({ seasonStartYear, ...body }) => ({
        url: `/cap/years/${seasonStartYear}`,
        method: "PUT",
        body,
      }),
      transformResponse: (r: ApiResponse<CapYear>) => unwrap(r),
      invalidatesTags: ["CapYears"],
    }),

    /**
     * Global NBA contract database for Startup Draft.
     * balldontlie has no contract endpoint — Super Admin loads rows here.
     */
    loadContractReferences: builder.mutation<
      { written: number; skippedUnknownPlayers: number[] },
      {
        rows: {
          bdlPlayerId: number;
          seasonStartYear: number;
          salary: number;
          optionType?: string | null;
          guaranteeType?: string;
          guaranteedAmount?: number | null;
          endSeasonStartYear?: number;
          source?: string;
        }[];
      }
    >({
      query: (body) => ({
        url: `/cap/contracts`,
        method: "PUT",
        body,
      }),
      transformResponse: (
        r: ApiResponse<{ written: number; skippedUnknownPlayers: number[] }>,
      ) => unwrap(r),
    }),
  }),
});

export const {
  useCapYearsQuery,
  useSaveCapYearMutation,
  useLoadContractReferencesMutation,
} = capYearApi;
