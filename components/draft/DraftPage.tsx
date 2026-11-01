"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RookieDraft from "./RookieDraft";
import StartupDraft from "./StartupDraft";

const TABS = ["Rookie Draft", "Startup Draft"] as const;
type Tab = (typeof TABS)[number];

const TAB_ROUTE: Record<Tab, string> = {
  "Rookie Draft": "/league/draft/rookie",
  "Startup Draft": "/league/draft/startup",
};

export default function DraftPage({
  initialTab = "Rookie Draft",
  syncRoute = false,
}: {
  initialTab?: Tab;
  syncRoute?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);

  function selectTab(next: Tab) {
    setTab(next);
    if (syncRoute) router.push(TAB_ROUTE[next]);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Draft</h1>
        <p className="text-sm text-brand-muted">
          Rookie and startup draft boards, clock, and pick queue.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border border-brand-border p-0.5">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => selectTab(item)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
              tab === item
                ? "bg-brand-cta text-white"
                : "text-brand-muted hover:text-brand-dark"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Rookie Draft" ? <RookieDraft /> : <StartupDraft />}
    </div>
  );
}
