"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiArrowLeft, FiChevronRight } from "react-icons/fi";
import { HiOutlineHome } from "react-icons/hi";
import { LuSettings, LuClipboardList, LuUsers } from "react-icons/lu";
import { commissionerNav, type NavItem } from "@/lib/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { exitLeagueView } from "@/lib/store/features/platformSlice";

const OPERATIONS_SECTION = commissionerNav.find((s) => s.title === "OPERATIONS");
const LEAGUE_SETTINGS_SECTION = commissionerNav.find((s) => s.title === "LEAGUE SETTINGS");
const DRAFT_SECTION = commissionerNav.find((s) => s.title === "DRAFT");

const OPERATIONS_ITEMS: NavItem[] = OPERATIONS_SECTION?.items ?? [];
const LEAGUE_SETTINGS_ITEMS: NavItem[] = LEAGUE_SETTINGS_SECTION?.items ?? [];
const DRAFT_ITEMS: NavItem[] = DRAFT_SECTION?.items ?? [];

type Sheet = "operations" | "league-settings" | "draft" | null;

function NavSheet({
  open,
  title,
  items,
  onClose,
}: {
  open: boolean;
  title: string;
  items: NavItem[];
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timeout = setTimeout(() => setMounted(false), 550);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[60] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-brand-dark/60 backdrop-blur-[2px] transition-opacity duration-500 ease-out ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        onMouseDown={onClose}
      />
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-[550ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex w-full items-center justify-center pb-2 pt-3 active:opacity-60"
        >
          <span className="h-1 w-10 rounded-full bg-brand-border transition-transform active:scale-90" />
        </button>
        <h2 className="px-5 pb-2 text-lg font-bold text-brand-dark">{title}</h2>
        <ul className="divide-y divide-brand-border">
          {items.map((item, i) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <li
                key={item.href}
                className={`transition-all duration-[550ms] ease-out ${
                  shown
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0"
                }`}
                style={{
                  transitionDelay: shown ? `${220 + i * 40}ms` : "0ms",
                }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between gap-3 px-5 py-3.5 text-sm transition active:bg-brand-soft ${
                    active
                      ? "font-semibold text-brand-cta-dark"
                      : "text-brand-dark"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 shrink-0 ${
                        active ? "text-brand-cta-dark" : "text-brand-dark"
                      }`}
                    />
                    {item.label}
                  </span>
                  <FiChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function MobileBottomNavCommissioner() {
  const [sheet, setSheet] = useState<Sheet>(null);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.role);
  const adminViewingLeague = useAppSelector(
    (state) => state.platform.adminViewingLeague
  );
  const isAdminViewingLeague = role === "admin" && !!adminViewingLeague;

  function exitLeague() {
    dispatch(exitLeagueView());
    router.push("/platform/leagues");
  }

  const leagueOfficeActive = pathname.startsWith("/league-office");
  const operationsActive = sheet === "operations" || (!sheet && OPERATIONS_ITEMS.some(i => pathname.startsWith(i.href)));
  const leagueSettingsActive = sheet === "league-settings" || (!sheet && LEAGUE_SETTINGS_ITEMS.some(i => pathname.startsWith(i.href)));
  const draftActive = sheet === "draft" || (!sheet && DRAFT_ITEMS.some(i => pathname.startsWith(i.href)));
  const homeActive = pathname === "/home";

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-brand-dark pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
        aria-label="Primary"
      >
        <div className="flex items-center justify-around px-2">
          <button
            type="button"
            onClick={() => setSheet(sheet === "league-settings" ? null : "league-settings")}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-all duration-150 active:scale-90 ${
              leagueSettingsActive ? "text-brand-accent" : "text-white/70"
            }`}
          >
            <LuSettings className="h-5 w-5" />
            League Settings
          </button>

          <button
            type="button"
            onClick={() => setSheet(sheet === "operations" ? null : "operations")}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-all duration-150 active:scale-90 ${
              operationsActive ? "text-brand-accent" : "text-white/70"
            }`}
          >
            <LuClipboardList className="h-5 w-5" />
            Operations
          </button>

          <Link
            href="/league-office"
            className="flex flex-1 flex-col items-center gap-0.5 py-1.5 active:scale-95 transition-transform duration-150"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 bg-brand-cta p-2.5 shadow-lg transition-colors ${
                leagueOfficeActive ? "border-brand-accent" : "border-brand-accent/40"
              }`}
            >
              <Image
                src="/image/logo-icon.png"
                alt=""
                width={22}
                height={20}
                className="object-contain"
              />
            </span>
            <span
              className={`text-[10px] font-medium ${
                leagueOfficeActive ? "text-brand-accent" : "text-white/70"
              }`}
            >
              League Office
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setSheet(sheet === "draft" ? null : "draft")}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-all duration-150 active:scale-90 ${
              draftActive ? "text-brand-accent" : "text-white/70"
            }`}
          >
            <LuUsers className="h-5 w-5" />
            Draft
          </button>

          {isAdminViewingLeague ? (
            <button
              type="button"
              onClick={exitLeague}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium text-white/70 transition-all duration-150 active:scale-90"
            >
              <FiArrowLeft className="h-5 w-5" />
              Exit League
            </button>
          ) : (
            <Link
              href="/home"
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-all duration-150 active:scale-90 ${
                homeActive ? "text-brand-accent" : "text-white/70"
              }`}
            >
              <HiOutlineHome className="h-5 w-5" />
              Avora Home
            </Link>
          )}
        </div>

        <div className="mt-2 flex justify-center pb-1">
          <span className="h-1 w-28 rounded-full bg-white/40" />
        </div>
      </nav>

      <NavSheet
        open={sheet === "league-settings"}
        title="League Settings"
        items={LEAGUE_SETTINGS_ITEMS}
        onClose={() => setSheet(null)}
      />
      <NavSheet
        open={sheet === "operations"}
        title="Operations"
        items={OPERATIONS_ITEMS}
        onClose={() => setSheet(null)}
      />
      <NavSheet
        open={sheet === "draft"}
        title="Draft"
        items={DRAFT_ITEMS}
        onClose={() => setSheet(null)}
      />
    </>
  );
}
