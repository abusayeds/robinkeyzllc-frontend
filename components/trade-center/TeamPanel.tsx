"use client";

import { FiX } from "react-icons/fi";
import { useTeamRosterQuery } from "@/lib/store/api/endpoints/rosterApi";
import { useTradeExceptionsQuery } from "@/lib/store/api/endpoints/tradeApi";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const short = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
};

export type PickedAsset = {
  kind: "player" | "tradeException";
  fromTeamId: number;
  toTeamId: number;
  leaguePlayerId?: number;
  tradeExceptionId?: number;
  label: string;
  salary: number;
};

/**
 * One team in the builder: what it is sending, chosen from what it actually
 * holds.
 *
 * The roster is read from the API per team rather than from one league-wide
 * list, because the builder has to show cap room and roster count for each
 * side and those come with it.
 */
export default function TeamPanel({
  leagueId,
  teamId,
  teamName,
  teamColor,
  otherTeamIds,
  picked,
  onToggle,
  onRemove,
  canRemove,
}: {
  leagueId: number;
  teamId: number;
  teamName: string;
  teamColor: string;
  otherTeamIds: number[];
  picked: PickedAsset[];
  onToggle: (asset: PickedAsset) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { data, isLoading } = useTeamRosterQuery({ leagueId, teamId });
  const { data: exceptions = [] } = useTradeExceptionsQuery({
    leagueId,
    teamId,
  });

  const mine = picked.filter((asset) => asset.fromTeamId === teamId);
  const sending = mine.reduce((sum, asset) => sum + asset.salary, 0);
  const receiving = picked
    .filter((asset) => asset.toTeamId === teamId)
    .reduce((sum, asset) => sum + asset.salary, 0);

  // Where an asset goes when there is only one other team: the obvious
  // answer, so the user is not asked a question with one possible reply.
  const defaultTarget = otherTeamIds[0];

  const isPicked = (leaguePlayerId?: number, exceptionId?: number) =>
    mine.some(
      (asset) =>
        (leaguePlayerId !== undefined &&
          asset.leaguePlayerId === leaguePlayerId) ||
        (exceptionId !== undefined && asset.tradeExceptionId === exceptionId),
    );

  return (
    <div className="flex flex-col rounded-xl border border-brand-border bg-white shadow-card">
      <div className="flex items-start justify-between gap-2 border-b border-brand-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-8 w-1.5 rounded-full"
            style={{ backgroundColor: teamColor }}
          />
          <div>
            <p className="text-sm font-semibold text-brand-dark">{teamName}</p>
            <p className="text-[11px] text-brand-muted">
              Out {short(sending)} · In {short(receiving)}
              {data?.cap.capSpace !== null && data?.cap.capSpace !== undefined
                ? ` · ${short(data.cap.capSpace)} room`
                : ""}
            </p>
          </div>
        </div>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-brand-muted transition hover:bg-brand-soft hover:text-red-500"
            title="Remove this team from the trade"
          >
            <FiX className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="max-h-80 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="px-4 py-6 text-center text-sm text-brand-muted">
            Loading…
          </p>
        ) : (data?.players.length ?? 0) === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-brand-muted">
            No players on this roster.
          </p>
        ) : (
          <ul className="divide-y divide-brand-border">
            {data?.players
              .filter((player) => player.status === "rostered")
              .map((player) => {
                const chosen = isPicked(player.id);
                return (
                  <li key={player.id}>
                    <button
                      type="button"
                      disabled={!defaultTarget}
                      onClick={() =>
                        onToggle({
                          kind: "player",
                          fromTeamId: teamId,
                          toTeamId: defaultTarget,
                          leaguePlayerId: player.id,
                          label: player.name,
                          salary: player.capHit ?? 0,
                        })
                      }
                      className={`flex w-full items-center justify-between px-4 py-2 text-left transition ${
                        chosen
                          ? "bg-brand-cta/10"
                          : "hover:bg-brand-soft/60 disabled:cursor-not-allowed"
                      }`}
                    >
                      <span>
                        <span className="flex items-center gap-1.5 text-sm font-medium text-brand-dark">
                          {player.name}
                          {player.slotType === "twoWay" ? (
                            <span className="rounded bg-brand-dark/10 px-1 py-0.5 text-[10px] font-bold">
                              TW
                            </span>
                          ) : null}
                        </span>
                        <span className="block text-[11px] text-brand-muted">
                          {[
                            player.position,
                            player.contract
                              ? `${player.contract.years} yr`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="text-xs text-brand-muted">
                        {player.capHit === null ? "—" : money(player.capHit)}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        )}

        {exceptions.length > 0 ? (
          <div className="border-t border-brand-border">
            <p className="px-4 pt-2 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Trade exceptions
            </p>
            <ul className="divide-y divide-brand-border">
              {exceptions.map((exception) => {
                const chosen = isPicked(undefined, exception.id);
                return (
                  <li key={exception.id}>
                    <button
                      type="button"
                      disabled={!defaultTarget}
                      onClick={() =>
                        onToggle({
                          kind: "tradeException",
                          fromTeamId: teamId,
                          toTeamId: defaultTarget,
                          tradeExceptionId: exception.id,
                          label: exception.label,
                          // An exception is room, not money owed, so it adds
                          // nothing to the matching sum.
                          salary: 0,
                        })
                      }
                      className={`flex w-full items-center justify-between px-4 py-2 text-left transition ${
                        chosen ? "bg-brand-cta/10" : "hover:bg-brand-soft/60"
                      }`}
                    >
                      <span className="text-sm text-brand-dark">
                        {exception.label}
                      </span>
                      <span className="text-xs text-brand-muted">
                        {money(exception.remaining)} left
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
