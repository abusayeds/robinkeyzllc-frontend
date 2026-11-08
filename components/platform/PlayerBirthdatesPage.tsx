"use client";

import { useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiDownload,
  FiUploadCloud,
} from "react-icons/fi";
import { API_URL, getApiErrorMessage } from "@/lib/store/api/baseApi";
import {
  BIRTHDATE_PROBLEM_LABEL,
  useImportBirthdatesMutation,
  type BirthdateImportResult,
  type BirthdateProblem,
} from "@/lib/store/api/endpoints/birthdateApi";
import { useAppSelector } from "@/lib/store/hooks";
import { useHydrated } from "@/lib/useHydrated";

const TONE: Record<BirthdateProblem["status"], string> = {
  needsReview: "bg-amber-100 text-amber-700",
  notFound: "bg-red-100 text-red-700",
  invalid: "bg-red-100 text-red-700",
  conflict: "bg-orange-100 text-orange-700",
};

function Stat({
  label,
  value,
  tone = "text-brand-dark",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-white px-4 py-3">
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-brand-muted">
        {label}
      </p>
    </div>
  );
}

function ProblemTable({ problems }: { problems: BirthdateProblem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border bg-white shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-border bg-brand-soft/60 text-left text-[11px] uppercase tracking-wide text-brand-muted">
            <th className="px-4 py-2.5 font-semibold">Line</th>
            <th className="px-4 py-2.5 font-semibold">Player</th>
            <th className="px-4 py-2.5 font-semibold">Birthdate</th>
            <th className="px-4 py-2.5 font-semibold">Problem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          {problems.map((problem) => (
            <tr key={`${problem.lineNumber}-${problem.player}`}>
              <td className="px-4 py-2.5 text-brand-muted">
                {problem.lineNumber}
              </td>
              <td className="px-4 py-2.5 font-medium text-brand-dark">
                {problem.player || <span className="text-brand-muted">—</span>}
              </td>
              <td className="px-4 py-2.5 text-brand-muted">
                {problem.birthdate || "—"}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[problem.status]}`}
                >
                  {BIRTHDATE_PROBLEM_LABEL[problem.status]}
                </span>
                <p className="mt-1 text-xs text-brand-muted">
                  {problem.message}
                </p>
                {problem.candidates.length > 0 ? (
                  <p className="mt-1 text-xs text-brand-muted">
                    Did you mean{" "}
                    {problem.candidates
                      .map((candidate) => candidate.name)
                      .join(", ")}
                    ?
                  </p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PlayerBirthdatesPage() {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);

  const [runImport, { isLoading }] = useImportBirthdatesMutation();
  const [result, setResult] = useState<BirthdateImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hydrated = useHydrated();

  /**
   * Fetched rather than linked: the route needs the bearer token, which a
   * plain anchor cannot carry.
   */
  const downloadTemplate = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/players/birthdates/template`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Template download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "player-birthdates.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("The template could not be downloaded. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  const run = async (chosen: File, dryRun: boolean) => {
    setError(null);
    try {
      setResult(await runImport({ file: chosen, dryRun }).unwrap());
      setFile(chosen);
    } catch (e) {
      setResult(null);
      setError(getApiErrorMessage(e, "That file could not be read."));
    }
  };

  const choose = (chosen: File | null | undefined) => {
    if (!chosen) return;
    // Checked first, always: a file is never written on the strength of its
    // name alone.
    void run(chosen, true);
  };

  // The user is restored from localStorage, so the server render and the
  // first client render do not know the role yet. Deciding before that
  // lands showed the refusal on every reload.
  if (!hydrated) return null;

  if (user?.role !== "superAdmin") {
    return (
      <p className="text-sm text-brand-muted">
        Only a Super Admin can import birthdates.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Player Birthdates</h1>
        <p className="text-sm text-brand-muted">
          The NBA data feed carries no birthdate, so it is loaded here. Two
          columns, every player in the platform, once — then again for each
          rookie class.
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-card">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            choose(e.dataTransfer.files?.[0]);
          }}
          className="flex flex-col items-center rounded-lg border-2 border-dashed border-brand-border px-6 py-8 text-center"
        >
          <FiUploadCloud className="h-8 w-8 text-brand-cta-dark" />
          <p className="mt-2 text-sm font-semibold text-brand-dark">
            Drop the birthdate CSV here
          </p>
          <p className="mt-0.5 text-xs text-brand-muted">
            Two columns: <code>player</code> and <code>birthdate</code>, written
            as 1998-07-12.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="mt-3 rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
          >
            {isLoading ? "Checking…" : "Choose a file"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => void downloadTemplate()}
          disabled={downloading}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cta-dark hover:underline disabled:opacity-50"
        >
          <FiDownload className="h-3.5 w-3.5" />
          {downloading ? "Preparing…" : "Download the template"}
        </button>
      </div>

      {result ? (
        <section className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Rows in file" value={result.rowCount} />
            <Stat
              label={result.dryRun ? "Would change" : "Written"}
              value={result.dryRun ? result.wouldChange : result.applied}
              tone="text-brand-cta-dark"
            />
            <Stat label="Already correct" value={result.unchanged} />
            <Stat
              label="Needs review"
              value={result.needsReview + result.conflicts}
              tone={
                result.needsReview + result.conflicts > 0
                  ? "text-amber-600"
                  : undefined
              }
            />
            <Stat
              label="Unusable"
              value={result.notFound + result.invalid}
              tone={
                result.notFound + result.invalid > 0
                  ? "text-red-500"
                  : undefined
              }
            />
          </div>

          {result.ignoredColumns.length > 0 ? (
            <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
              Ignored{" "}
              {result.ignoredColumns.length === 1 ? "column" : "columns"}:{" "}
              {result.ignoredColumns.join(", ")}. Nothing from them was
              imported.
            </p>
          ) : null}

          {result.dryRun ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-border bg-white px-4 py-3 shadow-card">
              <p className="text-sm text-brand-muted">
                {result.wouldChange === 0
                  ? "Nothing in this file would change. Every matched player already has this birthdate."
                  : `${result.wouldChange} birthdate${result.wouldChange === 1 ? "" : "s"} will be written. Rows listed below are skipped.`}
              </p>
              <button
                type="button"
                onClick={() => file && void run(file, false)}
                disabled={isLoading || result.wouldChange === 0}
                className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
              >
                {isLoading ? "Importing…" : "Import these birthdates"}
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl bg-brand-cta/10 px-4 py-3 text-sm text-brand-cta-dark">
              <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {result.applied} birthdate
                {result.applied === 1 ? "" : "s"} written. Fix anything below
                and upload the file again — re-running is safe.
              </span>
            </div>
          )}

          {result.problems.length > 0 ? (
            <>
              <h2 className="text-base font-semibold text-brand-dark">
                Rows that need you
                <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  {result.problems.length}
                </span>
              </h2>
              <ProblemTable problems={result.problems} />
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
