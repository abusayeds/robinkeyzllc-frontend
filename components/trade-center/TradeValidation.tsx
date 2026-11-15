"use client";

import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import type {
  TradeCheck,
  TradeEvaluation,
} from "@/lib/store/api/endpoints/tradeApi";

/**
 * What a trade is allowed to do, in three groups.
 *
 * Every rule used to arrive as one flat list of ticks, so a four-team deal
 * showed fourteen lines and the one that mattered was somewhere in the middle.
 * Blocking issues come first with the arithmetic and a way out, consequences
 * worth knowing sit under them, and the rules that simply passed are folded
 * away.
 */
export default function TradeValidation({
  evaluation,
  busy,
  error,
  /** Assets the builder is holding that have nowhere to go yet. */
  unrouted,
}: {
  evaluation: TradeEvaluation | null;
  busy: boolean;
  error: string | null;
  unrouted: number;
}) {
  const [showPassed, setShowPassed] = useState(false);

  // The destination question is the builder's, not the engine's: an asset
  // with nowhere to go never reaches the server. It is shown as its own
  // blocking issue rather than folded into "every team sends something",
  // which used to answer two different questions in one sentence.
  const routing: TradeCheck | null = useMemo(
    () =>
      unrouted > 0
        ? {
            teamId: null,
            teamAbbr: null,
            code: "routing",
            label: `${unrouted} ${unrouted === 1 ? "asset has" : "assets have"} no destination team`,
            pass: false,
            severity: "blocking",
            toFix: [
              "Choose a destination team for every asset before posting the trade.",
            ],
          }
        : null,
    [unrouted],
  );

  const { blocking, headsUp, passed } = useMemo(() => {
    const checks = [...(routing ? [routing] : []), ...(evaluation?.checks ?? [])];
    return {
      blocking: checks.filter(
        (check) => !check.pass && check.severity === "blocking",
      ),
      headsUp: checks.filter(
        (check) => check.severity === "headsUp" || (!check.pass && check.severity !== "blocking"),
      ),
      passed: checks.filter(
        (check) => check.pass && check.severity === "passed",
      ),
    };
  }, [evaluation, routing]);

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!evaluation && !routing) {
    return (
      <div className="rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-muted shadow-card">
        {busy ? "Checking the trade…" : "Add an asset and the rules are checked as you go."}
      </div>
    );
  }

  const banner =
    blocking.length > 0
      ? {
          tone: "border-red-200 bg-red-50 text-red-700",
          icon: <FiX className="mt-0.5 h-4 w-4 shrink-0" />,
          text: `${blocking.length} ${blocking.length === 1 ? "issue stops" : "issues stop"} this trade`,
        }
      : headsUp.length > 0
        ? {
            tone: "border-brand-cta/30 bg-brand-cta/10 text-brand-cta-dark",
            icon: <FiCheck className="mt-0.5 h-4 w-4 shrink-0" />,
            text: `Ready to submit · ${headsUp.length} ${headsUp.length === 1 ? "heads-up" : "heads-ups"} to review`,
          }
        : {
            tone: "border-brand-cta/30 bg-brand-cta/10 text-brand-cta-dark",
            icon: <FiCheck className="mt-0.5 h-4 w-4 shrink-0" />,
            text: "Ready to submit",
          };

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
      <div
        className={`flex items-start gap-2 border-b px-4 py-3 text-sm font-semibold ${banner.tone}`}
      >
        {banner.icon}
        <span>{banner.text}</span>
        {busy ? (
          <span className="ml-auto shrink-0 text-xs font-medium opacity-70">
            rechecking…
          </span>
        ) : null}
      </div>

      {blocking.length > 0 ? (
        <ul className="divide-y divide-brand-border">
          {blocking.map((check) => (
            <Row key={check.code} check={check} kind="blocking" />
          ))}
        </ul>
      ) : null}

      {headsUp.length > 0 ? (
        <ul className="divide-y divide-brand-border border-t border-brand-border">
          {headsUp.map((check) => (
            <Row key={check.code} check={check} kind="headsUp" />
          ))}
        </ul>
      ) : null}

      {passed.length > 0 ? (
        <div className="border-t border-brand-border">
          <button
            type="button"
            onClick={() => setShowPassed((open) => !open)}
            className="flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-xs font-semibold text-brand-muted transition hover:bg-brand-soft/60 hover:text-brand-dark"
          >
            {showPassed ? (
              <FiChevronDown className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <FiChevronRight className="h-3.5 w-3.5 shrink-0" />
            )}
            Show {passed.length} passed {passed.length === 1 ? "check" : "checks"}
          </button>
          {showPassed ? (
            <ul className="divide-y divide-brand-border border-t border-brand-border">
              {passed.map((check) => (
                <Row key={check.code} check={check} kind="passed" />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const MARK = {
  blocking: {
    icon: <FiX className="h-3.5 w-3.5" />,
    tone: "bg-red-100 text-red-600",
    title: "text-sm font-semibold text-red-600",
  },
  headsUp: {
    icon: <FiAlertTriangle className="h-3.5 w-3.5" />,
    tone: "bg-amber-100 text-amber-700",
    title: "text-sm font-semibold text-amber-700",
  },
  passed: {
    icon: <FiCheck className="h-3.5 w-3.5" />,
    tone: "bg-brand-cta/15 text-brand-cta-dark",
    title: "text-sm font-medium text-brand-dark",
  },
} as const;

function Row({
  check,
  kind,
}: {
  check: TradeCheck;
  kind: keyof typeof MARK;
}) {
  const mark = MARK[kind];
  return (
    <li className="flex items-start gap-2.5 px-4 py-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${mark.tone}`}
      >
        {mark.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className={mark.title}>{check.label}</p>
          {check.teamAbbr ? (
            <span className="shrink-0 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-muted">
              {check.teamAbbr}
            </span>
          ) : null}
        </div>

        {check.math ? (
          <p className="mt-1 text-xs leading-relaxed text-brand-muted">
            {check.math}
          </p>
        ) : null}

        {check.detail ? (
          <p className="mt-0.5 text-xs leading-relaxed text-brand-muted">
            {check.detail}
          </p>
        ) : null}

        {check.toFix && check.toFix.length > 0 ? (
          <div className="mt-1.5 rounded-lg bg-brand-soft/60 px-2.5 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">
              To fix
            </p>
            <ul className="mt-0.5 space-y-0.5">
              {check.toFix.map((fix) => (
                <li key={fix} className="text-xs text-brand-dark">
                  {fix}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </li>
  );
}
