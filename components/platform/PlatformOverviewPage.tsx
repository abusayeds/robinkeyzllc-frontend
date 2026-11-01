"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

const STATS = [
  { label: "Total Leagues", value: "8", sub: "Active: 6", tone: "text-purple-600" },
  { label: "Total Users", value: "10", sub: "Active: 8", tone: "text-brand-cta-dark" },
  { label: "Commissioners", value: "4", sub: "Across all leagues", tone: "text-amber-600" },
  { label: "New This Month", value: "5", sub: "Leagues + Users combined", tone: "text-blue-600" },
];

const GROWTH = [2, 3, 3, 4, 5, 6, 6, 7, 6, 8, 9, 11];
const GROWTH_LABELS = ["Sep", "", "Nov", "", "Jan", "", "Mar", "", "May", "", "Jul", ""];
const SIGNUPS = [4, 5, 7, 8, 11, 12];
const SIGNUP_LABELS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];

const RECENT_LEAGUES = [
  { name: "Celtics Dynasty", owner: "Robin Keyz", teams: 12, status: "Active" },
  { name: "King's Court", owner: "Marcus Webb", teams: 10, status: "Active" },
  { name: "Hoop Dreams League", owner: "Tanya Mills", teams: 8, status: "Active" },
  { name: "Fantasy Ballers", owner: "Chris Osei", teams: 14, status: "Inactive" },
  { name: "BK Hoops League", owner: "Dev Patel", teams: 12, status: "Active" },
];

const RECENT_USERS = [
  { name: "Robin Keyz", role: "Commissioner", ago: "2h ago", initials: "RK" },
  { name: "Marcus Webb", role: "Owner", ago: "5h ago", initials: "MW" },
  { name: "Tanya Mills", role: "Commissioner", ago: "1d ago", initials: "TM" },
  { name: "Chris Osei", role: "Owner", ago: "3d ago", initials: "CO" },
  { name: "Dev Patel", role: "Commissioner", ago: "6h ago", initials: "DP" },
];

function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data);
  const w = 100;
  const h = 40;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-40 w-full">
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
  const max = Math.max(...data);
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
        {labels.map((l) => (
          <span key={l} className="flex-1 text-center">
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
          : "bg-red-100 text-red-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function PlatformOverviewPage() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-brand-muted">
        Welcome back, Robin. Here&apos;s what&apos;s happening across AVORA.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-brand-border bg-white p-4 shadow-card"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
              {s.label}
            </p>
            <p className={`mt-1 text-3xl font-bold ${s.tone}`}>{s.value}</p>
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
              Total leagues created per month
            </p>
          </div>
          <LineChart data={GROWTH} labels={GROWTH_LABELS} />
        </div>
        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-dark">
              User Signups — Last 6 Months
            </p>
            <p className="text-[11px] text-brand-muted">New accounts per month</p>
          </div>
          <BarChart data={SIGNUPS} labels={SIGNUP_LABELS} />
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
            {RECENT_LEAGUES.map((l) => (
              <li
                key={l.name}
                className="flex items-center justify-between py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-dark">
                    {l.name}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {l.owner} · {l.teams} teams
                  </p>
                </div>
                <StatusPill status={l.status} />
              </li>
            ))}
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
            {RECENT_USERS.map((u) => (
              <li key={u.name} className="flex items-center gap-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-dark">
                  {u.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-dark">
                    {u.name}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {u.role} · {u.ago}
                  </p>
                </div>
                <StatusPill status="Active" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
