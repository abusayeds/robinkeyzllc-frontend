"use client";

import { FiCheck, FiX } from "react-icons/fi";
import {
  TRADE_STATUS_LABEL,
  TRADE_STATUS_TONE,
  type Trade,
  type TradeAsset,
  type TradeEvaluation,
  type TradeTeamImpact,
} from "@/lib/store/api/endpoints/tradeApi";
import { useState } from "react";
import PlayerDetailModal from "@/components/my-team/PlayerDetailModal";
import TeamLogo from "@/components/ui/TeamLogo";
import TradeValidation from "./TradeValidation";
import { useModalShell } from "@/lib/useModalShell";
import { money } from "@/lib/money";

const signed = (value: number) =>
  `${value >= 0 ? "+" : "-"}${money(Math.abs(value))}`;

const dated = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const nameOf = (asset: TradeAsset) =>
  asset.player?.name ?? asset.pick?.label ?? asset.exception?.label ?? "Asset";

/** What goes under an asset's name: the position, the pick's terms, or the room. */
const detailOf = (asset: TradeAsset) => {
  if (asset.player) return asset.player.position ?? "";
  if (asset.pick) {
    const terms = asset.pick.protection?.label;
    const via =
      asset.pick.originalTeam && asset.pick.protectedTopN !== undefined
        ? `via ${asset.pick.originalTeam.abbr}`
        : "";
    return [terms, via].filter(Boolean).join(" · ");
  }
  if (asset.exception) return `${money(asset.exception.remaining)} left`;
  return "";
};

/** A threshold, read the way the cap summary reads it. */
const capLabel = (difference: number, isOver: boolean) =>
  isOver
    ? { text: `${money(difference)} Over`, tone: "text-red-500" }
    : { text: `${money(difference)} Under`, tone: "text-brand-cta-dark" };

function PieceList({
  pieces,
  onOpenPlayer,
}: {
  pieces: TradeAsset[];
  onOpenPlayer: (playerId: number) => void;
}) {
  return (
    <ul className="space-y-1">
      {pieces.map((piece) => (
        <li
          key={piece.id}
          className="flex items-start justify-between gap-2 text-[11px]"
        >
          <span className="min-w-0 text-brand-dark">
            {piece.player ? (
              <button
                type="button"
                onClick={() => onOpenPlayer(piece.player!.id)}
                title={`Open ${piece.player.name}'s card`}
                className="block max-w-full truncate text-left underline decoration-dotted"
              >
                {nameOf(piece)}
              </button>
            ) : (
              <span className="block truncate">{nameOf(piece)}</span>
            )}
            {detailOf(piece) ? (
              <span className="block truncate text-[10px] text-brand-muted">
                {detailOf(piece)}
              </span>
            ) : null}
          </span>
          <span className="shrink-0 text-[10px] font-medium text-brand-muted">
            {piece.salary ? money(piece.salary) : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function LegAssetsCard({
  side,
  assets,
  isYou,
  onOpenPlayer,
}: {
  side: TradeTeamImpact;
  assets: TradeAsset[];
  isYou: boolean;
  onOpenPlayer: (playerId: number) => void;
}) {
  const receives = assets.filter((asset) => asset.toTeamId === side.teamId);
  const sends = assets.filter((asset) => asset.fromTeamId === side.teamId);

  return (
    <div className="flex min-w-[190px] flex-col rounded-lg border border-brand-border p-3">
      <div className="mb-2 flex items-center gap-2">
        <TeamLogo
          name={side.team.name}
          src={side.team.logo}
          className="h-7 w-7 shrink-0"
        />
        <p className="min-w-0 truncate text-xs font-bold text-brand-dark">
          {side.team.name}
          {isYou ? (
            <span className="ml-1.5 rounded-full bg-brand-cta/15 px-1.5 py-0.5 text-[9px] font-bold text-brand-cta-dark">
              +YOU
            </span>
          ) : null}
        </p>
      </div>

      {receives.length > 0 ? (
        <div className="mb-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-brand-cta-dark">
            Receive
          </p>
          <div className="mt-1">
            <PieceList pieces={receives} onOpenPlayer={onOpenPlayer} />
          </div>
        </div>
      ) : null}

      {sends.length > 0 ? (
        <div className="mb-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-red-500">
            Send
          </p>
          <div className="mt-1">
            <PieceList pieces={sends} onOpenPlayer={onOpenPlayer} />
          </div>
        </div>
      ) : null}

      <div className="mt-auto space-y-0.5 border-t border-brand-border pt-1.5 text-[11px]">
        {receives.length > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-brand-muted">Total Incoming</span>
            <span className="font-bold text-brand-cta-dark">
              {money(side.incoming)}
            </span>
          </div>
        ) : null}
        {sends.length > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-brand-muted">Total Outgoing</span>
            <span className="font-bold text-red-500">
              {money(side.outgoing)}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-brand-muted">Reply</span>
          <span
            className={`font-semibold ${
              side.response === "accepted"
                ? "text-brand-cta-dark"
                : side.response === "declined"
                  ? "text-red-500"
                  : "text-brand-muted"
            }`}
          >
            {side.response === "pending" ? "Waiting" : side.response}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Frontend-phase Cap Impact card + live evaluation numbers.
 * Roster "counts" rows are left off (V2 / design) — validation covers roster rules.
 */
function CapImpactCard({
  team,
  logo,
}: {
  team: TradeEvaluation["teams"][number];
  logo: string | null;
}) {
  const netTone =
    team.capImpact > 0
      ? "text-red-500"
      : team.capImpact < 0
        ? "text-brand-cta-dark"
        : "text-brand-dark";

  return (
    <div className="min-w-[190px] rounded-lg border border-brand-border p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-brand-dark">
        <TeamLogo
          name={team.teamName}
          src={logo}
          className="h-5 w-5 shrink-0"
        />
        <span className="min-w-0 truncate">{team.teamName}</span>
        {team.tierChanged ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
            {team.tierBeforeLabel} → {team.tierLabel}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-brand-soft px-1.5 py-0.5 text-[9px] font-bold text-brand-muted">
            {team.tierLabel}
          </span>
        )}
      </p>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-[8px] uppercase text-brand-muted">
            <th className="text-left font-semibold" />
            <th className="text-right font-semibold">Current</th>
            <th className="text-right font-semibold">After</th>
            <th className="text-right font-semibold">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          <tr>
            <td className="py-1 text-brand-muted">Players In</td>
            <td className="py-1 text-right text-brand-muted">—</td>
            <td className="py-1 text-right text-brand-dark">
              {team.playersIn}
            </td>
            <td className="py-1 text-right font-semibold text-brand-dark">
              +{team.playersIn}
            </td>
          </tr>
          <tr>
            <td className="py-1 text-brand-muted">Players Out</td>
            <td className="py-1 text-right text-brand-muted">—</td>
            <td className="py-1 text-right text-brand-dark">
              {team.playersOut}
            </td>
            <td className="py-1 text-right font-semibold text-brand-dark">
              -{team.playersOut}
            </td>
          </tr>
          <tr>
            <td className="py-1 text-brand-muted">Net Salary</td>
            <td className="py-1 text-right text-brand-muted">—</td>
            <td className="py-1 text-right text-brand-muted">—</td>
            <td className={`py-1 text-right font-semibold ${netTone}`}>
              {signed(team.capImpact)}
            </td>
          </tr>
          <tr>
            <td className="py-1 text-brand-muted">Total Team Salary</td>
            <td className="py-1 text-right text-brand-dark">
              {money(team.salaryBefore)}
            </td>
            <td className="py-1 text-right text-brand-dark">
              {money(team.salaryAfter)}
            </td>
            <td className={`py-1 text-right font-semibold ${netTone}`}>
              {signed(team.capImpact)}
            </td>
          </tr>
          {team.lines.map((line) => {
            const after = capLabel(line.difference, line.isOver);
            const beforeOver = team.salaryBefore > line.threshold;
            const before = capLabel(
              Math.abs(team.salaryBefore - line.threshold),
              beforeOver,
            );
            return (
              <tr key={line.label}>
                <td className="py-1 text-brand-muted">{line.label}</td>
                <td className={`py-1 text-right font-semibold ${before.tone}`}>
                  {before.text}
                </td>
                <td className={`py-1 text-right font-semibold ${after.tone}`}>
                  {after.text}
                </td>
                <td className="py-1 text-right text-brand-muted">—</td>
              </tr>
            );
          })}
          {team.maxIncoming !== null ? (
            <tr>
              <td className="py-1 text-brand-muted">
                Max Incoming
                {team.maxIncomingRule ? (
                  <span className="block text-[8px] leading-tight text-brand-muted/80">
                    {team.maxIncomingRule}
                  </span>
                ) : null}
              </td>
              <td className="py-1 text-right text-brand-muted">—</td>
              <td
                className={`py-1 text-right font-semibold ${
                  team.incoming > team.maxIncoming
                    ? "text-red-500"
                    : "text-brand-dark"
                }`}
              >
                {money(team.maxIncoming)}
              </td>
              <td className="py-1 text-right text-brand-muted">—</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export default function TradeDetailsModal({
  trade,
  evaluation,
  leagueId,
  myTeamId,
  busy,
  canRespond,
  canWithdraw,
  onClose,
  onAccept,
  onDecline,
  onWithdraw,
}: {
  trade: Trade | null;
  /** Judged now, not at proposal time. Null once the trade has settled. */
  evaluation: TradeEvaluation | null;
  leagueId: number;
  myTeamId: number | null;
  busy: boolean;
  canRespond: boolean;
  canWithdraw: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onWithdraw: () => void;
}) {
  // The player whose card is open, read from a name in the deal.
  const [cardPlayerId, setCardPlayerId] = useState<number | null>(null);

  useModalShell(Boolean(trade), onClose);

  if (!trade) return null;

  const sides = trade.teams;
  const notes = trade.assets
    .map((asset) => asset.pick?.protectionNote)
    .filter((note): note is string => Boolean(note));

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-3 sm:p-4"
        onMouseDown={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Trade details"
      >
        <div
          className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-card supports-[height:100dvh]:max-h-[90dvh]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-border px-5 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-brand-dark">
                  Trade Details
                </h2>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-muted">
                  {sides.length}-Team Trade
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TRADE_STATUS_TONE[trade.status]}`}
                >
                  {TRADE_STATUS_LABEL[trade.status]}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-brand-muted">
                {sides.map((side) => side.team.name).join(" ↔ ")}
              </p>
              <p className="text-[11px] text-brand-muted">
                Submitted {dated(trade.createdAt)}
                {trade.proposedBy ? ` by ${trade.proposedBy.name}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
              {sides.map((side) => (
                <LegAssetsCard
                  key={side.teamId}
                  side={side}
                  assets={trade.assets}
                  isYou={side.teamId === myTeamId}
                  onOpenPlayer={setCardPlayerId}
                />
              ))}
            </div>

            {evaluation ? (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                  Post-Trade Cap Impact
                </p>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                  {evaluation.teams.map((team) => {
                    const side = sides.find((row) => row.teamId === team.teamId);
                    return (
                      <CapImpactCard
                        key={team.teamId}
                        team={team}
                        logo={side?.team.logo ?? null}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                Trade Validation
              </p>
              {evaluation ? (
                // V2: frontend-phase placement + the new live validation wording
                <TradeValidation
                  evaluation={evaluation}
                  busy={false}
                  error={null}
                  unrouted={0}
                />
              ) : (
                <p className="rounded-lg border border-brand-border px-4 py-3 text-sm text-brand-muted">
                  This trade has already been settled, so it is no longer
                  checked against the rules.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {trade.message ? (
                <div className="rounded-lg border border-brand-border p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                    Message
                    {trade.proposedBy?.name
                      ? ` from ${trade.proposedBy.name}`
                      : ""}
                  </p>
                  <div className="flex items-start gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-muted">
                      {(trade.proposedBy?.name ?? "?").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-brand-dark">
                        {trade.proposedBy?.name ?? "Unknown"}
                        <span className="ml-1.5 font-normal text-brand-muted">
                          {dated(trade.createdAt)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs italic text-brand-muted">
                        &ldquo;{trade.message}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rounded-lg border border-brand-border p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                  Trade History
                </p>
                <ul className="space-y-1.5">
                  <HistoryRow
                    label="Proposed"
                    done
                    when={dated(trade.createdAt)}
                  />
                  {sides.map((side) => (
                    <HistoryRow
                      key={side.teamId}
                      label={`${side.team.abbr} ${
                        side.response === "pending" ? "to reply" : side.response
                      }`}
                      done={side.response !== "pending"}
                      when={side.respondedAt ? dated(side.respondedAt) : "—"}
                    />
                  ))}
                  {trade.requiresApproval ? (
                    <HistoryRow
                      label={
                        trade.approvedBy
                          ? `Approved by ${trade.approvedBy.name}`
                          : "Commissioner approval"
                      }
                      done={Boolean(trade.approvedAt)}
                      when={trade.approvedAt ? dated(trade.approvedAt) : "—"}
                    />
                  ) : null}
                  {trade.processedAt ? (
                    <HistoryRow
                      label="Processed"
                      done
                      when={dated(trade.processedAt)}
                    />
                  ) : null}
                </ul>
              </div>
            </div>

            {notes.length > 0 ? (
              <div className="rounded-lg border border-brand-border p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                  Pick Protection Notes
                </p>
                <ul className="space-y-1">
                  {notes.map((note) => (
                    <li key={note} className="text-xs italic text-brand-muted">
                      &ldquo;{note}&rdquo;
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {trade.rejectedReason ? (
              <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {trade.rejectedReason}
              </div>
            ) : null}
          </div>

          {/* Always rendered. A settled trade offers no action, and leaving the
            footer out left the small x in the corner as the only way out. */}
          <div className="flex shrink-0 gap-2 border-t border-brand-border px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
            >
              Close
            </button>
            {canRespond || canWithdraw ? (
              <>
                {canWithdraw ? (
                  <button
                    type="button"
                    onClick={onWithdraw}
                    disabled={busy}
                    className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Cancel Trade
                  </button>
                ) : null}
                {canRespond ? (
                  <>
                    <button
                      type="button"
                      onClick={onDecline}
                      disabled={busy}
                      className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={onAccept}
                      disabled={busy}
                      className="flex-1 rounded-lg bg-brand-cta px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
                    >
                      Accept Trade
                    </button>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Outside the panel above, so a click on the card never reaches the
        backdrop that would close the trade behind it. */}
      <PlayerDetailModal
        playerId={cardPlayerId}
        leagueId={leagueId}
        onClose={() => setCardPlayerId(null)}
      />
    </>
  );
}

function HistoryRow({
  label,
  done,
  when,
}: {
  label: string;
  done: boolean;
  when: string;
}) {
  return (
    <li className="flex items-center justify-between gap-2 text-[11px] text-brand-muted">
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
            done
              ? "bg-brand-cta/20 text-brand-cta-dark"
              : "border border-brand-border"
          }`}
        >
          {done ? <FiCheck className="h-3 w-3" /> : null}
        </span>
        <span className="truncate capitalize">{label}</span>
      </span>
      <span className="shrink-0">{when}</span>
    </li>
  );
}
