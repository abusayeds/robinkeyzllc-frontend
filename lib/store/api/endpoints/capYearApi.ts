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

export const capYearApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    capYears: builder.query<CapYear[], void>({
      query: () => `/cap/years`,
      transformResponse: (r: ApiResponse<CapYear[]>) => unwrap(r),
      providesTags: ["CapYears"],
    }),
  }),
});

export const { useCapYearsQuery } = capYearApi;
