import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

export type ImportRowType = "contract" | "rights" | "deadCap" | "unknown";
export type NameMatchStatus = "matched" | "needsReview" | "notFound";
export type NameMatchMethod = "exact" | "alias" | "fuzzy";

export const ROW_TYPE_LABEL: Record<ImportRowType, string> = {
  contract: "Contract",
  rights: "Rights held",
  deadCap: "Dead cap",
  unknown: "—",
};

export const MATCH_STATUS_LABEL: Record<NameMatchStatus, string> = {
  matched: "Matched",
  needsReview: "Needs review",
  notFound: "Not found",
};

export type RowIssue = {
  field: string;
  message: string;
  fix?: string;
};

export type PlayerCandidate = {
  id: number;
  name: string;
  position: string | null;
  draftYear: number | null;
  nbaTeam: string | null;
  confidence: number;
};

export type ImportRow = {
  id: number;
  lineNumber: number;
  rawTeam: string;
  rawPlayer: string;
  rawBirdYears: string | null;
  rawContractType: string | null;
  rawSignedVia: string | null;
  rawSignedSeason: string | null;
  /** Season cells as typed, keyed by the season's starting year. */
  rawSeasons: Record<string, string>;
  rowType: ImportRowType;
  matchStatus: NameMatchStatus;
  matchMethod: NameMatchMethod | null;
  matchConfidence: number | null;
  playerId: number | null;
  teamId: number | null;
  issues: { list: RowIssue[]; candidates: PlayerCandidate[] };
};

export type ImportPreview = {
  id: number;
  leagueId: number;
  filename: string;
  seasonStartYear: number;
  status: "preview" | "confirmed" | "cancelled";
  rowCount: number;
  matchedCount: number;
  issueCount: number;
  confirmedAt: string | null;
  createdAt: string;
  uploadedBy: { id: number; name: string } | null;
  rows: ImportRow[];
  ignoredColumns: string[];
  readyToConfirm: boolean;
  blockingRowCount: number;
};

/** "2026-27" from 2026, the way the file and the screen both write it. */
export const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

/** The season columns of a preview, in order, read off the first row. */
export const seasonsOf = (preview: ImportPreview): number[] => {
  const first = preview.rows[0];
  if (!first) return [];
  return Object.keys(first.rawSeasons)
    .map(Number)
    .sort((a, b) => a - b);
};

export const issuesOf = (row: ImportRow): RowIssue[] => row.issues?.list ?? [];

export const candidatesOf = (row: ImportRow): PlayerCandidate[] =>
  row.issues?.candidates ?? [];

/** A row the commissioner still has to deal with before anything can be confirmed. */
export const rowIsBlocking = (row: ImportRow) =>
  row.matchStatus !== "matched" || issuesOf(row).length > 0;

export const playerImportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    currentImport: builder.query<ImportPreview | null, number>({
      query: (leagueId) => `/leagues/${leagueId}/import`,
      transformResponse: (r: ApiResponse<ImportPreview | null>) => unwrap(r),
      providesTags: (_result, _error, leagueId) => [
        { type: "PlayerImport" as const, id: leagueId },
      ],
    }),

    uploadImport: builder.mutation<
      ImportPreview,
      { leagueId: number; file: File }
    >({
      query: ({ leagueId, file }) => {
        const body = new FormData();
        body.append("file", file);
        return { url: `/leagues/${leagueId}/import/preview`, method: "POST", body };
      },
      transformResponse: (r: ApiResponse<ImportPreview>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "PlayerImport" as const, id: leagueId },
      ],
    }),

    resolveImportRow: builder.mutation<
      ImportPreview,
      { leagueId: number; batchId: number; rowId: number; playerId: number }
    >({
      query: ({ leagueId, batchId, rowId, playerId }) => ({
        url: `/leagues/${leagueId}/import/${batchId}/rows/${rowId}`,
        method: "PATCH",
        body: { playerId },
      }),
      transformResponse: (r: ApiResponse<ImportPreview>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "PlayerImport" as const, id: leagueId },
      ],
    }),

    confirmImport: builder.mutation<
      ImportPreview,
      { leagueId: number; batchId: number }
    >({
      query: ({ leagueId, batchId }) => ({
        url: `/leagues/${leagueId}/import/${batchId}/confirm`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<ImportPreview>) => unwrap(r),
      // Confirming writes rosters and contracts and locks the league's setup
      // mode, so the settings the league office shows are no longer current.
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "PlayerImport" as const, id: leagueId },
        { type: "LeagueSettings" as const, id: leagueId },
        { type: "Teams" as const, id: leagueId },
      ],
    }),

    discardImport: builder.mutation<
      null,
      { leagueId: number; batchId: number }
    >({
      query: ({ leagueId, batchId }) => ({
        url: `/leagues/${leagueId}/import/${batchId}`,
        method: "DELETE",
      }),
      transformResponse: (r: ApiResponse<null>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "PlayerImport" as const, id: leagueId },
      ],
    }),

    /** The preview's own search box, for a row the matcher could not place. */
    searchPlayers: builder.query<PlayerCandidate[], string>({
      query: (q) => `/players/search?q=${encodeURIComponent(q)}&limit=10`,
      transformResponse: (r: ApiResponse<PlayerCandidate[]>) => unwrap(r),
    }),
  }),
});

export const {
  useCurrentImportQuery,
  useUploadImportMutation,
  useResolveImportRowMutation,
  useConfirmImportMutation,
  useDiscardImportMutation,
  useLazySearchPlayersQuery,
} = playerImportApi;
