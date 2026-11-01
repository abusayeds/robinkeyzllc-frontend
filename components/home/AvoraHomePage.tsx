"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiMail, FiPlus, FiShield } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setRole } from "@/lib/store/features/authSlice";
import { setActiveLeague } from "@/lib/store/features/activeLeagueSlice";
import CreateLeagueModal from "@/components/home/CreateLeagueModal";
import { avatarSrc, initials } from "@/lib/avatar";
import { useHydrated } from "@/lib/useHydrated";
import {
  API_URL,
  SCORING_TYPE_LABEL,
  getApiErrorMessage,
  managesLeague,
  useAcceptInviteMutation,
  useDeclineInviteMutation,
  useMyInvitesQuery,
  useMyLeaguesQuery,
  type ApiLeague,
} from "@/lib/store/api";

// Stored logo paths are relative so they survive a change of domain, which
// means the origin has to be put back in front of them when rendering.
const ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

const logoSrc = (logo: string | null) =>
  logo && logo.startsWith("/public/") ? `${ORIGIN}${logo}` : logo;

export default function AvoraHomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [modalOpen, setModalOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // Demo sign-in stores a token with no user, so these are only asked for when
  // a real account is present.
  const signedIn = isAuthenticated && Boolean(user);

  const {
    data: memberships = [],
    isLoading,
    isError,
    error,
  } = useMyLeaguesQuery(undefined, { skip: !signedIn });

  // One membership list, read two ways. A franchise is how a team owner gets
  // in; My Leagues is only for the leagues the user actually runs. Someone who
  // has joined but holds neither sees the waiting note instead.
  const myTeams = useMemo(
    () => memberships.filter((league) => league.team),
    [memberships],
  );
  const myLeagues = useMemo(
    () => memberships.filter(managesLeague),
    [memberships],
  );
  const waitingLeagues = useMemo(
    () => memberships.filter((league) => !league.team && !managesLeague(league)),
    [memberships],
  );

  const { data: pendingInvites = [] } = useMyInvitesQuery(undefined, {
    skip: !signedIn,
  });

  const [acceptInvite, { isLoading: accepting }] = useAcceptInviteMutation();
  const [declineInvite, { isLoading: declining }] = useDeclineInviteMutation();
  const [inviteError, setInviteError] = useState<string | null>(null);

  async function respond(inviteId: number, accept: boolean) {
    setInviteError(null);
    try {
      if (accept) {
        await acceptInvite(inviteId).unwrap();
      } else {
        await declineInvite(inviteId).unwrap();
      }
    } catch (err) {
      setInviteError(
        getApiErrorMessage(err, "Could not answer that invite."),
      );
    }
  }

  // The signed-in user is restored from localStorage, so the server render has
  // to stay anonymous or React reports a hydration mismatch.
  const hydrated = useHydrated();
  const displayName = hydrated ? (user?.name ?? "there") : "there";
  const avatar = hydrated ? avatarSrc(user?.image) : null;

  // Every league office and team page reads the league from here rather than
  // from its own URL.
  function openLeague(league: ApiLeague) {
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
  }

  /** My Leagues — the user manages this one, so it opens the league office. */
  function enterLeagueOffice(league: ApiLeague) {
    openLeague(league);
    dispatch(setRole("commissioner"));
    router.push("/league-office");
  }

  /** My Team — opens the franchise itself, as its owner. */
  function enterTeam(league: ApiLeague) {
    openLeague(league);
    dispatch(setRole("owner"));
    router.push("/my-team");
  }

  return (
    <div className="min-h-screen bg-brand-soft px-6 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Avora Home</h1>
            <p className="mt-1 text-sm font-semibold text-brand-dark">
              Welcome back, {displayName}. 👋
            </p>
            <p className="mt-0.5 text-sm text-brand-muted">
              Your league hub. Create, join, and manage your leagues.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-forest text-xs font-semibold text-brand-accent">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={displayName}
                  width={36}
                  height={36}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(displayName)
              )}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-brand-dark">
                {displayName}
              </p>
              <p className="text-xs text-brand-muted">
                {user?.email ?? "Demo session"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-white p-7 shadow-card">
            <div className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 rounded-full bg-brand-cta/10 blur-2xl" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand-cta text-brand-cta">
                <FiPlus className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-brand-dark">
                Create a League
              </h2>
              <p className="mt-1.5 max-w-xs text-sm text-brand-muted">
                Start your own league and invite your friends.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-6 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Create League
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-white p-7 shadow-card">
            <div className="flex items-center gap-2">
              <FiMail className="h-4 w-4 text-brand-dark" />
              <h2 className="text-sm font-bold text-brand-dark">
                Pending Invites
              </h2>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-cta/15 px-1.5 text-xs font-semibold text-brand-cta-dark">
                {pendingInvites.length}
              </span>
            </div>

            {pendingInvites.length === 0 ? (
              <p className="mt-6 text-sm text-brand-muted">
                No pending invites right now.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {pendingInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="rounded-lg border border-brand-border px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-brand-dark">
                      {invite.leagueName}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-muted">
                      {invite.season} season
                      {invite.invitedBy ? ` · from ${invite.invitedBy}` : ""}
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <button
                        type="button"
                        disabled={accepting || declining}
                        onClick={() => respond(invite.id, true)}
                        className="rounded-lg bg-brand-cta px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={accepting || declining}
                        onClick={() => respond(invite.id, false)}
                        className="rounded-lg border border-brand-border px-3.5 py-1.5 text-xs font-semibold text-brand-muted transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {inviteError ? (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
              >
                {inviteError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-brand-border bg-white p-7 shadow-card">
          <div className="flex items-center gap-2">
            <FiShield className="h-4 w-4 text-brand-dark" />
            <h2 className="text-sm font-bold text-brand-dark">My Team</h2>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-cta/15 px-1.5 text-xs font-semibold text-brand-cta-dark">
              {myTeams.length}
            </span>
          </div>

          {isLoading ? (
            <p className="mt-6 text-sm text-brand-muted">Loading teams…</p>
          ) : isError ? (
            <p className="mt-6 text-sm font-medium text-red-600">
              {getApiErrorMessage(error, "Could not load your teams.")}
            </p>
          ) : myTeams.length === 0 ? (
            // Joining a league is not the same as holding a franchise, so this
            // says which it is rather than looking like nothing happened.
            <div className="mt-6">
              {waitingLeagues.length > 0 ? (
                <>
                  <p className="text-sm text-brand-muted">
                    You have joined{" "}
                    <span className="font-semibold text-brand-dark">
                      {waitingLeagues.map((l) => l.name).join(", ")}
                    </span>
                    .
                  </p>
                  <p className="mt-1 text-sm text-brand-muted">
                    The commissioner has not assigned you a team yet. Your
                    franchise will appear here once they do.
                  </p>
                </>
              ) : myLeagues.length > 0 ? (
                <p className="text-sm text-brand-muted">
                  You run a league but do not hold a franchise in it. Assign
                  yourself one from User Assignment to manage a team as well.
                </p>
              ) : (
                <p className="text-sm text-brand-muted">
                  You do not own a team yet. Accept a league invite and the
                  commissioner will assign you one.
                </p>
              )}
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-brand-border">
              {myTeams.map((league) => {
                const team = league.team as NonNullable<ApiLeague["team"]>;
                return (
                  <li key={team.id}>
                    <button
                      type="button"
                      onClick={() => enterTeam(league)}
                      className="flex w-full items-center justify-between gap-4 py-3.5 text-left transition hover:opacity-80"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {team.logo ? (
                          <Image
                            src={logoSrc(team.logo) as string}
                            alt={team.name}
                            width={44}
                            height={44}
                            unoptimized
                            className="h-11 w-11 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-forest text-base font-bold text-brand-accent">
                            {team.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-brand-dark">
                            {team.name}
                          </p>
                          <p className="truncate text-xs text-brand-muted">
                            {league.name} · {league.season}
                          </p>
                          <p className="truncate text-xs text-brand-muted">
                            {SCORING_TYPE_LABEL[league.scoringType]} ·{" "}
                            {league.teamCount} teams
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-dark">
                        {team.role === "coOwner" ? "Co-Owner" : "Owner"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {myLeagues.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-brand-border bg-white p-7 shadow-card">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-brand-dark">My Leagues</h2>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-cta/15 px-1.5 text-xs font-semibold text-brand-cta-dark">
                {myLeagues.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-brand-muted">
              Leagues you run. Opens the league office.
            </p>

            <ul className="mt-4 divide-y divide-brand-border">
              {myLeagues.map((league) => (
                <li key={league.id}>
                  <button
                    type="button"
                    onClick={() => enterLeagueOffice(league)}
                    className="flex w-full items-center justify-between gap-4 py-3.5 text-left transition hover:opacity-80"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {league.logo ? (
                        <Image
                          src={logoSrc(league.logo) as string}
                          alt={league.name}
                          width={36}
                          height={36}
                          unoptimized
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-forest text-sm font-bold text-brand-accent">
                          {league.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-dark">
                          {league.name}
                        </p>
                        <p className="text-xs text-brand-muted">
                          {league.teamCount} teams · {league.season}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-dark">
                      {league.leagueRole === "coCommissioner"
                        ? "Co-Commissioner"
                        : "Commissioner"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <CreateLeagueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(league) => {
          setModalOpen(false);
          dispatch(setRole("commissioner"));
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
          router.push("/league-office");
        }}
      />
    </div>
  );
}
