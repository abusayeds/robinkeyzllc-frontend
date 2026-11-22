"use client";

import { useState } from "react";
import { LuInfo } from "react-icons/lu";
import { getApiErrorMessage } from "@/lib/store/api";
import { useLoadContractReferencesMutation } from "@/lib/store/api/endpoints/capYearApi";
import { useSavedFlash } from "@/lib/useSavedFlash";

type ContractRow = {
  bdlPlayerId: number;
  seasonStartYear: number;
  salary: number;
  optionType?: string | null;
  guaranteeType?: string;
  guaranteedAmount?: number | null;
  endSeasonStartYear?: number;
  source?: string;
};

/**
 * Super Admin loader for the global contract reference table.
 *
 * Startup Draft reads these when a player is picked. Paste a JSON array of
 * rows (or `{ "rows": [...] }`) matching PUT /cap/contracts.
 */
export default function PlatformContractsPage() {
  const [load, { isLoading }] = useLoadContractReferencesMutation();
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    written: number;
    skippedUnknownPlayers: number[];
  } | null>(null);
  const { saved, flash } = useSavedFlash();

  const parseRows = (): ContractRow[] => {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as ContractRow[];
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { rows?: unknown }).rows)
    ) {
      return (parsed as { rows: ContractRow[] }).rows;
    }
    throw new Error('JSON must be an array of rows, or { "rows": [...] }.');
  };

  const submit = async () => {
    setError(null);
    setResult(null);
    let rows: ContractRow[];
    try {
      rows = parseRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That JSON could not be read.");
      return;
    }
    if (rows.length === 0) {
      setError("Paste at least one contract row.");
      return;
    }
    if (rows.length > 2000) {
      setError("Send at most 2000 rows per request. Split the file into batches.");
      return;
    }

    try {
      const data = await load({ rows }).unwrap();
      setResult(data);
      flash();
    } catch (e) {
      setError(getApiErrorMessage(e, "Contracts could not be loaded."));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Player Contracts</h1>
        <p className="text-sm text-brand-muted">
          Load the global contract database Startup Draft uses. The NBA feed
          publishes no contracts — these figures keep every league in sync.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-brand-border bg-brand-soft/40 px-4 py-3 text-sm text-brand-muted">
        <LuInfo className="mt-0.5 h-4 w-4 shrink-0 text-brand-cta-dark" />
        <p>
          Each row needs <code className="text-xs">bdlPlayerId</code>,{" "}
          <code className="text-xs">seasonStartYear</code>, and{" "}
          <code className="text-xs">salary</code>. Unknown balldontlie ids are
          skipped (usually the player sync has not run yet).
        </p>
      </div>

      <section className="rounded-xl border border-brand-border bg-white p-5 shadow-card">
        <label className="block text-sm font-semibold text-brand-dark">
          Contract JSON
        </label>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={16}
          spellCheck={false}
          placeholder={`[\n  {\n    "bdlPlayerId": 237,\n    "seasonStartYear": 2026,\n    "salary": 45000000,\n    "optionType": null,\n    "guaranteeType": "full"\n  }\n]`}
          className="mt-2 w-full rounded-lg border border-brand-border bg-white px-3 py-2 font-mono text-xs text-brand-dark outline-none focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20"
        />

        {error ? (
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        ) : null}
        {saved ? (
          <p className="mt-3 text-sm font-medium text-brand-cta-dark">
            Contract database updated.
          </p>
        ) : null}
        {result ? (
          <p className="mt-2 text-sm text-brand-muted">
            Wrote {result.written.toLocaleString()} season
            {result.written === 1 ? "" : "s"}
            {result.skippedUnknownPlayers.length > 0
              ? ` · skipped ${result.skippedUnknownPlayers.length} unknown player id${result.skippedUnknownPlayers.length === 1 ? "" : "s"}`
              : ""}
            .
          </p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={isLoading || !raw.trim()}
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Loading…" : "Load contracts"}
          </button>
        </div>
      </section>
    </div>
  );
}
