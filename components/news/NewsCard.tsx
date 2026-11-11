import Link from "next/link";
import { FiArrowRight, FiFlag } from "react-icons/fi";
import type { NewsArticle } from "@/lib/store/api/endpoints/newsApi";

/** The card showed a stored `timeAgo` string; it is worked out now. */
const timeAgo = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days >= 30) return `${Math.floor(days / 30)}mo ago`;
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(diff / 3_600_000);
  return hours >= 1 ? `${hours}h ago` : "just now";
};
import { CATEGORY_STYLE } from "./category";

export default function NewsCard({ article }: { article: NewsArticle }) {
  const style = CATEGORY_STYLE[article.category];
  const isCommish = article.category === "Commissioner";

  return (
    <article
      className={`rounded-xl border border-brand-border bg-white p-4 shadow-card ${
        isCommish ? "" : `border-l-4 ${style.border}`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}
          >
            {isCommish ? <FiFlag className="h-2.5 w-2.5" /> : null}
            {style.label}
          </span>
          {article.alert ? (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
              Alert
            </span>
          ) : null}
        </div>
        <span className="shrink-0 text-xs text-brand-muted">
          {timeAgo(article.timestamp)}
        </span>
      </div>

      <h3 className="mt-2 text-sm font-bold text-brand-dark">
        {article.headline}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-brand-muted">
        {article.excerpt}
      </p>

      {article.teams.length || article.tags.length ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {article.teams.map((t) => (
            <span
              key={t}
              className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-dark"
            >
              {t}
            </span>
          ))}
          {article.tags.map((tag) => (
            <span key={tag} className="text-[11px] text-brand-muted">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <Link
        href={`/league/news/${article.id}`}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-cta-dark hover:underline"
      >
        View Details <FiArrowRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}
