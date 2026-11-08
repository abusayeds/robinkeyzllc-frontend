import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";
import type { PlayerCandidate } from "./playerImportApi";

export type BirthdateProblemStatus =
  | "needsReview"
  | "notFound"
  | "invalid"
  | "conflict";

export const BIRTHDATE_PROBLEM_LABEL: Record<BirthdateProblemStatus, string> = {
  needsReview: "Needs review",
  notFound: "Not found",
  invalid: "Unreadable",
  conflict: "Conflicting dates",
};

export type BirthdateProblem = {
  lineNumber: number;
  player: string;
  birthdate: string;
  status: BirthdateProblemStatus;
  message: string;
  candidates: PlayerCandidate[];
};

export type BirthdateImportResult = {
  dryRun: boolean;
  rowCount: number;
  /** Rows written. Always 0 on a dry run — read `wouldChange` instead. */
  applied: number;
  wouldChange: number;
  unchanged: number;
  needsReview: number;
  notFound: number;
  invalid: number;
  conflicts: number;
  ignoredColumns: string[];
  /** Only the rows that need a person. A matched row has nothing to say. */
  problems: BirthdateProblem[];
};

export const birthdateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    importBirthdates: builder.mutation<
      BirthdateImportResult,
      { file: File; dryRun?: boolean }
    >({
      query: ({ file, dryRun }) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: `/players/birthdates${dryRun ? "?dryRun=true" : ""}`,
          method: "POST",
          body,
        };
      },
      transformResponse: (r: ApiResponse<BirthdateImportResult>) => unwrap(r),
    }),
  }),
});

export const { useImportBirthdatesMutation } = birthdateApi;
