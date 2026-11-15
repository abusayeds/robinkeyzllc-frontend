"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiPlus,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { LuArrowLeftRight, LuFileText, LuUsers } from "react-icons/lu";
import { useDraftPicksQuery } from "@/lib/store/api/endpoints/draftApi";
import { useTeamRosterQuery } from "@/lib/store/api/endpoints/rosterApi";
import { useTradeExceptionsQuery } from "@/lib/store/api/endpoints/tradeApi";
import type { PickedAsset, TeamCard } from "./TeamPanel";
import { assetKey } from "./TeamPanel";

const money = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

const TABS = [
  { id: "players", label: "Players", icon: LuUsers },
  { id: "picks", label: "Draft Picks", icon: LuFileText },
  { id: "exceptions", label: "Trade Exceptions", icon: LuArrowLeftRight },
] as const;
type TabId = (typeof TABS)[number]["id"];

/**
 * One name for a pick everywhere: "2027 1st Round Pick". The app used to show
 * "2027 1st Round" here and "2027 1st" in a trade's detail, which read like
 * two different assets.
 */
const pickLabel = (pick: { year: string; roundLabel: string }) =>
  `${pick.year} ${pick.roundLabel} Pick`;

/** Which column the player list is ordered by, and which way. */
type SortKey = "name" | "salary";

const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/**
 * Everything one team can put into the deal, in the three kinds the trade
 * engine recognises. Which of them is legal is not asked here — that comes
 * back from the server once the asset is in the trade.
 */
export default function AddAssetModal({
  leagueId,
  team,
  destinations,
  picked,
  onToggle,
  onClose,
}: {
  leagueId: number;
  team: TeamCard;
  /** Where an asset from this team may go — every other team in the trade. */
  destinations: TeamCard[];
  picked: PickedAsset[];
  onToggle: (asset: PickedAsset) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabId>("players");
  const [search, setSearch] = useState("");

  // Players arrive in roster order, which is no order at all to someone
  // looking for a name. First name A–Z to start; the headers take over from
  // there.
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [descending, setDescending] = useState(false);

  const sortBy = (key: SortKey) => {
    if (key === sortKey) {
      setDescending((previous) => !previous);
      return;
    }
    setSortKey(key);
    // A name list reads A–Z; money reads highest first.
    setDescending(key === "salary");
  };

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    // Both <html> and <body>: on some browsers the scrolling element is the
    // root, so locking only body leaves the page moving behind the modal.
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  const { data: roster, isLoading: rosterLoading } = useTeamRosterQuery({
    leagueId,
    teamId: team.id,
  });

  const { data: inventory } = useDraftPicksQuery(leagueId);

  const { data: exceptions = [] } = useTradeExceptionsQuery({
    leagueId,
    teamId: team.id,
  });

  // With one partner there is only one place an asset can go, so it is routed
  // on the way in. Above that the owner chooses on the card.
  const defaultTo = destinations.length === 1 ? destinations[0].id : null;

  const allPicks = useMemo(
    () =>
      (inventory?.years ?? [])
        .flatMap((year) => year.picks)
        .filter(
          (pick) => pick.currentTeam.id === team.id && pick.usedAt === null,
        ),
    [inventory, team.id],
  );

  const needle = search.trim().toLowerCase();

  const players = useMemo(() => {
    const all = roster?.players ?? [];
    const matched = needle
      ? all.filter((player) => player.name.toLowerCase().includes(needle))
      : all;

    const direction = descending ? -1 : 1;
    return [...matched].sort((a, b) => {
      if (sortKey === "salary") {
        return ((a.capHit ?? 0) - (b.capHit ?? 0)) * direction;
      }
      // By first name, which is how the name is written, so a plain
      // comparison is already the right order.
      return a.name.localeCompare(b.name, "en-US") * direction;
    });
  }, [roster, needle, sortKey, descending]);

  const picks = useMemo(() => {
    if (!needle) return allPicks;
    return allPicks.filter((pick) =>
      pickLabel(pick).toLowerCase().includes(needle),
    );
  }, [allPicks, needle]);

  const tpes = useMemo(() => {
    if (!needle) return exceptions;
    return exceptions.filter((tpe) =>
      tpe.label.toLowerCase().includes(needle),
    );
  }, [exceptions, needle]);

  const isPicked = (asset: PickedAsset) =>
    picked.some((other) => assetKey(other) === assetKey(asset));

  const add = (asset: PickedAsset) => onToggle({ ...asset, toTeamId: defaultTo });

  const total =
    (roster?.players ?? []).length + allPicks.length + exceptions.length;

  const selectedCount = picked.filter(
    (asset) => asset.fromTeamId === team.id,
  ).length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-3 sm:p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Add asset from ${team.name}`}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-card supports-[height:100dvh]:max-h-[85dvh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-brand-border px-5 py-4">
          <h2 className="min-w-0 truncate text-sm font-bold text-brand-dark">
            Add Asset
            <span className="font-normal text-brand-muted"> | {team.name}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex shrink-0 overflow-x-auto border-b border-brand-border px-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm transition ${
                tab === id
                  ? "font-semibold text-brand-cta-dark"
                  : "font-medium text-brand-muted hover:text-brand-dark"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {tab === id ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-cta" />
              ) : null}
            </button>
          ))}
        </div>

        {total > 0 ? (
          <div className="shrink-0 border-b border-brand-border px-5 py-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players..."
                className="w-full rounded-lg border border-brand-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20"
              />
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto">
          {tab === "players" ? (
            rosterLoading ? (
              <p className="px-5 py-8 text-center text-sm text-brand-muted">
                Loading…
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-brand-border text-left text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                      <th
                        className="px-5 py-2"
                        aria-sort={
                          sortKey === "name"
                            ? descending
                              ? "descending"
                              : "ascending"
                            : "none"
                        }
                      >
                        <SortHeader
                          label="Player"
                          active={sortKey === "name"}
                          descending={descending}
                          onClick={() => sortBy("name")}
                        />
                      </th>
                      <th className="px-2 py-2">Pos</th>
                      <th className="px-2 py-2">Team</th>
                      <th
                        className="px-2 py-2 text-right"
                        aria-sort={
                          sortKey === "salary"
                            ? descending
                              ? "descending"
                              : "ascending"
                            : "none"
                        }
                      >
                        <SortHeader
                          label="Salary"
                          active={sortKey === "salary"}
                          descending={descending}
                          onClick={() => sortBy("salary")}
                          align="right"
                        />
                      </th>
                      <th className="px-5 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {players.map((player) => {
                      const asset: PickedAsset = {
                        kind: "player",
                        fromTeamId: team.id,
                        toTeamId: defaultTo,
                        leaguePlayerId: player.id,
                        label: player.name,
                        salary: player.capHit ?? 0,
                        sub: player.position ?? undefined,
                      };
                      return (
                        <tr key={player.id}>
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-muted">
                                {initials(player.name)}
                              </span>
                              <span className="truncate font-medium text-brand-dark">
                                {player.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-brand-muted">
                            {player.position ?? "—"}
                          </td>
                          <td className="px-2 py-2.5 text-brand-muted">
                            {player.nbaTeam ?? "—"}
                          </td>
                          <td className="px-2 py-2.5 text-right font-medium text-brand-dark">
                            {player.capHit === null
                              ? "—"
                              : money(player.capHit)}
                          </td>
                          <td className="px-5 py-2.5 text-right">
                            <AddButton
                              active={isPicked(asset)}
                              onClick={() => add(asset)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {players.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-brand-muted"
                        >
                          {needle
                            ? "No players match your search."
                            : "This roster is empty."}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )
          ) : null}

          {tab === "picks" ? (
            picks.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-brand-muted">
                No draft picks available.
              </p>
            ) : (
              <ul className="divide-y divide-brand-border">
                {picks.map((pick) => {
                  const asset: PickedAsset = {
                    kind: "draftPick",
                    fromTeamId: team.id,
                    toTeamId: defaultTo,
                    draftPickId: pick.id,
                    label: pickLabel(pick),
                    // A pick is an asset, not money owed, so it adds nothing
                    // to the salary-matching sum.
                    salary: 0,
                    sub: pick.isTraded
                      ? `via ${pick.originalTeam.abbr}`
                      : undefined,
                    // Rule 12.7 — the card offers rollover years after this
                    // draft, so it needs to know which draft the pick is in.
                    pickYear: pick.seasonStartYear,
                    // Whatever the pick already carries is the starting point;
                    // the two owners can change it on the card.
                    protectedTopN: pick.protectedTopN,
                  };
                  return (
                    <li
                      key={pick.id}
                      className="flex items-center justify-between gap-3 px-5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-brand-dark">
                          {pickLabel(pick)}
                        </p>
                        <p className="truncate text-xs text-brand-muted">
                          {pick.isTraded
                            ? `via ${pick.originalTeam.abbr} · `
                            : ""}
                          {pick.isTradeable
                            ? pick.status === "Protected"
                              ? `Top-${pick.protectedTopN} protected`
                              : "Unprotected"
                            : (pick.untradeableMessage ?? "Not tradeable")}
                        </p>
                      </div>
                      <AddButton
                        active={isPicked(asset)}
                        // Rule 12.11 — the engine has already worked out
                        // whether this one may move, and the server checks it
                        // again. Disabling it here means nobody has to read a
                        // refusal to find out.
                        disabled={!pick.isTradeable}
                        title={pick.untradeableMessage ?? undefined}
                        onClick={() => add(asset)}
                      />
                    </li>
                  );
                })}
              </ul>
            )
          ) : null}

          {tab === "exceptions" ? (
            tpes.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-brand-muted">
                No trade exceptions available.
              </p>
            ) : (
              <ul className="divide-y divide-brand-border">
                {tpes.map((exception) => {
                  const asset: PickedAsset = {
                    kind: "tradeException",
                    fromTeamId: team.id,
                    toTeamId: defaultTo,
                    tradeExceptionId: exception.id,
                    label: exception.label,
                    salary: 0,
                    sub: `${money(exception.remaining)} left`,
                  };
                  return (
                    <li
                      key={exception.id}
                      className="flex items-center justify-between gap-3 px-5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-brand-dark">
                          {exception.label}
                        </p>
                        <p className="truncate text-xs text-brand-muted">
                          {money(exception.remaining)} of{" "}
                          {money(exception.amount)} left · expires{" "}
                          {new Date(exception.expiresAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </p>
                      </div>
                      <AddButton
                        active={isPicked(asset)}
                        onClick={() => add(asset)}
                      />
                    </li>
                  );
                })}
              </ul>
            )
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-brand-border px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <span className="flex min-w-0 items-center gap-2 text-xs text-brand-muted">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-cta text-[11px] font-bold text-white">
              {selectedCount}
            </span>
            <span className="truncate">
              {selectedCount === 1 ? "asset selected" : "assets selected"}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg bg-brand-cta px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/** A column heading that orders the list, and shows which way it is ordered. */
function SortHeader({
  label,
  active,
  descending,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  descending: boolean;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-1 text-[10px] font-semibold uppercase tracking-wide transition hover:text-brand-dark ${
        align === "right" ? "justify-end" : ""
      } ${active ? "text-brand-cta-dark" : "text-brand-muted"}`}
    >
      {label}
      {active ? (
        descending ? (
          <FiChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <FiChevronUp className="h-3 w-3 shrink-0" />
        )
      ) : null}
    </button>
  );
}

function AddButton({
  active,
  disabled,
  title,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "bg-brand-cta/15 text-brand-cta-dark"
          : "border border-brand-border text-brand-dark hover:bg-brand-soft"
      }`}
    >
      {active ? (
        "Added"
      ) : (
        <>
          <FiPlus className="h-3.5 w-3.5" /> Add
        </>
      )}
    </button>
  );
}
