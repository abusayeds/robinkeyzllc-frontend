"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";
import { HiOutlineHome, HiOutlineUserGroup } from "react-icons/hi";
import { MdOutlineGridView } from "react-icons/md";
import { dashboardNav, type NavItem } from "@/lib/navigation";

const LEAGUE_SECTION = dashboardNav.find((s) => s.title === "LEAGUE");
const MY_TEAM_SECTION = dashboardNav.find((s) => s.title === "MY TEAM");
const AVORA_HOME: NavItem = { label: "Avora Home", href: "/home", icon: HiOutlineHome };

const LEAGUE_ITEMS: NavItem[] = [...(LEAGUE_SECTION?.items ?? []), AVORA_HOME];
const MY_TEAM_ITEMS: NavItem[] = MY_TEAM_SECTION?.items ?? [];

type Sheet = "league" | "my-team" | null;

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

const LEAGUE_HREFS = new Set(LEAGUE_ITEMS.map((i) => i.href));

export default function MobileBottomNav() {
  const [sheet, setSheet] = useState<Sheet>(null);
  const pathname = usePathname();

  const dashboardActive = pathname === "/dashboard";
  const leagueActive =
    sheet === "league" ||
    (!sheet && !dashboardActive && LEAGUE_HREFS.has(pathname));
  const myTeamActive =
    sheet === "my-team" ||
    (!sheet && !dashboardActive && pathname.startsWith("/my-team"));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-brand-dark pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
        aria-label="Primary"
      >
        <div className="flex items-end justify-around px-4">
          <button
            type="button"
            onClick={() => setSheet(sheet === "my-team" ? null : "my-team")}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-all duration-150 active:scale-90 ${
              myTeamActive ? "text-brand-accent" : "text-white/70"
            }`}
          >
            <HiOutlineUserGroup className="h-5 w-5" />
            My Team
          </button>

          <Link
            href="/dashboard"
            className="-mt-7 flex flex-1 flex-col items-center active:scale-95 transition-transform duration-150"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full border-4 bg-brand-cta p-3 shadow-lg transition-colors ${
                dashboardActive ? "border-brand-accent" : "border-brand-accent/40"
              }`}
            >
              <Image
                src="/image/logo-icon.png"
                alt=""
                width={26}
                height={24}
                className="object-contain"
              />
            </span>
            <span
              className={`mt-1 text-[11px] font-medium ${
                dashboardActive ? "text-brand-accent" : "text-white/70"
              }`}
            >
              Dashboard
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setSheet(sheet === "league" ? null : "league")}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-all duration-150 active:scale-90 ${
              leagueActive ? "text-brand-accent" : "text-white/70"
            }`}
          >
            <MdOutlineGridView className="h-5 w-5" />
            League
          </button>
        </div>

        <div className="mt-2 flex justify-center pb-1">
          <span className="h-1 w-28 rounded-full bg-white/40" />
        </div>
      </nav>

      <NavSheet
        open={sheet === "league"}
        title="League"
        items={LEAGUE_ITEMS}
        onClose={() => setSheet(null)}
      />
      <NavSheet
        open={sheet === "my-team"}
        title="My Team"
        items={MY_TEAM_ITEMS}
        onClose={() => setSheet(null)}
      />
    </>
  );
}
