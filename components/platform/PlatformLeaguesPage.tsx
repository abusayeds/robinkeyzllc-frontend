"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiEye } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  enterLeagueView,
  type LeagueStatus,
  type PlatformLeague,
} from "@/lib/store/features/platformSlice";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function statusTone(s: LeagueStatus) {
  if (s === "Active") return "text-brand-cta-dark";
  if (s === "Draft") return "text-amber-600";
  return "text-brand-muted";
}

export default function PlatformLeaguesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const leagues = useAppSelector((s) => s.platform.leagues);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LeagueStatus>("All");
  const [sort, setSort] = useState<"Newest" | "Teams">("Newest");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = leagues.filter((l) => {
      if (statusFilter !== "All" && l.status !== statusFilter) return false;
      if (
        q &&
        !l.name.toLowerCase().includes(q) &&
        !l.commissioner.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    if (sort === "Teams")
      list = [...list].sort((a, b) => b.teams - a.teams);
    return list;
  }, [leagues, query, statusFilter, sort]);

  function openLeague(l: PlatformLeague) {
    dispatch(enterLeagueView({ id: l.id, name: l.name }));
    router.push("/league-office");
  }

  return (
    <div className="space-y-4 pb-12">
      <div>
        <h1 className="text-lg font-semibold text-brand-dark">Leagues</h1>
        <p className="text-sm text-brand-muted">
          {leagues.length} total leagues on the platform
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leagues or commissioners..."
            className="w-full rounded-lg border border-brand-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "All" | LeagueStatus)
          }
          className="rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "Newest" | "Teams")}
          className="rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
        >
          <option value="Newest">Newest</option>
          <option value="Teams">Most Teams</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                <th className="px-5 py-3">League</th>
                <th className="px-5 py-3">Commissioner</th>
                <th className="px-5 py-3">Teams</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {rows.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => openLeague(l)}
                  className="cursor-pointer transition hover:bg-brand-soft/60"
                >
                  <td className="px-5 py-3 font-semibold text-brand-dark">
                    {l.name}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700">
                        {initials(l.commissioner)}
                      </span>
                      <span className="text-brand-dark">{l.commissioner}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-brand-dark">{l.teams}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-semibold ${statusTone(l.status)}`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-brand-muted">{l.created}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        aria-label={`View ${l.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openLeague(l);
                        }}
                        className="rounded-md p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-brand-muted"
                  >
                    No leagues match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-brand-muted">
        Showing {rows.length} of {leagues.length} leagues
      </p>
    </div>
  );
}
