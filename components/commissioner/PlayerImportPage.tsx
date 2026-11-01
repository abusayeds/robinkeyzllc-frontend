"use client";

import { useMemo, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiDownload,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { API_URL } from "@/lib/store/api/baseApi";
import {
  candidatesOf,
  issuesOf,
  MATCH_STATUS_LABEL,
  ROW_TYPE_LABEL,
  rowIsBlocking,
  seasonLabel,
  seasonsOf,
  useConfirmImportMutation,
  useCurrentImportQuery,
  useDiscardImportMutation,
  useLazySearchPlayersQuery,
  useResolveImportRowMutation,
  useUploadImportMutation,
  type ImportRow,
  type PlayerCandidate,
} from "@/lib/store/api/endpoints/playerImportApi";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import { useAppSelector } from "@/lib/store/hooks";

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

/**
 * Shows a cell the way it was typed, not the way we read it.
 *
 * The commissioner is comparing this screen with their own spreadsheet, so a
 * tidied-up value would make a row they need to find look like one they do
 * not.
 */
function SeasonCell({ raw }: { raw: string }) {
  const value = raw.trim();
  if (!value) return <span className="text-brand-border">—</span>;
  return <span className="whitespace-nowrap">{value}</span>;
}

function MatchBadge({ row }: { row: ImportRow }) {
  const tone =
    row.matchStatus === "matched"
      ? "bg-brand-cta/15 text-brand-cta-dark"
      : row.matchStatus === "needsReview"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-600";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}
    >
      {MATCH_STATUS_LABEL[row.matchStatus]}
    </span>
  );
}

function CandidateButton({
  candidate,
  onPick,
  busy,
}: {
  candidate: PlayerCandidate;
  onPick: () => void;
  busy: boolean;
}) {
  const detail = [
    candidate.nbaTeam,
    candidate.position,
    candidate.draftYear ? `drafted ${candidate.draftYear}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={busy}
      className="rounded-lg border border-brand-border px-3 py-1.5 text-left transition hover:border-brand-cta hover:bg-brand-cta/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="block text-xs font-semibold text-brand-dark">
        {candidate.name}
      </span>
      {detail ? (
        <span className="block text-[11px] text-brand-muted">{detail}</span>
      ) : null}
    </button>
  );
}

/** Shown under a row the matcher could not place on its own. */
function RowResolver({
  row,
  onPick,
  busy,
}: {
  row: ImportRow;
  onPick: (playerId: number) => void;
  busy: boolean;
}) {
  const [term, setTerm] = useState("");
  const [search, { data: hits = [], isFetching }] = useLazySearchPlayersQuery();

  const candidates = candidatesOf(row);

  return (
    <div className="space-y-3 rounded-lg bg-brand-soft/50 px-4 py-3">
      {candidates.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
            Did you mean
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {candidates.map((candidate) => (
              <CandidateButton
                key={candidate.id}
                candidate={candidate}
                busy={busy}
                onPick={() => onPick(candidate.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
          Or search for the player
        </p>
        <form
          className="mt-1.5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (term.trim().length >= 2) void search(term.trim());
          }}
        >
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={row.rawPlayer}
            className="w-56 rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-dark outline-none focus:border-brand-cta"
          />
          <button
            type="submit"
            disabled={term.trim().length < 2 || isFetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSearch className="h-3.5 w-3.5" />
            {isFetching ? "Searching…" : "Search"}
          </button>
        </form>

        {hits.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {hits.map((hit) => (
              <CandidateButton
                key={hit.id}
                candidate={hit}
                busy={busy}
                onPick={() => onPick(hit.id)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PlayerImportPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);
  const token = useAppSelector((s) => s.auth.token);

  const {
    data: preview,
    isLoading,
    isFetching,
  } = useCurrentImportQuery(leagueId as number, { skip: !leagueId });

  const [upload, { isLoading: uploading }] = useUploadImportMutation();
  const [resolveRow, { isLoading: resolving }] = useResolveImportRowMutation();
  const [confirmImport, { isLoading: confirming }] = useConfirmImportMutation();
  const [discardImport, { isLoading: discarding }] = useDiscardImportMutation();

  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const seasons = useMemo(() => (preview ? seasonsOf(preview) : []), [preview]);
  const blockingRows = useMemo(
    () => (preview ? preview.rows.filter(rowIsBlocking) : []),
    [preview],
  );

  const busy = uploading || resolving || confirming || discarding;

  const ingest = async (file: File) => {
    if (!leagueId) return;
    setError(null);
    setDone(null);
    try {
      await upload({ leagueId, file }).unwrap();
    } catch (e) {
      setError(errorText(e, "That file could not be read."));
    }
  };

  /**
   * Fetched rather than linked: the route needs the bearer token, which a
   * plain anchor cannot carry.
   */
  const downloadTemplate = async () => {
    if (!leagueId) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/leagues/${leagueId}/import/template`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Template download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeLeague?.name ?? "league"}-player-import.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("The template could not be downloaded. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  const pick = async (rowId: number, playerId: number) => {
    if (!leagueId || !preview) return;
    setError(null);
    try {
      await resolveRow({ leagueId, batchId: preview.id, rowId, playerId }).unwrap();
    } catch (e) {
      setError(errorText(e, "That player could not be matched to the row."));
    }
  };

  const confirm = async () => {
    if (!leagueId || !preview) return;
    setError(null);
    try {
      const result = await confirmImport({
        leagueId,
        batchId: preview.id,
      }).unwrap();
      setDone(result.rowCount);
    } catch (e) {
      setError(errorText(e, "The import could not be confirmed."));
    }
  };

  const discard = async () => {
    if (!leagueId || !preview) return;
    setError(null);
    try {
      await discardImport({ leagueId, batchId: preview.id }).unwrap();
    } catch (e) {
      setError(errorText(e, "The import could not be discarded."));
    }
  };

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league before importing players.
      </p>
    );
  }

  if (!canEdit) {
    return (
      <p className="text-sm text-brand-muted">
        Only the commissioner and co-commissioners can import players.
      </p>
    );
  }

  const showUpload = !preview || preview.status !== "preview";

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Player Import</h1>
        <p className="text-sm text-brand-muted">
          Upload one row per player per team. Every row has to be matched to a
          real NBA player before the import can be confirmed.
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {done !== null ? (
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center shadow-card">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-cta/15 text-brand-cta-dark">
            <FiCheck className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-lg font-semibold text-brand-dark">
            {done} row{done === 1 ? "" : "s"} imported
          </h2>
          <p className="mt-1 text-sm text-brand-muted">
            Rosters, contracts and bird years are now set from this file.
          </p>
          <button
            type="button"
            onClick={() => setDone(null)}
            className="mt-5 rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-brand-soft"
          >
            Import another file
          </button>
        </div>
      ) : null}

      {done === null && showUpload ? (
        <div className="rounded-xl border border-brand-border bg-white p-5 shadow-card">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void ingest(file);
            }}
            onClick={() => fileRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition ${
              dragOver
                ? "border-brand-cta bg-brand-cta/5"
                : "border-brand-border hover:border-brand-cta/50 hover:bg-brand-soft/40"
            }`}
          >
            <FiUploadCloud className="h-8 w-8 text-brand-cta-dark" />
            <p className="mt-3 text-sm font-semibold text-brand-dark">
              {uploading ? "Reading the file…" : "Click or drag a CSV file here"}
            </p>
            <p className="mt-1 text-xs text-brand-muted">
              Saved as CSV (UTF-8), up to 2 MB
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void ingest(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => void downloadTemplate()}
            disabled={downloading}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cta-dark hover:underline disabled:opacity-50"
          >
            <FiDownload className="h-3.5 w-3.5" />
            {downloading ? "Preparing…" : "Download the template for this league"}
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-brand-muted">Loading…</p>
      ) : null}

      {done === null && preview && preview.status === "preview" ? (
        <>
          <div className="rounded-xl border border-brand-border bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-dark">
                  {preview.filename}
                </p>
                <p className="text-xs text-brand-muted">
                  {preview.rowCount} row{preview.rowCount === 1 ? "" : "s"} ·{" "}
                  {preview.matchedCount} matched · {blockingRows.length} to
                  resolve
                </p>
              </div>
              <button
                type="button"
                onClick={() => void discard()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted transition hover:bg-brand-soft disabled:opacity-50"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
                Discard
              </button>
            </div>

            {preview.ignoredColumns.length > 0 ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Ignored column{preview.ignoredColumns.length === 1 ? "" : "s"}:{" "}
                {preview.ignoredColumns.join(", ")}. Nothing in them was
                imported.
              </p>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Rows in file",
                  value: preview.rowCount,
                  tone: "text-brand-dark",
                },
                {
                  label: "Matched",
                  value: preview.matchedCount,
                  tone: "text-brand-cta-dark",
                },
                {
                  label: "Still to resolve",
                  value: blockingRows.length,
                  tone: blockingRows.length ? "text-red-500" : "text-brand-muted",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-brand-border p-4"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                    {stat.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${stat.tone}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-brand-border bg-white shadow-card">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-3 py-2.5">Line</th>
                  <th className="px-3 py-2.5">Team</th>
                  <th className="px-3 py-2.5">Player</th>
                  <th className="px-3 py-2.5">Row</th>
                  <th className="px-3 py-2.5 text-center">Bird</th>
                  {seasons.map((season) => (
                    <th key={season} className="px-3 py-2.5 text-right">
                      {seasonLabel(season)}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-center">Yrs</th>
                  <th className="px-3 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {preview.rows.map((row) => {
                  const issues = issuesOf(row);
                  const blocking = rowIsBlocking(row);
                  // Contract length is counted, never read from the file —
                  // the client made this column a calculation.
                  const contractYears = Object.values(row.rawSeasons).filter(
                    (cell) => /\d/.test(cell) && !/\b(DC|CH|QO)\b/i.test(cell),
                  ).length;

                  return (
                    <tr
                      key={row.id}
                      className={blocking ? "bg-red-50/40" : undefined}
                    >
                      <td className="px-3 py-2.5 text-brand-muted">
                        {row.lineNumber}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-brand-dark">
                        {row.rawTeam || "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-brand-dark">
                          {row.rawPlayer || "—"}
                        </span>
                        {row.rawContractType?.trim().toLowerCase() ===
                        "two-way" ? (
                          <span className="ml-1.5 inline-flex rounded bg-brand-dark/10 px-1 py-0.5 text-[10px] font-bold text-brand-dark">
                            TW
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-brand-muted">
                        {ROW_TYPE_LABEL[row.rowType]}
                      </td>
                      <td className="px-3 py-2.5 text-center text-brand-muted">
                        {row.rawBirdYears?.trim() || "—"}
                      </td>
                      {seasons.map((season) => (
                        <td
                          key={season}
                          className="px-3 py-2.5 text-right text-brand-dark"
                        >
                          <SeasonCell raw={row.rawSeasons[String(season)] ?? ""} />
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-center text-brand-muted">
                        {contractYears || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <MatchBadge row={row} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {blockingRows.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-brand-dark">
                {blockingRows.length} row
                {blockingRows.length === 1 ? "" : "s"} to resolve
              </h2>
              {blockingRows.map((row) => (
                <div
                  key={row.id}
                  className="space-y-3 rounded-xl border border-brand-border bg-white p-4 shadow-card"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-brand-muted">
                      Line {row.lineNumber}
                    </span>
                    <span className="text-sm font-semibold text-brand-dark">
                      {row.rawPlayer || "(no name)"}
                    </span>
                    <span className="text-xs text-brand-muted">
                      {row.rawTeam}
                    </span>
                    <MatchBadge row={row} />
                  </div>

                  {issuesOf(row).map((issue, index) => (
                    <div
                      key={`${issue.field}-${index}`}
                      className="flex items-start gap-2 text-xs"
                    >
                      <FiX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      <div>
                        <p className="font-medium text-brand-dark">
                          <span className="text-brand-muted">
                            {issue.field}
                          </span>{" "}
                          — {issue.message}
                        </p>
                        {issue.fix ? (
                          <p className="text-brand-muted">{issue.fix}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  {row.matchStatus !== "matched" ? (
                    <RowResolver
                      row={row}
                      busy={busy}
                      onPick={(playerId) => void pick(row.id, playerId)}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <div className="sticky bottom-20 z-30 -mx-4 -mb-4 border-t border-brand-border bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6 lg:bottom-0 lg:-mx-8 lg:-mb-8 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-brand-muted">
                {preview.readyToConfirm
                  ? "Every row is matched. Confirming replaces whatever this league held before."
                  : `${blockingRows.length} row${
                      blockingRows.length === 1 ? "" : "s"
                    } still need attention.`}
              </p>
              <button
                type="button"
                onClick={() => void confirm()}
                disabled={!preview.readyToConfirm || busy || isFetching}
                className="rounded-lg bg-brand-cta px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirming
                  ? "Importing…"
                  : `Import ${preview.rowCount} row${
                      preview.rowCount === 1 ? "" : "s"
                    }`}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
