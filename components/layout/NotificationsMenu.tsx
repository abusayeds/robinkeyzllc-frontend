"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IoIosNotificationsOutline } from "react-icons/io";
import {
  FiRepeat,
  FiUserPlus,
  FiClipboard,
  FiInbox,
  FiBell,
  FiMail,
} from "react-icons/fi";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import { useAppSelector } from "@/lib/store/hooks";
import {
  getApiErrorMessage,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
  type AppNotification,
  type NotificationType,
} from "@/lib/store/api";

const TYPE_STYLE: Record<
  NotificationType,
  { icon: typeof FiBell; tone: string }
> = {
  tradeProposal: { icon: FiRepeat, tone: "bg-blue-50 text-blue-600" },
  freeAgency: { icon: FiUserPlus, tone: "bg-brand-cta/15 text-brand-cta-dark" },
  announcement: {
    icon: HiOutlineSpeakerphone,
    tone: "bg-amber-50 text-amber-600",
  },
  lineupReminder: { icon: FiClipboard, tone: "bg-brand-soft text-brand-dark" },
  waiverResult: { icon: FiInbox, tone: "bg-brand-soft text-brand-dark" },
  leagueInvite: { icon: FiMail, tone: "bg-violet-50 text-violet-600" },
  system: { icon: FiBell, tone: "bg-brand-soft text-brand-dark" },
};

function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;

  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;

  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;

  const days = hours / 24;
  if (days < 7) return `${Math.floor(days)}d ago`;

  return new Date(iso).toLocaleDateString();
}

export default function NotificationsMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);
  // The demo sign-in stores a token with no user, so nothing is asked for
  // until a real account is present.
  const enabled = isAuthenticated && Boolean(user);

  const { data: unread } = useUnreadNotificationCountQuery(undefined, {
    skip: !enabled,
    pollingInterval: 60_000,
  });

  // The list itself is only fetched once the panel is opened.
  const {
    data: list,
    isLoading,
    isError,
    error,
  } = useNotificationsQuery(
    { limit: 10 },
    { skip: !enabled || !open },
  );

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] =
    useMarkAllNotificationsReadMutation();

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const notifications = list?.items ?? [];
  const unreadCount = unread?.unreadCount ?? 0;

  function openNotification(n: AppNotification) {
    if (n.unread) markRead(n.id);
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        className="relative rounded-full border border-white/15 p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <IoIosNotificationsOutline className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-brand-dark">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-xl border border-brand-border bg-white text-brand-dark shadow-card">
          <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
            <p className="text-sm font-bold">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={markingAll}
                onClick={() => markAllRead()}
                className="text-xs font-semibold text-brand-cta-dark transition hover:underline disabled:opacity-60"
              >
                {markingAll ? "Marking…" : "Mark all as read"}
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <p className="px-4 py-8 text-center text-xs text-brand-muted">
              Loading…
            </p>
          ) : isError ? (
            <p className="px-4 py-8 text-center text-xs font-medium text-red-600">
              {getApiErrorMessage(error, "Could not load notifications.")}
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-brand-muted">
              You have no notifications yet.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-brand-border overflow-y-auto">
              {notifications.map((n) => {
                const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.system;
                const Icon = style.icon;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-brand-soft/60 ${
                        n.unread ? "bg-brand-cta/[0.04]" : ""
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.tone}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-brand-dark">
                            {n.title}
                          </span>
                          {n.unread ? (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cta" />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-brand-muted">
                          {n.detail}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] text-brand-muted">
                        {timeAgo(n.createdAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
