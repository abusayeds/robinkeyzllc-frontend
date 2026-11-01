"use client";

import { useMemo, useState } from "react";
import { FiSearch, FiSliders } from "react-icons/fi";
import { useAppSelector } from "@/lib/store/hooks";
import NewsCard from "./NewsCard";
import NewsSidebar from "./NewsSidebar";
import { FILTER_TABS, categoryMatchesFilter } from "./category";

export default function NewsPage() {
  const articles = useAppSelector((state) => state.news.articles);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All News");
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(
    () =>
      articles.filter((a) => {
        if (!categoryMatchesFilter(a.category, filter)) return false;
        if (!search) return true;
        const haystack = `${a.headline} ${a.excerpt} ${a.players.join(
          " "
        )} ${a.teams.join(" ")}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [articles, filter, search]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">League News</h1>
        <p className="text-sm text-brand-muted">
          Official league updates, transactions, roster movements, commissioner
          announcements, and league events.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search news, players, teams..."
                className="w-full rounded-lg border border-brand-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  filter !== "All News"
                    ? "border-brand-cta bg-brand-cta/10 text-brand-cta-dark"
                    : "border-brand-border text-brand-dark hover:bg-brand-soft"
                }`}
              >
                <FiSliders className="h-3.5 w-3.5" />
                Filters
              </button>
              {filterOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setFilterOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-20 w-44 space-y-0.5 rounded-lg border border-brand-border bg-white p-1.5 shadow-card">
                    {FILTER_TABS.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          setFilter(tab);
                          setFilterOpen(false);
                        }}
                        className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-semibold transition ${
                          filter === tab
                            ? "bg-brand-cta text-white"
                            : "text-brand-dark hover:bg-brand-soft"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {filter !== "All News" ? (
            <button
              type="button"
              onClick={() => setFilter("All News")}
              className="rounded-full bg-brand-cta/10 px-3 py-1 text-xs font-semibold text-brand-cta-dark"
            >
              {filter} ✕
            </button>
          ) : null}

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="rounded-xl border border-brand-border bg-white p-8 text-center text-sm text-brand-muted shadow-card">
                No news matches your filters.
              </p>
            ) : (
              filtered.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))
            )}
          </div>
        </div>

        <NewsSidebar />
      </div>
    </div>
  );
}
