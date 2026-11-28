"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCheckCircle, FiPlus, FiRefreshCw } from "react-icons/fi";
import { useTeamRosterQuery } from "@/lib/store/api/endpoints/rosterApi";
import { useLeagueStandingsQuery } from "@/lib/store/api/endpoints/standingsApi";
import type { Team } from "@/lib/store/api/endpoints/teamApi";
import {
  useEvaluateTradeMutation,
  useProposeTradeMutation,
  type EvaluateTradeInput,
  type ProposeTradeInput,
  type TradeEvaluation,
} from "@/lib/store/api/endpoints/tradeApi";
import AddAssetModal from "./AddAssetModal";
import AddTeamModal from "./AddTeamModal";
import PlayerDetailModal from "@/components/my-team/PlayerDetailModal";
import ConfirmTradeModal from "./ConfirmTradeModal";
import TeamPanel, {
  assetKey,
  type PickedAsset,
  type ProtectionTerms,
  type TeamCard,
} from "./TeamPanel";
import TradeValidation from "./TradeValidation";

const money = (value: number) =>
  `$${Math.round(value).toLocaleString("en-US")}`;

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

const ordinal = (place: number) => {
  const mod100 = place % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${place}th`;
  const suffix = ["th", "st", "nd", "rd"][place % 10] ?? "th";
  return `${place}${suffix}`;
};

/** How many teams one deal may involve, matching the evaluate endpoint's cap. */
const MAX_TEAMS = 4;

export default function TradeBuilder({
  leagueId,
  teams,
  myTeamId,
  opponentId,
  preloadLeaguePlayerId,
  onProposed,
}: {
  leagueId: number;
  teams: Team[];
  myTeamId: number | null;
  /** Set when the trade block sent the user here to deal with one team. */
  opponentId?: number | null;
  /**
   * A player the Trade Finder asked for, put in on the way to this team's
   * own card so the deal is already started.
   */
  preloadLeaguePlayerId?: number | null;
  onProposed: () => void;
}) {
  // On entry the builder holds the user's own team and nothing else: the
  // trade partner is a choice, and picking one for them meant every trade
  // started against whichever team happened to be first in the list. A team
  // arriving from the trade block is a choice already made, so that one is
  // loaded.
  const [teamIds, setTeamIds] = useState<number[]>(() => {
    const first = myTeamId ?? teams[0]?.id;
    const ids = [first, opponentId && opponentId !== first ? opponentId : null];
    return ids.filter((id): id is number => Boolean(id));
  });

  const [picked, setPicked] = useState<PickedAsset[]>([]);
  const [message, setMessage] = useState("");
  const [addAssetFor, setAddAssetFor] = useState<number | null>(null);
  const [addingTeam, setAddingTeam] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // The player whose card is open, read from a name in the deal.
  const [cardPlayerId, setCardPlayerId] = useState<number | null>(null);

  const [evaluation, setEvaluation] = useState<TradeEvaluation | null>(null);
  const [evaluateError, setEvaluateError] = useState<string | null>(null);

  const [evaluate, { isLoading: evaluating }] = useEvaluateTradeMutation();
  const [propose, { isLoading: proposing }] = useProposeTradeMutation();

  // Records come from the standings, which is also where the league's own
  // ordering lives — a card should not invent its own idea of who is first.
  const { data: standings } = useLeagueStandingsQuery({ leagueId });

  const placeOf = useMemo(() => {
    const rows = standings?.standings ?? [];
    const map = new Map<number, { record: string; place: string }>();
    rows.forEach((row, index) => {
      map.set(row.id, {
        record: `${row.w}-${row.l}${row.t > 0 ? `-${row.t}` : ""}`,
        place: ordinal(index + 1),
      });
    });
    return map;
  }, [standings]);

  const cardOf = useCallback(
    (teamId: number): TeamCard | null => {
      const team = teams.find((row) => row.id === teamId);
      if (!team) return null;
      return {
        id: team.id,
        name: team.name,
        abbr: team.abbr,
        logo: team.logo,
      };
    },
    [teams],
  );

  const inTrade = useMemo(
    () => teamIds.map(cardOf).filter((card): card is TeamCard => card !== null),
    [teamIds, cardOf],
  );

  const available = useMemo(
    () => teams.filter((team) => !teamIds.includes(team.id)),
    [teams, teamIds],
  );

  const toggle = (asset: PickedAsset) =>
    setPicked((prev) => {
      const exists = prev.some((other) => assetKey(other) === assetKey(asset));
      return exists
        ? prev.filter((other) => assetKey(other) !== assetKey(asset))
        : [...prev, asset];
    });

  const removeAsset = (asset: PickedAsset) =>
    setPicked((prev) =>
      prev.filter((other) => assetKey(other) !== assetKey(asset)),
    );

  const retarget = (asset: PickedAsset, toTeamId: number) =>
    setPicked((prev) =>
      prev.map((other) =>
        assetKey(other) === assetKey(asset) ? { ...other, toTeamId } : other,
      ),
    );

  // The Trade Finder's player, added once the opponent's roster is in. Done
  // here rather than in the URL handler because the salary and the position
  // come from the roster, and a card without them reads as an empty row.
  const { data: opponentRoster } = useTeamRosterQuery(
    { leagueId, teamId: (opponentId ?? 0) as number },
    { skip: !opponentId || !preloadLeaguePlayerId },
  );

  const preloaded = useRef(false);
  useEffect(() => {
    if (preloaded.current || !preloadLeaguePlayerId || !opponentId) return;
    const player = (opponentRoster?.players ?? []).find(
      (row) => row.id === preloadLeaguePlayerId,
    );
    if (!player) return;

    preloaded.current = true;
    setPicked((prev) =>
      prev.some((asset) => asset.leaguePlayerId === player.id)
        ? prev
        : [
            ...prev,
            {
              kind: "player",
              fromTeamId: opponentId,
              toTeamId: myTeamId ?? null,
              leaguePlayerId: player.id,
              label: player.name,
              salary: player.capHit ?? 0,
              sub: player.position ?? undefined,
            },
          ],
    );
  }, [opponentRoster, preloadLeaguePlayerId, opponentId, myTeamId]);

  const protect = (asset: PickedAsset, terms: ProtectionTerms) =>
    setPicked((prev) =>
      prev.map((other) =>
        assetKey(other) === assetKey(asset) ? { ...other, ...terms } : other,
      ),
    );

  const addTeam = (teamId: number) => {
    setTeamIds((prev) =>
      prev.includes(teamId) || prev.length >= MAX_TEAMS
        ? prev
        : [...prev, teamId],
    );
    setAddingTeam(false);
  };

  const removeTeam = (teamId: number) => {
    setTeamIds((prev) => prev.filter((id) => id !== teamId));
    // Anything going to or from that team no longer has two ends.
    setPicked((prev) =>
      prev.filter(
        (asset) => asset.fromTeamId !== teamId && asset.toTeamId !== teamId,
      ),
    );
  };

  const clearTrade = () => {
    setPicked([]);
    setMessage("");
    setSubmitError(null);
  };

  // Above two teams an asset starts with no destination, so the owner has to
  // say where it goes. Until then it cannot be judged or sent.
  const allRouted = picked.every((asset) => asset.toTeamId !== null);

  const request: EvaluateTradeInput = useMemo(
    () => ({
      teamIds,
      assets: picked
        .filter(
          (asset): asset is PickedAsset & { toTeamId: number } =>
            asset.toTeamId !== null,
        )
        .map((asset) => ({
          kind: asset.kind,
          fromTeamId: asset.fromTeamId,
          toTeamId: asset.toTeamId,
          leaguePlayerId: asset.leaguePlayerId,
          tradeExceptionId: asset.tradeExceptionId,
          draftPickId: asset.draftPickId,
          // Rules 12.5-12.7 — only ever set on a pick, and only once the
          // owner has chosen a cover.
          protectedTopN: asset.protectedTopN ?? undefined,
          protectionOutcome: asset.protectionOutcome ?? undefined,
          protectionFinalYear: asset.protectionFinalYear ?? undefined,
          protectionNote: asset.protectionNote ?? undefined,
        })),
    }),
    [teamIds, picked],
  );

  const runEvaluate = useCallback(
    async (input: EvaluateTradeInput) => {
      if (input.teamIds.length < 2) {
        setEvaluation(null);
        return;
      }
      try {
        setEvaluateError(null);
        setEvaluation(await evaluate({ leagueId, trade: input }).unwrap());
      } catch (e) {
        setEvaluation(null);
        setEvaluateError(errorText(e, "That trade could not be checked."));
      }
    },
    [evaluate, leagueId],
  );

  // Asked again on every change, a short wait after the last one: dragging a
  // destination select through four teams should cost one request, not four.
  const fingerprint = JSON.stringify(request);
  useEffect(() => {
    const timer = setTimeout(() => {
      void runEvaluate(JSON.parse(fingerprint) as EvaluateTradeInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [fingerprint, runEvaluate]);

  const evaluationFor = (teamId: number) =>
    evaluation?.teams.find((row) => row.teamId === teamId) ?? null;

  const submit = async () => {
    setSubmitError(null);
    const trade: ProposeTradeInput = {
      assets: request.assets,
      message: message.trim() || undefined,
    };

    try {
      await propose({ leagueId, trade }).unwrap();
      setPicked([]);
      setMessage("");
      setConfirming(false);
      onProposed();
    } catch (e) {
      setSubmitError(errorText(e, "That trade could not be proposed."));
    }
  };

  const addAssetTeam = addAssetFor === null ? null : cardOf(addAssetFor);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setAddingTeam(true)}
          disabled={available.length === 0 || teamIds.length >= MAX_TEAMS}
          className="flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Add Team
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearTrade}
            disabled={picked.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw className="h-3.5 w-3.5" />
            Clear Trade
          </button>
          <button
            type="button"
            onClick={() => void runEvaluate(request)}
            disabled={evaluating}
            className="flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft disabled:opacity-50"
          >
            <FiCheckCircle
              className={`h-3.5 w-3.5 ${evaluating ? "animate-pulse" : ""}`}
            />
            Evaluate Trade
          </button>
          <button
            type="button"
            onClick={() => {
              setSubmitError(null);
              setConfirming(true);
            }}
            // An illegal trade cannot be submitted at all: it used to be
            // recorded anyway for the commissioner to read, which left owners
            // waiting on an answer the rules had already given.
            disabled={
              picked.length === 0 ||
              !allRouted ||
              proposing ||
              evaluation === null ||
              !evaluation.isLegal
            }
            title={
              evaluation && !evaluation.isLegal
                ? "This trade breaks a rule. Fix the issues above first."
                : undefined
            }
            className="rounded-lg bg-brand-cta px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Offer
          </button>
        </div>
      </div>

      {inTrade.length < 2 ? (
        <div className="rounded-lg bg-brand-cta/10 px-4 py-2 text-sm font-medium text-brand-cta-dark">
          Pick a trade partner to start. Use Add Team above.
        </div>
      ) : null}

      {picked.length > 0 && !allRouted ? (
        <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
          Choose a destination team for every asset before posting the trade.
        </div>
      ) : null}

      <div
        className={`grid gap-4 sm:grid-cols-2 ${
          inTrade.length >= 4
            ? "xl:grid-cols-4"
            : inTrade.length === 3
              ? "xl:grid-cols-3"
              : ""
        }`}
      >
        {inTrade.map((team) => (
          <TeamPanel
            key={team.id}
            team={team}
            isMine={team.id === myTeamId}
            record={placeOf.get(team.id)?.record ?? null}
            place={placeOf.get(team.id)?.place ?? null}
            evaluation={evaluationFor(team.id)}
            sending={picked.filter(
              (asset) =>
                asset.fromTeamId === team.id && asset.toTeamId !== team.id,
            )}
            receiving={picked.filter(
              (asset) =>
                asset.toTeamId === team.id && asset.fromTeamId !== team.id,
            )}
            // An asset that starts and ends on the same team is a trade
            // exception being spent rather than moved (Rule 7.4).
            using={picked.filter(
              (asset) =>
                asset.fromTeamId === team.id && asset.toTeamId === team.id,
            )}
            otherTeams={inTrade.filter((other) => other.id !== team.id)}
            onAddAsset={() => setAddAssetFor(team.id)}
            onRemoveAsset={removeAsset}
            onRetarget={retarget}
            onProtect={protect}
            onOpenPlayer={setCardPlayerId}
            onRemoveTeam={() => removeTeam(team.id)}
            // Any partner can be swapped out, two-team deals included. Only
            // your own team is fixed: a trade without it is not yours to make.
            canRemoveTeam={team.id !== myTeamId}
          />
        ))}
      </div>

      <TradeValidation
        evaluation={evaluation}
        busy={evaluating}
        error={evaluateError}
        unrouted={picked.filter((asset) => asset.toTeamId === null).length}
      />

      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
          Trade Summary
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {inTrade.map((team) => {
            const row = evaluationFor(team.id);
            const outgoing = row?.outgoing ?? 0;
            const incoming = row?.incoming ?? 0;
            const net = incoming - outgoing;
            return (
              <div
                key={team.id}
                className="rounded-lg border border-brand-border p-3"
              >
                <p className="truncate text-xs font-bold text-brand-dark">
                  {team.name}
                </p>
                <dl className="mt-1.5 space-y-1 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-brand-muted">Outgoing</dt>
                    <dd className="font-semibold text-red-500">
                      -{money(outgoing)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-brand-muted">Incoming</dt>
                    <dd className="font-semibold text-brand-cta-dark">
                      +{money(incoming)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-brand-border pt-1">
                    <dt className="font-semibold text-brand-dark">Net</dt>
                    <dd
                      className={`font-bold ${
                        net > 0 ? "text-red-500" : "text-brand-cta-dark"
                      }`}
                    >
                      {net >= 0 ? "+" : "-"}
                      {money(Math.abs(net))}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </div>

      {addAssetTeam ? (
        <AddAssetModal
          leagueId={leagueId}
          team={addAssetTeam}
          destinations={inTrade.filter((other) => other.id !== addAssetTeam.id)}
          picked={picked}
          onToggle={toggle}
          onClose={() => setAddAssetFor(null)}
        />
      ) : null}

      <AddTeamModal
        open={addingTeam}
        teams={available}
        recordOf={(teamId) => placeOf.get(teamId)?.record ?? null}
        onPick={addTeam}
        onClose={() => setAddingTeam(false)}
      />

      {/* Reading a player's stats and contract without leaving the builder,
          which is how the deal was priced in the frontend phase. */}
      <PlayerDetailModal
        playerId={cardPlayerId}
        leagueId={leagueId}
        onClose={() => setCardPlayerId(null)}
      />

      <ConfirmTradeModal
        open={confirming}
        evaluation={evaluation}
        recipients={inTrade
          .filter((team) => team.id !== myTeamId)
          .map((team) => team.name)}
        message={message}
        busy={proposing}
        error={submitError}
        onMessage={setMessage}
        onClose={() => setConfirming(false)}
        onConfirm={() => void submit()}
      />
    </div>
  );
}
