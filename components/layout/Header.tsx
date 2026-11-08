"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FiArrowLeft, FiMenu } from "react-icons/fi";
import { HiOutlineMail } from "react-icons/hi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { pageSubtitles, pageTitles } from "@/lib/navigation";
import { exitLeagueView } from "@/lib/store/features/platformSlice";
import { useHydrated } from "@/lib/useHydrated";
import { HeaderSearchDesktop, HeaderSearchMobile } from "./HeaderSearch";
import NotificationsMenu from "./NotificationsMenu";
import UserMenu from "./UserMenu";

export default function Header({
  onOpenMenu,
  hideMenuButton = false,
}: {
  onOpenMenu: () => void;
  hideMenuButton?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const activeLeague = useAppSelector((state) => state.activeLeague.current);
  const role = useAppSelector((state) => state.auth.role);
  const adminViewingLeague = useAppSelector(
    (state) => state.platform.adminViewingLeague
  );
  // The role is restored from localStorage, so it is unknown on the server.
  const hydrated = useHydrated();
  const isAdminViewingLeague =
    hydrated && role === "admin" && !!adminViewingLeague;

  function exitLeague() {
    dispatch(exitLeagueView());
    router.push("/platform/leagues");
  }
  const fallbackTitle =
    pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") ?? "Dashboard";
  const title = pageTitles[pathname] ?? fallbackTitle;
  // Both the greeting and the league name come from the session, which the
  // server render cannot see, so they wait for hydration like the role does.
  const subtitle =
    pageSubtitles[pathname] ??
    (hydrated && user?.name ? `Welcome back, ${user.name}` : "Welcome back");

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 bg-brand-forest px-4 py-4 text-white sm:px-6 sm:py-5 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {hideMenuButton ? null : (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="shrink-0 rounded-lg border border-white/15 p-2 text-white/80 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <FiMenu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <span className="relative block h-5 w-24 sm:hidden">
            <Image
              src="/image/avora-wordmark.png"
              alt="AVORA"
              fill
              sizes="96px"
              className="object-contain object-left"
            />
          </span>
          <h1 className="hidden truncate text-lg font-semibold text-white sm:block sm:text-xl lg:text-2xl">
            {title}
          </h1>
          <p className="mt-0.5 hidden truncate text-sm text-white/60 sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-5">
        {isAdminViewingLeague ? (
          <button
            type="button"
            onClick={exitLeague}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 sm:px-3 sm:text-sm"
          >
            <FiArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">
              Viewing:{" "}
              <span className="text-brand-accent">
                {adminViewingLeague?.name}
              </span>
              {" — "}
            </span>
            Exit League
          </button>
        ) : hydrated && activeLeague ? (
          <p className="hidden text-sm font-medium text-brand-accent md:block">
            {activeLeague.name}
          </p>
        ) : (
          <p className="hidden text-sm font-medium text-brand-accent md:block" />
        )}

        <HeaderSearchDesktop />
        <HeaderSearchMobile />

        <NotificationsMenu />

        <button
          type="button"
          aria-label="Messages"
          disabled
          className="hidden cursor-not-allowed rounded-full border border-white/15 p-2 text-white/40 sm:inline-flex"
        >
          <HiOutlineMail className="h-5 w-5" />
        </button>

        <UserMenu />
      </div>
    </header>
  );
}
