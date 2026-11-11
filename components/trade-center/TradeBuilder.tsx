"use client";

import { useMemo, useState } from "react";
import { FiAlertTriangle, FiArrowRight, FiPlus } from "react-icons/fi";
import {
  useProposeTradeMutation,
  type ProposeTradeInput,
} from "@/lib/store/api/endpoints/tradeApi";
import type { Team } from "@/lib/store/api/endpoints/teamApi";
import TeamPanel, { type PickedAsset } from "./TeamPanel";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

export default function TradeBuilder({
  leagueId,
  teams,
  myTeamId,
  onProposed,
}: {
  leagueId: number;
  teams: Team[];
  myTeamId: number | null;
  onProposed: () => void;
}) {
  const [teamIds, setTeamIds] = useState<number[]>(() => {
    const first = myTeamId ?? teams[0]?.id;
    const second = teams.find((team) => team.id !== first)?.id;
    return [first, second].filter((id): id is number => Boolean(id));
  });

  const [picked, setPicked] = useState<PickedAsset[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [propose, { isLoading }] = useProposeTradeMutation();

  const available = useMemo(
    () => teams.filter((team) => !teamIds.includes(team.id)),
    [teams, teamIds],
  );

  const toggle = (asset: PickedAsset) => {
    setPicked((prev) => {
      const key = (a: PickedAsset) =>
        a.kind === "player"
          ? `p${a.leaguePlayerId}`
          : a.kind === "draftPick"
            ? `d${a.draftPickId}`
            : `e${a.tradeExceptionId}`;
      const exists = prev.some((a) => key(a) === key(asset));
      return exists
        ? prev.filter((a) => key(a) !== key(asset))
        : [...prev, asset];
    });
  };

  const addTeam = (teamId: number) => setTeamIds((prev) => [...prev, teamId]);

  const removeTeam = (teamId: number) => {
    setTeamIds((prev) => prev.filter((id) => id !== teamId));
    // Anything that was going to or from that team no longer has two ends.
    setPicked((prev) =>
      prev.filter(
        (asset) => asset.fromTeamId !== teamId && asset.toTeamId !== teamId,
      ),
    );
  };

  /** Where an asset is headed, changeable once a third team is involved. */
  const retarget = (asset: PickedAsset, toTeamId: number) =>
    setPicked((prev) =>
      prev.map((a) =>
        a.leaguePlayerId === asset.leaguePlayerId &&
        a.tradeExceptionId === asset.tradeExceptionId
          ? { ...a, toTeamId }
          : a,
      ),
    );

  const everyTeamSends = teamIds.every((id) =>
    picked.some((asset) => asset.fromTeamId === id),
  );

  const submit = async () => {
    setError(null);
    const trade: ProposeTradeInput = {
      assets: picked.map((asset) => ({
        kind: asset.kind,
        fromTeamId: asset.fromTeamId,
        toTeamId: asset.toTeamId,
        leaguePlayerId: asset.leaguePlayerId,
        tradeExceptionId: asset.tradeExceptionId,
        draftPickId: asset.draftPickId,
      })),
      message: message.trim() || undefined,
    };

    try {
      await propose({ leagueId, trade }).unwrap();
      setPicked([]);
      setMessage("");
      onProposed();
    } catch (e) {
      setError(errorText(e, "That trade could not be proposed."));
    }
  };

  const teamName = (id: number) =>
    teams.find((team) => team.id === id)?.abbr ?? "—";

  return (
    <div className="space-y-4">
      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {teamIds.map((id) => {
          const team = teams.find((t) => t.id === id);
          if (!team) return null;
          return (
            <TeamPanel
              key={id}
              leagueId={leagueId}
              teamId={id}
              teamName={team.name}
              teamColor={team.color}
              otherTeamIds={teamIds.filter((other) => other !== id)}
              picked={picked}
              onToggle={toggle}
              onRemove={() => removeTeam(id)}
              canRemove={teamIds.length > 2}
            />
          );
        })}

        {available.length > 0 && teamIds.length < 4 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-brand-border bg-white p-6">
            <label className="w-full text-center">
              <span className="mb-2 flex items-center justify-center gap-1.5 text-sm font-medium text-brand-muted">
                <FiPlus className="h-4 w-4" />
                Add a third team
              </span>
              <select
                value=""
                onChange={(e) => addTeam(Number(e.target.value))}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
              >
                <option value="" disabled>
                  Choose a team
                </option>
                {available.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-brand-border bg-white shadow-card">
        <div className="border-b border-brand-border px-4 py-3">
          <p className="text-sm font-semibold text-brand-dark">
            What this trade moves
          </p>
          <p className="text-[11px] text-brand-muted">
            The league checks the rules when you send it, and records the result
            either way.
          </p>
        </div>

        {picked.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-brand-muted">
            Pick a player or an exception from a team above.
          </p>
        ) : (
          <ul className="divide-y divide-brand-border">
            {picked.map((asset) => (
              <li
                key={`${asset.kind}-${asset.leaguePlayerId ?? asset.tradeExceptionId}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-semibold text-brand-muted">
                    {teamName(asset.fromTeamId)}
                  </span>
                  <FiArrowRight className="h-3 w-3 text-brand-muted" />
                  {teamIds.length > 2 ? (
                    <select
                      value={asset.toTeamId}
                      onChange={(e) => retarget(asset, Number(e.target.value))}
                      className="rounded border border-brand-border px-1.5 py-0.5 text-xs text-brand-dark outline-none focus:border-brand-cta"
                    >
                      {teamIds
                        .filter((id) => id !== asset.fromTeamId)
                        .map((id) => (
                          <option key={id} value={id}>
                            {teamName(id)}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <span className="text-xs font-semibold text-brand-muted">
                      {teamName(asset.toTeamId)}
                    </span>
                  )}
                  <span className="font-medium text-brand-dark">
                    {asset.label}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-brand-muted">
                    {asset.kind === "tradeException"
                      ? "exception"
                      : asset.kind === "draftPick"
                        ? "pick"
                        : money(asset.salary)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(asset)}
                    className="text-xs font-semibold text-brand-muted hover:text-red-500"
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2 border-t border-brand-border px-4 py-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="A note to the other team (optional)"
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-brand-muted">
              {!everyTeamSends && picked.length > 0
                ? "Every team in a trade has to send something."
                : "Your team accepts by proposing. The others have to reply."}
            </p>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={isLoading || picked.length === 0 || !everyTeamSends}
              className="rounded-lg bg-brand-cta px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Sending…" : "Propose trade"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
