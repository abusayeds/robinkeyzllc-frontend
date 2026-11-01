"use client";

import { FiAlertTriangle } from "react-icons/fi";
import { useAppSelector } from "@/lib/store/hooks";

export default function NewsSidebar() {
  const alerts = useAppSelector((state) => state.news.alerts);
  const events = useAppSelector((state) => state.news.events);
  const notices = useAppSelector((state) => state.news.notices);

  return (
    <div className="space-y-4">
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
              key={alert}
              className="flex items-start gap-2 px-4 py-2.5 text-xs text-brand-dark"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              {alert}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-muted">
          Upcoming Events
        </p>
        <ul className="space-y-2.5">
          {events.map((event) => (
            <li key={event.id} className="flex items-center gap-2.5 text-xs">
              <span className={`h-2 w-2 shrink-0 rounded-full ${event.tone}`} />
              <span className="font-medium text-brand-dark">{event.label}</span>
              <span className="ml-auto text-brand-muted">{event.date}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-muted">
          Commissioner Notices
        </p>
        <ul className="space-y-3">
          {notices.map((notice) => (
            <li key={notice.id}>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-brand-forest px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                  Official
                </span>
                <span className="text-[11px] text-brand-muted">
                  {notice.date}
                </span>
              </div>
              <p className="text-xs text-brand-dark">{notice.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
