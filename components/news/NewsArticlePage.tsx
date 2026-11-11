"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useLeagueNewsQuery } from "@/lib/store/api/endpoints/newsApi";
import { useAppSelector } from "@/lib/store/hooks";
import { CATEGORY_STYLE } from "./category";

export default function NewsArticlePage() {
  const params = useParams<{ id: string }>();
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  // The feed is one request and the article is a row in it, so there is no
  // per-article endpoint to add: an item is derived from a move, an injury
  // or a date, not stored as a document.
  const { data, isLoading } = useLeagueNewsQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );
  const articles = data?.articles ?? [];

  const index = articles.findIndex((a) => a.id === params.id);
  const article = articles[index];
  const next = articles[index + 1] ?? articles[0];

  if (!article) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm text-brand-muted">
          {isLoading ? "Loading…" : "Article not found."}
        </p>
        <Link
          href="/league/news"
          className="mt-3 inline-block text-sm font-semibold text-brand-cta-dark"
        >
          Back to League News
        </Link>
      </div>
    );
  }

  const style = CATEGORY_STYLE[article.category];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/league/news"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-dark"
      >
        <FiArrowLeft className="h-4 w-4" /> Back to League News
      </Link>

      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-card">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}
          >
            {style.label}
          </span>
          <span className="text-xs text-brand-muted">{article.timestamp}</span>
        </div>

        <h1 className="mt-3 text-2xl font-bold leading-tight text-brand-dark">
          {article.headline}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {article.teams.map((t) => (
            <span
              key={t}
              className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-dark"
            >
              {t}
            </span>
          ))}
          {article.players.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 text-xs text-brand-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cta" />
              {p}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-brand-dark">
          {article.body}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex justify-end border-t border-brand-border pt-3">
          <Link
            href={`/league/news/${next.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-cta-dark hover:underline"
          >
            Next <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
