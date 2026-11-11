"use client";

import { useEffect, useState } from "react";
import { FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import {
  TRADE_STATUS_LABEL,
  TRADE_STATUS_TONE,
  type Trade,
} from "@/lib/store/api/endpoints/tradeApi";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

/**
 * The full trade, for a commissioner deciding on it.
 *
 * V5 asks this screen to show the **total financial impact and salary impact
 * for both teams' finances**, so every side's outgoing, incoming and net is
 * here rather than only what changes hands.
 */
export default function TradeDetail({
  trade,
  busy,
  onClose,
  onApprove,
  onReject,
}: {
  trade: Trade | null;
  busy: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason?: string) => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    setReason("");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [trade, onClose]);

  if (!trade) return null;

  const teamName = (id: number) =>
    trade.teams.find((side) => side.teamId === id)?.team.abbr ?? "—";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-brand-dark/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-brand-border px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-brand-dark">
              {trade.teams.map((side) => side.team.name).join(" · ")}
            </h2>
            <p className="text-xs text-brand-muted">
              {trade.proposedBy ? `Proposed by ${trade.proposedBy.name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${TRADE_STATUS_TONE[trade.status]}`}
            >
              {TRADE_STATUS_LABEL[trade.status]}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {trade.message ? (
          <p className="border-b border-brand-border px-5 py-3 text-sm text-brand-muted">
            {trade.message}
          </p>
        ) : null}

        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
            What moves
          </p>
          <ul className="mt-2 space-y-1.5">
            {trade.assets.map((asset) => (
              <li
                key={asset.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2 text-brand-dark">
                  <span className="text-xs font-semibold text-brand-muted">
                    {teamName(asset.fromTeamId)}
                  </span>
                  <FiArrowRight className="h-3 w-3 text-brand-muted" />
                  <span className="text-xs font-semibold text-brand-muted">
                    {teamName(asset.toTeamId)}
                  </span>
                  <span className="font-medium">
                    {asset.player
                      ? asset.player.name
                      : (asset.pick?.label ??
                        asset.exception?.label ??
                        "Exception")}
                  </span>
                  {asset.player?.position ? (
                    <span className="text-[11px] text-brand-muted">
                      {asset.player.position}
                    </span>
                  ) : null}
                  {/* Rule 12.10 — a pick's terms travel with it, so the team
                      it was born to and its protection are named here. */}
                  {asset.pick ? (
                    <span className="text-[11px] text-brand-muted">
                      via {asset.pick.originalTeam.abbr}
                      {asset.pick.protectedTopN !== null
                        ? ` · top-${asset.pick.protectedTopN} protected`
                        : ""}
                    </span>
                  ) : null}
                </span>
                <span className="text-brand-muted">
                  {asset.kind === "tradeException"
                    ? money(asset.exception?.remaining ?? 0)
                    : asset.kind === "draftPick"
                      ? "pick"
                      : money(asset.salary)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-brand-border px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
            Financial impact
          </p>
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="py-1">Team</th>
                <th className="py-1 text-right">Out</th>
                <th className="py-1 text-right">In</th>
                <th className="py-1 text-right">Net</th>
                <th className="py-1 text-right">Reply</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {trade.teams.map((side) => (
                <tr key={side.teamId}>
                  <td className="py-1.5 font-medium text-brand-dark">
                    {side.team.name}
                    <span className="block text-[11px] font-normal text-brand-muted">
                      {side.playersOut} out · {side.playersIn} in
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-brand-muted">
                    {money(side.outgoing)}
                  </td>
                  <td className="py-1.5 text-right text-brand-muted">
                    {money(side.incoming)}
                  </td>
                  <td
                    className={`py-1.5 text-right font-semibold ${
                      side.net > 0
                        ? "text-red-500"
                        : side.net < 0
                          ? "text-brand-cta-dark"
                          : "text-brand-muted"
                    }`}
                  >
                    {side.net > 0 ? "+" : ""}
                    {money(side.net)}
                  </td>
                  <td className="py-1.5 text-right text-[11px] text-brand-muted">
                    {side.response}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-brand-border px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
            Checks when this trade was proposed
          </p>
          <ul className="mt-2 space-y-1">
            {trade.checks.map((check) => (
              <li
                key={`${check.teamId ?? "all"}-${check.label}`}
                className="flex items-start gap-2 text-xs"
              >
                {check.pass ? (
                  <FiCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-cta-dark" />
                ) : (
                  <FiX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                )}
                <span>
                  <span className="text-brand-dark">{check.label}</span>
                  {check.detail ? (
                    <span className="block text-brand-muted">
                      {check.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {trade.status === "awaitingApproval" ? (
          <div className="space-y-2 border-t border-brand-border px-5 py-3">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason, if you reject it"
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onReject(reason.trim() || undefined)}
                disabled={busy}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={onApprove}
                disabled={busy}
                className="rounded-lg bg-brand-cta px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
              >
                {busy
                  ? "Working…"
                  : trade.isLegal
                    ? "Approve and process"
                    : "Approve anyway"}
              </button>
            </div>
          </div>
        ) : null}

        {trade.rejectedReason ? (
          <p className="border-t border-brand-border bg-red-50 px-5 py-3 text-xs text-red-600">
            Rejected: {trade.rejectedReason}
          </p>
        ) : null}
      </div>
    </div>
  );
}
