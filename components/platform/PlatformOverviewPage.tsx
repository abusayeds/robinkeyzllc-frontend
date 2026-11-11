"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { usePlatformOverviewQuery } from "@/lib/store/api/endpoints/platformApi";
import { initials } from "@/lib/avatar";
import { useAppSelector } from "@/lib/store/hooks";

/** "2h ago" — the recent lists are about recency, not dates. */
const timeAgo = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days >= 30) return `${Math.floor(days / 30)}mo ago`;
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(diff / 3_600_000);
  return hours >= 1 ? `${hours}h ago` : "just now";
};

function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  // Two points are the fewest a line can be drawn between, and an empty
  // series would make Math.max return -Infinity and every coordinate NaN.
  if (data.length < 2) {
    return (
      <p className="flex h-40 items-center justify-center text-xs text-brand-muted">
        Not enough history yet.
      </p>
    );
  }

  const max = Math.max(...data) || 1;
  const w = 100;
  const h = 40;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
      >
        <polyline
          points={`0,${h} ${pts} ${w},${h}`}
          fill="rgba(34,197,94,0.12)"
          stroke="none"
        />
        <polyline points={pts} fill="none" stroke="#22C55E" strokeWidth="1.4" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-brand-muted">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-40 items-center justify-center text-xs text-brand-muted">
        No signups yet.
      </p>
    );
  }

  // A run of months with no signups must not divide by zero.
  const max = Math.max(...data) || 1;

  return (
    <div>
      <div className="flex h-40 items-end gap-3">
        {data.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-brand-cta"
            style={{
              height: `${(v / max) * 100}%`,
              opacity: 0.45 + (i / data.length) * 0.55,
            }}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-3 text-[10px] text-brand-muted">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        status === "Active"
          ? "bg-brand-cta/15 text-brand-cta-dark"
          : status === "Draft"
            ? "bg-amber-100 text-amber-700"
            : "bg-red-100 text-red-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function PlatformOverviewPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading } = usePlatformOverviewQuery();

  const stats = data?.stats;

  const cards = [
    {
      label: "Total Leagues",
      value: stats?.totalLeagues ?? 0,
      sub: `Active: ${stats?.activeLeagues ?? 0}`,
      tone: "text-purple-600",
    },
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      sub: `Active: ${stats?.activeUsers ?? 0}`,
      tone: "text-brand-cta-dark",
    },
    {
      label: "Commissioners",
      value: stats?.commissioners ?? 0,
      sub: "Across all leagues",
      tone: "text-amber-600",
    },
    {
      label: "New This Month",
      value: stats?.newThisMonth ?? 0,
      sub: "Leagues + Users combined",
      tone: "text-blue-600",
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-brand-muted">
        Welcome back
        {user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Here&apos;s what is
        happening across AVORA.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-brand-border bg-white p-4 shadow-card"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
              {s.label}
            </p>
            <p className={`mt-1 text-3xl font-bold ${s.tone}`}>
              {isLoading ? "—" : s.value}
            </p>
            <p className="text-xs text-brand-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-dark">
              League Growth — Last 12 Months
            </p>
            <p className="text-[11px] text-brand-muted">
              Total leagues on the platform
            </p>
          </div>
          <LineChart
            data={(data?.growth ?? []).map((point) => point.value)}
            labels={(data?.growth ?? []).map((point) => point.label)}
          />
        </div>
        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-dark">
              User Signups — Last 6 Months
            </p>
            <p className="text-[11px] text-brand-muted">
              New accounts per month
            </p>
          </div>
          <BarChart
            data={(data?.signups ?? []).map((point) => point.value)}
            labels={(data?.signups ?? []).map((point) => point.label)}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-dark">
              Recent Leagues
            </p>
            <Link
              href="/platform/leagues"
              className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline"
            >
              View All <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-brand-border">
            {(data?.recentLeagues ?? []).length === 0 ? (
              <li className="py-2.5 text-xs text-brand-muted">
                {isLoading ? "Loading…" : "No leagues yet."}
              </li>
            ) : (
              (data?.recentLeagues ?? []).map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">
                      {l.name}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {l.owner} · {l.teams} of {l.teamCount} teams
                    </p>
                  </div>
                  <StatusPill status={l.status} />
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-dark">Recent Users</p>
            <Link
              href="/platform/users"
              className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline"
            >
              View All <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-brand-border">
            {(data?.recentUsers ?? []).length === 0 ? (
              <li className="py-2.5 text-xs text-brand-muted">
                {isLoading ? "Loading…" : "No users yet."}
              </li>
            ) : (
              (data?.recentUsers ?? []).map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-dark">
                    {initials(u.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-dark">
                      {u.name}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {u.role} · {timeAgo(u.createdAt)}
                    </p>
                  </div>
                  <StatusPill status="Active" />
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
