"use client";

import { useMemo } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import {
  PHASE_COLOR,
  useLeagueCalendarQuery,
} from "@/lib/store/api/endpoints/calendarApi";
import type { NewsArticle } from "@/lib/store/api/endpoints/newsApi";
import { useAppSelector } from "@/lib/store/hooks";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/**
 * The three cards beside the feed, all read off things that exist.
 *
 * `alerts`, `events` and `notices` used to be three separate fixtures. Alerts
 * and notices are a view of the same feed the page is already showing, and the
 * dates come from the league calendar, which is the one place they live.
 */
export default function NewsSidebar({
  articles,
}: {
  articles: NewsArticle[];
}) {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data: calendar } = useLeagueCalendarQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );

  const alerts = useMemo(
    () => articles.filter((article) => article.alert).slice(0, 5),
    [articles],
  );

  const notices = useMemo(
    () =>
      articles
        .filter((article) => article.category === "Commissioner")
        .slice(0, 4),
    [articles],
  );

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return (calendar?.events ?? [])
      .filter((event) => new Date(event.startDate) >= today)
      .slice(0, 5);
  }, [calendar]);

  return (
    <div className="space-y-4">
      {alerts.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
          <div className="flex items-center gap-2 bg-red-500 px-4 py-2.5 text-white">
            <FiAlertTriangle className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-wide">
              League Alerts
            </p>
          </div>
          <ul className="divide-y divide-brand-border">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex items-start gap-2 px-4 py-2.5 text-xs text-brand-dark"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {alert.headline}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-muted">
          Upcoming Events
        </p>
        {upcoming.length === 0 ? (
          <p className="text-xs text-brand-muted">
            Nothing ahead on the league calendar.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {upcoming.map((event) => (
              <li key={event.id} className="flex items-center gap-2.5 text-xs">
                {/* The phase chip's colour, reduced to a dot. */}
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${PHASE_COLOR[event.phase].split(" ")[0]}`}
                />
                <span className="truncate font-medium text-brand-dark">
                  {event.title}
                </span>
                <span className="ml-auto shrink-0 text-brand-muted">
                  {event.displayLabel ?? formatDate(event.startDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-muted">
          Commissioner Notices
        </p>
        {notices.length === 0 ? (
          <p className="text-xs text-brand-muted">
            No announcements from the commissioner.
          </p>
        ) : (
          <ul className="space-y-3">
            {notices.map((notice) => (
              <li key={notice.id}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-brand-forest px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    Official
                  </span>
                  <span className="text-[11px] text-brand-muted">
                    {formatDate(notice.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-brand-dark">{notice.excerpt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
