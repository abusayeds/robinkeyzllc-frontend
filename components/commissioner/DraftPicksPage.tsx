"use client";

import { useEffect, useState } from "react";
import {
  FiChevronDown,
  FiChevronRight,
  FiLock,
  FiX,
} from "react-icons/fi";
import TeamLogo from "@/components/ui/TeamLogo";
import {
  UNTRADEABLE_LABEL,
  useDraftPicksQuery,
  useGenerateDraftPicksMutation,
  useReassignDraftPickMutation,
  useUpdateDraftPickMutation,
  type DraftPick,
  type PickProtectionOutcome,
  type TeamRef,
} from "@/lib/store/api/endpoints/draftApi";
import { getApiErrorMessage } from "@/lib/store/api/baseApi";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useHydrated } from "@/lib/useHydrated";

const PROTECTION_OUTCOMES: { value: PickProtectionOutcome; label: string }[] = [
  { value: "rollover", label: "Rolls over to the next draft" },
  { value: "convert", label: "Converts to another pick" },
  { value: "end", label: "The obligation ends" },
];

function statusTone(status: DraftPick["status"]) {
  return status === "Unprotected"
    ? "border-brand-cta/40 bg-brand-cta/10 text-brand-cta-dark"
    : "border-purple-200 bg-purple-50 text-purple-700";
}

/** Rule 12.10 — the terms travel with the pick wherever it is shown. */
function protectionSummary(pick: DraftPick) {
  if (pick.protectedTopN === null) return pick.note || "—";

  const parts = [`Top ${pick.protectedTopN} protected`];
  if (pick.protectionOutcome === "rollover") {
    parts.push(
      pick.protectionFinalYear
        ? `rolls over through ${pick.protectionFinalYear}`
        : "rolls over",
    );
  }
  if (pick.protectionOutcome === "convert") parts.push("converts");
  if (pick.protectionOutcome === "end") parts.push("ends if it holds");
  if (pick.owedToTeam) parts.push(`owed to ${pick.owedToTeam.abbr}`);
  if (pick.note) parts.push(pick.note);

  return parts.join(" · ");
}

function useLockBody(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [onClose]);
}

function ReassignModal({
  pick,
  teams,
  busy,
  error,
  onClose,
  onSave,
}: {
  pick: DraftPick;
  teams: TeamRef[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (toTeamId: number, reason: string) => void;
}) {
  const [toTeamId, setToTeamId] = useState(
    teams.find((team) => team.id !== pick.currentTeam.id)?.id ?? 0,
  );
  const [reason, setReason] = useState("");

  useLockBody(onClose);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-brand-dark">
            Reassign: {pick.seasonStartYear} {pick.roundLabel} Pick
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted transition hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-xs text-brand-muted">
            Currently owned by{" "}
            <span className="font-semibold text-brand-dark">
              {pick.currentTeam.name}
            </span>
            .
          </p>

          {pick.untradeableMessage ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {pick.untradeableMessage}
            </p>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-medium text-brand-dark">
              Transfer to Team
            </label>
            <select
              value={toTeamId}
              onChange={(e) => setToTeamId(Number(e.target.value))}
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-dark">
              Reason / Trade Reference
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Trade ID or description"
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
            />
          </div>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-brand-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || toTeamId === pick.currentTeam.id || !toTeamId}
            onClick={() => onSave(toTeamId, reason.trim())}
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Reassigning…" : "Reassign Pick"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPickModal({
  pick,
  teams,
  allPicks,
  busy,
  error,
  onClose,
  onSave,
}: {
  pick: DraftPick;
  teams: TeamRef[];
  allPicks: DraftPick[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: {
    protectedTopN: number | null;
    protectionOutcome: PickProtectionOutcome | null;
    protectionFinalYear: number | null;
    convertsToPickId: number | null;
    owedToTeamId: number | null;
    movedToEndOfRound: boolean;
    note: string;
  }) => void;
}) {
  const [protectedTopN, setProtectedTopN] = useState(
    pick.protectedTopN === null ? "" : String(pick.protectedTopN),
  );
  const [outcome, setOutcome] = useState<PickProtectionOutcome | "">(
    pick.protectionOutcome ?? "",
  );
  const [finalYear, setFinalYear] = useState(
    pick.protectionFinalYear === null ? "" : String(pick.protectionFinalYear),
  );
  const [convertsToPickId, setConvertsToPickId] = useState(
    pick.convertsToPickId === null ? "" : String(pick.convertsToPickId),
  );
  const [owedToTeamId, setOwedToTeamId] = useState(
    pick.owedToTeam ? String(pick.owedToTeam.id) : "",
  );
  const [note, setNote] = useState(pick.note ?? "");
  const [movedToEndOfRound, setMovedToEndOfRound] = useState(
    pick.movedToEndOfRound,
  );

  useLockBody(onClose);

  const n = Number(protectedTopN);
  const isProtected = protectedTopN.trim() !== "" && n > 0;
  // Rule 12.6 — a protection has to say what happens next, and Rule 12.7 wants
  // a rollover's last year, so the button waits for both.
  const incomplete =
    isProtected &&
    (!outcome ||
      (outcome === "rollover" && !finalYear) ||
      (outcome === "convert" && !convertsToPickId));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-brand-dark">
            Edit: {pick.seasonStartYear} {pick.roundLabel} Pick
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted transition hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-dark">
              Protection
            </label>
            <p className="mb-2 text-[11px] text-brand-muted">
              Top-N protected: the pick changes hands only if it falls outside
              the top N. Leave empty for an unprotected pick.
            </p>
            <input
              type="number"
              min={1}
              max={60}
              value={protectedTopN}
              onChange={(e) => setProtectedTopN(e.target.value)}
              placeholder="e.g. 10"
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
            />
          </div>

          {isProtected ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-dark">
                  If the protection holds
                </label>
                <select
                  value={outcome}
                  onChange={(e) =>
                    setOutcome(e.target.value as PickProtectionOutcome | "")
                  }
                  className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                >
                  <option value="">Choose what happens…</option>
                  {PROTECTION_OUTCOMES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {outcome === "convert" ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-dark">
                    Converts to
                  </label>
                  <p className="mb-2 text-[11px] text-brand-muted">
                    The pick the obligation turns into when the protection
                    holds.
                  </p>
                  <select
                    value={convertsToPickId}
                    onChange={(e) => setConvertsToPickId(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                  >
                    <option value="">Choose a pick…</option>
                    {allPicks
                      .filter((other) => other.id !== pick.id && !other.usedAt)
                      .map((other) => (
                        <option key={other.id} value={other.id}>
                          {other.year} · {other.roundLabel} ·{" "}
                          {other.originalTeam.abbr}
                        </option>
                      ))}
                  </select>
                </div>
              ) : null}

              {outcome === "rollover" ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-dark">
                    Final year
                  </label>
                  <p className="mb-2 text-[11px] text-brand-muted">
                    In this draft the pick changes hands unprotected.
                  </p>
                  <input
                    type="number"
                    min={pick.seasonStartYear}
                    value={finalYear}
                    onChange={(e) => setFinalYear(e.target.value)}
                    placeholder={String(pick.seasonStartYear + 2)}
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                  />
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-xs font-medium text-brand-dark">
                  Owed to
                </label>
                <select
                  value={owedToTeamId}
                  onChange={(e) => setOwedToTeamId(e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                >
                  <option value="">Nobody yet</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          {pick.isFrozen && pick.round === 1 ? (
            <label className="flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2">
              <input
                type="checkbox"
                checked={movedToEndOfRound}
                onChange={(e) => setMovedToEndOfRound(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-[11px] text-sky-800">
                <span className="font-semibold">
                  Place at the end of the first round
                </span>
                <br />
                Rule 8.13 — for a frozen pick whose team finished above the
                Second Apron in 2 of the 4 seasons since it was frozen.
              </span>
            </label>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-medium text-brand-dark">
              Note
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Acquired from DAL"
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
            />
          </div>

          {pick.history.length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-medium text-brand-dark">
                History
              </p>
              <ul className="space-y-1">
                {pick.history.map((entry) => (
                  <li key={entry.id} className="text-[11px] text-brand-muted">
                    {entry.fromTeam ? `${entry.fromTeam.abbr} → ` : ""}
                    {entry.toTeam.abbr}
                    {entry.reason ? ` · ${entry.reason}` : ""}
                    {entry.tradeId ? ` · trade #${entry.tradeId}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-brand-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || incomplete}
            onClick={() =>
              onSave({
                protectedTopN: isProtected ? n : null,
                protectionOutcome: isProtected
                  ? (outcome as PickProtectionOutcome)
                  : null,
                protectionFinalYear:
                  isProtected && finalYear ? Number(finalYear) : null,
                convertsToPickId:
                  isProtected && outcome === "convert" && convertsToPickId
                    ? Number(convertsToPickId)
                    : null,
                owedToTeamId:
                  isProtected && owedToTeamId ? Number(owedToTeamId) : null,
                movedToEndOfRound,
                note: note.trim(),
              })
            }
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DraftPicksPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);
  const hydrated = useHydrated();

  const { data, isLoading, isError, error } = useDraftPicksQuery(
    leagueId as number,
    { skip: !leagueId },
  );

  const [generate, generateState] = useGenerateDraftPicksMutation();
  const [reassignPick, reassignState] = useReassignDraftPickMutation();
  const [updatePick, updateState] = useUpdateDraftPickMutation();

  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [reassign, setReassign] = useState<DraftPick | null>(null);
  const [edit, setEdit] = useState<DraftPick | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const years = data?.years ?? [];
  const totalPicks = years.reduce((sum, year) => sum + year.picks.length, 0);

  // The league's own year starts open, which is the one a commissioner is
  // almost always looking for.
  const current = data?.currentSeasonStartYear;
  const isOpen = (seasonStartYear: number) =>
    open[seasonStartYear] ?? seasonStartYear === current;

  const toggle = (seasonStartYear: number) =>
    setOpen((state) => ({
      ...state,
      [seasonStartYear]: !isOpen(seasonStartYear),
    }));

  // The league comes from localStorage, so the server render cannot know it.
  // This says so rather than rendering nothing: a blank page is indis-
  // tinguishable from a broken one.
  if (!hydrated) {
    return <p className="text-sm text-brand-muted">Loading draft picks…</p>;
  }

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Open a league to see its draft picks.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-brand-muted">Loading draft picks…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        {getApiErrorMessage(error, "Draft picks could not be loaded.")}
      </p>
    );
  }

  return (
    <div className="space-y-3 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">Draft Picks</h1>
          <p className="text-sm text-brand-muted">
            League-wide draft asset inventory. Reassign picks between teams.
          </p>
        </div>
        {data ? (
          <p className="text-xs text-brand-muted">
            Tradeable up to {data.windowDrafts} drafts ahead
            {data.allowDraftPickTrading
              ? ""
              : " · pick trading is off for this league"}
          </p>
        ) : null}
      </div>

      {totalPicks === 0 ? (
        <div className="rounded-xl border border-brand-border bg-white p-6 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-dark">
            No picks exist yet
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            One pick per team, per round, for this draft and every draft inside
            the trading window.
          </p>
          {canEdit ? (
            <button
              type="button"
              disabled={generateState.isLoading}
              onClick={() => void generate({ leagueId, rounds: 2 })}
              className="mt-4 rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
            >
              {generateState.isLoading ? "Creating…" : "Create the picks"}
            </button>
          ) : null}
          {generateState.isError ? (
            <p className="mt-2 text-xs text-red-600">
              {getApiErrorMessage(
                generateState.error,
                "The picks could not be created.",
              )}
            </p>
          ) : null}
        </div>
      ) : null}

      {totalPicks > 0 ? (
        <div className="hidden grid-cols-[1fr_1fr_1.4fr_1.4fr_1.2fr_auto] gap-4 px-5 text-[11px] font-semibold uppercase tracking-wide text-brand-muted md:grid">
          <span>Year</span>
          <span>Round</span>
          <span>
            Team
            <span className="ml-1 font-normal normal-case">
              (current owner)
            </span>
          </span>
          <span>Original Owner</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>
      ) : null}

      {years.map((year) => {
        const expanded = isOpen(year.seasonStartYear);
        return (
          <div
            key={year.seasonStartYear}
            className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card"
          >
            <button
              type="button"
              onClick={() => toggle(year.seasonStartYear)}
              className="flex w-full items-center gap-2 px-5 py-3.5 text-left transition hover:bg-brand-soft/40"
            >
              {expanded ? (
                <FiChevronDown className="h-4 w-4 text-brand-muted" />
              ) : (
                <FiChevronRight className="h-4 w-4 text-brand-muted" />
              )}
              <span className="text-sm font-bold text-brand-dark">
                {year.label}
              </span>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-muted">
                {year.picks.length} Picks
              </span>
              {year.inTradingWindow ? null : (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-muted">
                  Outside the trading window
                </span>
              )}
            </button>

            {expanded ? (
              <ul className="divide-y divide-brand-border border-t border-brand-border">
                {year.picks.map((pick) => (
                  <li
                    key={pick.id}
                    className="grid grid-cols-2 items-center gap-3 px-5 py-3 text-sm md:grid-cols-[1fr_1fr_1.4fr_1.4fr_1.2fr_auto] md:gap-4"
                  >
                    <span className="text-brand-muted">{pick.year}</span>
                    <span className="text-brand-dark">{pick.roundLabel}</span>
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        name={pick.currentTeam.name}
                        src={pick.currentTeam.logo ?? undefined}
                        className="h-6 w-6"
                      />
                      <div className="leading-tight">
                        <p className="font-semibold text-brand-dark">
                          {pick.currentTeam.abbr}
                        </p>
                        <p className="text-xs text-brand-muted">
                          {pick.currentTeam.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        name={pick.originalTeam.name}
                        src={pick.originalTeam.logo ?? undefined}
                        className="h-6 w-6"
                      />
                      <span className="text-brand-dark">
                        {pick.originalTeam.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusTone(
                          pick.status,
                        )}`}
                      >
                        {pick.status}
                      </span>
                      {pick.isFrozen ? (
                        <span
                          title={pick.untradeableMessage ?? "Frozen"}
                          className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700"
                        >
                          <FiLock className="h-3 w-3" />
                          {pick.frozenInSeason
                            ? `Frozen since ${pick.frozenInSeason}`
                            : "Frozen"}
                        </span>
                      ) : null}
                      {pick.movedToEndOfRound ? (
                        <span
                          title="Rule 8.13 — placed at the end of the first round."
                          className="inline-flex rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700"
                        >
                          End of round
                        </span>
                      ) : null}
                      {!pick.isTradeable && !pick.isFrozen ? (
                        <span
                          title={pick.untradeableMessage ?? undefined}
                          className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                        >
                          {pick.untradeableReason
                            ? UNTRADEABLE_LABEL[pick.untradeableReason]
                            : "Not tradeable"}
                        </span>
                      ) : null}
                      <span className="text-xs text-brand-muted">
                        {protectionSummary(pick)}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => {
                          setModalError(null);
                          setEdit(pick);
                        }}
                        className="rounded-md border border-brand-border px-3 py-1 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft disabled:opacity-40"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => {
                          setModalError(null);
                          setReassign(pick);
                        }}
                        className="rounded-md border border-brand-border px-3 py-1 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft disabled:opacity-40"
                      >
                        Reassign
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}

      {reassign ? (
        <ReassignModal
          pick={reassign}
          teams={data?.teams ?? []}
          busy={reassignState.isLoading}
          error={modalError}
          onClose={() => setReassign(null)}
          onSave={async (toTeamId, reason) => {
            try {
              await reassignPick({
                leagueId,
                pickId: reassign.id,
                toTeamId,
                reason: reason || undefined,
              }).unwrap();
              setReassign(null);
            } catch (e) {
              setModalError(
                getApiErrorMessage(e, "The pick could not be reassigned."),
              );
            }
          }}
        />
      ) : null}

      {edit ? (
        <EditPickModal
          pick={edit}
          teams={data?.teams ?? []}
          allPicks={years.flatMap((year) => year.picks)}
          busy={updateState.isLoading}
          error={modalError}
          onClose={() => setEdit(null)}
          onSave={async (input) => {
            try {
              await updatePick({
                leagueId,
                pickId: edit.id,
                ...input,
              }).unwrap();
              setEdit(null);
            } catch (e) {
              setModalError(
                getApiErrorMessage(e, "The pick could not be saved."),
              );
            }
          }}
        />
      ) : null}
    </div>
  );
}
