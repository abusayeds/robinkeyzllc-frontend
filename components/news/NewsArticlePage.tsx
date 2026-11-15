"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiEdit2,
} from "react-icons/fi";
import {
  useLeagueNewsQuery,
  useNewsItemQuery,
  useSetNewsHeadlineMutation,
} from "@/lib/store/api/endpoints/newsApi";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import { useAppSelector } from "@/lib/store/hooks";
import BreakingNews, { BreakingLabel, newsTime } from "./BreakingNews";
import { CATEGORY_STYLE } from "./category";

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

export default function NewsArticlePage() {
  const params = useParams<{ id: string }>();
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);

  // A transaction post is a stored record with its own route; an injury or a
  // calendar date is still derived from the feed and has no id of its own.
  const itemId = params.id?.startsWith("news-")
    ? Number(params.id.slice("news-".length))
    : null;

  const { data: item, isLoading: loadingItem } = useNewsItemQuery(
    { leagueId: leagueId as number, itemId: itemId as number },
    { skip: !leagueId || itemId === null },
  );

  const { data: feed, isLoading: loadingFeed } = useLeagueNewsQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId || itemId !== null },
  );

  const [setHeadline, { isLoading: saving }] = useSetNewsHeadlineMutation();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const derived = feed?.articles.find((article) => article.id === params.id);
  const isLoading = loadingItem || loadingFeed;

  if (!item && !derived) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm text-brand-muted">
          {isLoading ? "Loading…" : "That post could not be found."}
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

  const save = async () => {
    if (!leagueId || itemId === null) return;
    setError(null);
    try {
      await setHeadline({
        leagueId,
        itemId,
        headline: draft?.trim() ? draft.trim() : null,
      }).unwrap();
      setDraft(null);
    } catch (e) {
      setError(errorText(e, "That headline could not be saved."));
    }
  };

  const headline = item?.headline ?? derived?.headline ?? "";
  const when = item?.createdAt ?? derived?.timestamp ?? "";
  const style = CATEGORY_STYLE[item?.category ?? derived!.category];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/league/news"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-dark"
      >
        <FiArrowLeft className="h-4 w-4" /> Back to League News
      </Link>

      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Every transaction post carries the same label. A derived item —
              an injury, a calendar date — keeps its own category badge. */}
          {item ? (
            <BreakingLabel />
          ) : (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}
            >
              {style.label}
            </span>
          )}
          <span className="text-xs text-brand-muted">{newsTime(when)}</span>
        </div>

        {draft === null ? (
          <h1 className="mt-3 flex flex-wrap items-start gap-2 text-2xl font-bold leading-tight text-brand-dark">
            {headline}
            {item && canEdit ? (
              <button
                type="button"
                onClick={() => setDraft(item.customHeadline ?? item.headline)}
                title="Write your own headline"
                className="mt-1 shrink-0 rounded p-1 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
              >
                <FiEdit2 className="h-4 w-4" />
              </button>
            ) : null}
          </h1>
        ) : (
          <div className="mt-3 space-y-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={200}
              placeholder={item?.autoHeadline}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-lg font-bold text-brand-dark outline-none focus:border-brand-cta"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="rounded-lg bg-brand-cta px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save headline"}
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
              >
                Cancel
              </button>
              <span className="text-[11px] text-brand-muted">
                Leave it blank to go back to the generated headline.
              </span>
            </div>
          </div>
        )}

        {error ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-4">
          {item ? (
            <BreakingNews payload={item.payload} />
          ) : (
            <p className="text-sm leading-relaxed text-brand-dark">
              {derived?.body}
            </p>
          )}
        </div>

        {item?.payload.status ? (
          <p className="mt-4 border-t border-brand-border pt-3 text-xs text-brand-muted">
            {item.payload.status.replace(
              /Processed .*/,
              `Processed ${newsTime(item.createdAt)}`,
            )}
          </p>
        ) : null}

        {item ? (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-border pt-3">
            {item.previous ? (
              <Link
                href={`/league/news/news-${item.previous.id}`}
                className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-brand-cta-dark hover:underline"
              >
                <FiArrowLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Prev</span>
              </Link>
            ) : (
              <span />
            )}
            {item.next ? (
              <Link
                href={`/league/news/news-${item.next.id}`}
                className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-brand-cta-dark hover:underline"
              >
                <span className="truncate">Next</span>
                <FiArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
