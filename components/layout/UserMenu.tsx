"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiRepeat,
  FiSettings,
} from "react-icons/fi";
import { HiOutlineOfficeBuilding, HiOutlineUserGroup } from "react-icons/hi";
import { TbCrown } from "react-icons/tb";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { ROLE_LABEL, setRole } from "@/lib/store/features/authSlice";
import {
  canManageLeague,
  setActiveLeague,
} from "@/lib/store/features/activeLeagueSlice";
import { endSession } from "@/lib/store/session";
import {
  managesLeague,
  useMyLeaguesQuery,
  type ApiLeague,
} from "@/lib/store/api";
import TeamLogo from "@/components/ui/TeamLogo";
import { avatarSrc, initials } from "@/lib/avatar";
import { useHydrated } from "@/lib/useHydrated";

function roleBadge(roleLabel: string) {
  return roleLabel === "Commissioner"
    ? { tone: "bg-brand-dark text-white", icon: TbCrown }
    : { tone: "bg-brand-cta/15 text-brand-cta-dark", icon: HiOutlineUserGroup };
}

type View = "menu" | "switch-league";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const user = useAppSelector((state) => state.auth.user);
  const role = useAppSelector((state) => state.auth.role);
  const activeLeague = useAppSelector((state) => state.activeLeague.current);
  // The signed-in user comes from localStorage, so none of this exists during
  // the server render.
  const hydrated = useHydrated();
  const roleLabel = ROLE_LABEL[role];
  const displayName = user?.name ?? "Account";
  const avatar = avatarSrc(user?.image);

  const { data: memberships = [], isLoading: leaguesLoading } =
    useMyLeaguesQuery(undefined, { skip: !open });

  // The league the user is standing in, matched back to the membership so the
  // menu can show its team and role without a second request.
  const current = useMemo(
    () => memberships.find((league) => league.id === activeLeague?.id) ?? null,
    [memberships, activeLeague?.id],
  );

  // Only offer roles the user actually holds here: no Team Owner option
  // without a franchise, no Commissioner option without the role.
  const canViewOwner = Boolean(
    current?.team ?? (activeLeague?.hasTeam && !current),
  );
  const canViewCommissioner = current
    ? managesLeague(current)
    : canManageLeague(activeLeague);

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

  function closeMenu() {
    setOpen(false);
    setTimeout(() => {
      setView("menu");
    }, 200);
  }

  function handleLogout() {
    closeMenu();
    endSession(dispatch);
    router.push("/login");
  }

  function switchView(target: "owner" | "commissioner") {
    if (role !== target) {
      dispatch(setRole(target));
      router.push(target === "owner" ? "/my-team" : "/league-office");
    }
    closeMenu();
  }

  /** Moves the whole app into another league, keeping a role the user holds. */
  function switchLeague(league: ApiLeague) {
    dispatch(
      setActiveLeague({
        id: league.id,
        name: league.name,
        logo: league.logo,
        role: league.leagueRole,
        visibility: league.visibility,
        hasTeam: Boolean(league.team),
      }),
    );

    // Keep the current view where that is possible, otherwise fall back to the
    // one role this league actually offers.
    const keepCommissioner = role === "commissioner" && managesLeague(league);
    const next = keepCommissioner || !league.team ? "commissioner" : "owner";

    dispatch(setRole(next));
    router.push(next === "owner" ? "/my-team" : "/league-office");
    closeMenu();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-3 border-l border-white/15 pl-2 transition sm:pl-5"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-dark text-xs font-semibold text-brand-accent sm:h-10 sm:w-10">
          {!hydrated ? null : avatar ? (
            <Image
              src={avatar}
              alt={displayName}
              width={40}
              height={40}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            initials(displayName)
          )}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold text-white">
            {hydrated ? displayName : " "}
          </p>
          <p className="text-xs text-white/55">
            {hydrated ? roleLabel : " "}
          </p>
        </div>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[300px] overflow-hidden rounded-xl border border-brand-border bg-white text-brand-dark shadow-card">
          {view === "menu" ? (
            <>
              <div className="flex items-center gap-3 border-b border-brand-border px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-forest text-xs font-semibold text-brand-accent">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={displayName}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(displayName)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-brand-dark">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-brand-muted">
                    {user?.email ?? "Demo session"}
                  </p>
                </div>
              </div>

              {activeLeague ? (
                <div className="flex items-center gap-2.5 border-b border-brand-border bg-brand-soft/40 px-4 py-2.5">
                  <TeamLogo
                    name={activeLeague.name}
                    src={avatarSrc(activeLeague.logo) ?? undefined}
                    className="h-8 w-8"
                    rounded="rounded-lg"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">
                      Current League
                    </p>
                    <p className="truncate text-sm font-semibold text-brand-dark">
                      {activeLeague.name}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="border-b border-brand-border px-2 py-2">
                <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-muted">
                  Viewing As
                </p>
                {!canViewOwner && !canViewCommissioner ? (
                  <p className="px-2 pb-1 text-xs text-brand-muted">
                    {activeLeague
                      ? "You hold no role in this league yet."
                      : "Open a league from AVORA Home first."}
                  </p>
                ) : null}
                {canViewOwner ? (
                  <button
                    type="button"
                    onClick={() => switchView("owner")}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                      role === "owner"
                        ? "bg-brand-cta/10 text-brand-cta-dark"
                        : "text-brand-dark hover:bg-brand-soft"
                    }`}
                  >
                    <HiOutlineUserGroup className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">Team Owner</span>
                      <span className="block truncate text-xs text-brand-muted">
                        {current?.team?.name ?? "My Team"}
                      </span>
                    </span>
                    {role === "owner" ? (
                      <FiCheck className="h-4 w-4 shrink-0 text-brand-cta-dark" />
                    ) : null}
                  </button>
                ) : null}
                {canViewCommissioner ? (
                  <button
                    type="button"
                    onClick={() => switchView("commissioner")}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                      role === "commissioner"
                        ? "bg-brand-cta/10 text-brand-cta-dark"
                        : "text-brand-dark hover:bg-brand-soft"
                    }`}
                  >
                    <HiOutlineOfficeBuilding className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">Commissioner</span>
                      <span className="block truncate text-xs text-brand-muted">
                        League Office
                      </span>
                    </span>
                    {role === "commissioner" ? (
                      <FiCheck className="h-4 w-4 shrink-0 text-brand-cta-dark" />
                    ) : null}
                  </button>
                ) : null}
              </div>

              <div className="border-b border-brand-border px-2 py-2">
                <button
                  type="button"
                  onClick={() => setView("switch-league")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-brand-dark transition hover:bg-brand-soft"
                >
                  <FiRepeat className="h-4 w-4 text-brand-muted" />
                  <span className="min-w-0 flex-1">Switch League</span>
                  <FiChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    router.push("/home");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-brand-dark transition hover:bg-brand-soft"
                >
                  <FiHome className="h-4 w-4 text-brand-muted" />
                  AVORA Home
                </button>
              </div>

              <div className="px-2 py-2">
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-brand-dark transition hover:bg-brand-soft"
                >
                  <FiSettings className="h-4 w-4 text-brand-muted" />
                  Account Settings
                </button>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-brand-dark transition hover:bg-brand-soft"
                >
                  <FiHelpCircle className="h-4 w-4 text-brand-muted" />
                  Help &amp; Support
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-red-500 transition hover:bg-red-50"
                >
                  <FiLogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-brand-border px-3 py-3">
                <button
                  type="button"
                  onClick={() => setView("menu")}
                  aria-label="Back"
                  className="rounded-lg p-1 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-sm font-bold text-brand-dark">
                  Switch League
                </h2>
              </div>

              <ul className="max-h-80 overflow-y-auto px-2 py-2">
                {leaguesLoading ? (
                  <li className="px-2.5 py-3 text-xs text-brand-muted">
                    Loading leagues…
                  </li>
                ) : memberships.length === 0 ? (
                  <li className="px-2.5 py-3 text-xs text-brand-muted">
                    You are not in any league yet.
                  </li>
                ) : (
                  memberships.map((league) => {
                    const active = league.id === activeLeague?.id;
                    return (
                      <li key={league.id}>
                        <button
                          type="button"
                          onClick={() => switchLeague(league)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-brand-soft ${
                            active ? "bg-brand-cta/10" : ""
                          }`}
                        >
                          <TeamLogo
                            name={league.name}
                            src={avatarSrc(league.logo) ?? undefined}
                            className="h-11 w-11"
                            rounded="rounded-full"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-brand-dark">
                              {league.name}
                            </span>
                            <span className="block truncate text-[11px] text-brand-muted">
                              {league.team
                                ? league.team.name
                                : `${league.teamCount} teams · ${league.season}`}
                            </span>
                            <span className="mt-1 flex flex-wrap gap-1">
                              {league.roles.map((r) => {
                                const badge = roleBadge(r);
                                const Icon = badge.icon;
                                return (
                                  <span
                                    key={r}
                                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.tone}`}
                                  >
                                    <Icon className="h-2.5 w-2.5" />
                                    {r}
                                  </span>
                                );
                              })}
                            </span>
                          </span>
                          {active ? (
                            <FiCheck className="h-4 w-4 shrink-0 text-brand-cta-dark" />
                          ) : (
                            <FiChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />
                          )}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
