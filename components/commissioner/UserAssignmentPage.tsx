"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  FiX,
  FiUserPlus,
  FiCheck,
  FiClock,
  FiChevronDown,
} from "react-icons/fi";
import TeamLogo from "@/components/ui/TeamLogo";
import Toggle from "@/components/ui/Toggle";
import { useAppSelector } from "@/lib/store/hooks";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import { avatarSrc, initials } from "@/lib/avatar";
import {
  INVITE_STATUS_LABEL,
  getApiErrorMessage,
  useAssignTeamMemberMutation,
  useCancelLeagueInviteMutation,
  useLeagueInvitesQuery,
  useLeagueMembersQuery,
  useLeagueTeamsQuery,
  useRemoveTeamMemberMutation,
  useSearchUsersQuery,
  useSendLeagueInviteMutation,
  type LeagueMember,
  type Team,
  type TeamRole,
  type UserSearchHit,
} from "@/lib/store/api";

function Avatar({
  name,
  image,
  className = "h-6 w-6 text-[11px]",
}: {
  name: string;
  image: string | null;
  className?: string;
}) {
  const src = avatarSrc(image);
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-semibold text-brand-muted ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={32}
          height={32}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-brand-dark">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted transition hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex justify-end gap-3 border-t border-brand-border px-5 py-3.5">
          {footer}
        </div>
      </div>
    </div>
  );
}

/** Picks from the league's own members — only they can hold a team. */
function MemberPicker({
  members,
  selected,
  onSelect,
  emptyHint,
}: {
  members: LeagueMember[];
  selected: number | null;
  onSelect: (userId: number) => void;
  emptyHint: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(t) || m.email.toLowerCase().includes(t),
    );
  }, [q, members]);

  return (
    <div>
      <label
        htmlFor="member-search"
        className="mb-1.5 block text-xs font-medium text-brand-dark"
      >
        Search or select a league member
      </label>
      <input
        id="member-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email"
        className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
      />
      <p className="mb-1 mt-3 text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
        League members
      </p>
      <ul className="max-h-56 space-y-0.5 overflow-y-auto">
        {filtered.map((m) => (
          <li key={m.userId}>
            <button
              type="button"
              onClick={() => onSelect(m.userId)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition ${
                selected === m.userId
                  ? "bg-brand-cta/10 text-brand-cta-dark"
                  : "hover:bg-brand-soft"
              }`}
            >
              <Avatar name={m.name} image={m.image} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-brand-dark">
                  {m.name}
                </span>
                <span className="block truncate text-xs text-brand-muted">
                  {m.email}
                </span>
              </span>
              {m.hasTeam ? (
                <span className="shrink-0 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-muted">
                  Has a team
                </span>
              ) : null}
            </button>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="px-2 py-3 text-xs text-brand-muted">
            {members.length === 0 ? emptyHint : "No member matches that."}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function CoOwnerControl({
  team,
  members,
  leagueId,
}: {
  team: Team;
  members: LeagueMember[];
  leagueId: number;
}) {
  const [assign, { isLoading: assigning }] = useAssignTeamMemberMutation();
  const [removeMember, { isLoading: removing }] = useRemoveTeamMemberMutation();

  const [enabled, setEnabled] = useState(Boolean(team.coOwner));
  const [error, setError] = useState<string | null>(null);

  // A co-owner cannot also be the owner of the same team.
  const candidates = useMemo(
    () => members.filter((m) => m.userId !== team.owner?.userId),
    [members, team.owner?.userId],
  );

  async function pick(userId: number) {
    setError(null);
    try {
      await assign({ leagueId, teamId: team.id, userId, role: "coOwner" }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not assign that co-owner."));
    }
  }

  async function clear() {
    setError(null);
    try {
      await removeMember({
        leagueId,
        teamId: team.id,
        role: "coOwner",
      }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not remove the co-owner."));
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-brand-border bg-brand-soft/30 p-3.5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-dark">Co-Owner</p>
          <p className="mt-0.5 text-xs text-brand-muted">
            Optional — allow a second user to help manage this franchise.
          </p>
        </div>
        <Toggle
          label="Enable co-owner"
          checked={enabled}
          disabled={assigning || removing}
          onChange={(next) => {
            setEnabled(next);
            if (!next && team.coOwner) clear();
          }}
        />
      </div>

      {enabled ? (
        <div className="mt-3">
          {team.coOwner ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-white px-3 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <Avatar name={team.coOwner.name} image={team.coOwner.image} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-brand-dark">
                    {team.coOwner.name}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-cta-dark">
                    <FiCheck className="h-3 w-3" /> Assigned as co-owner
                  </span>
                </span>
              </span>
              <button
                type="button"
                disabled={removing}
                onClick={clear}
                className="shrink-0 text-xs font-medium text-red-500 transition hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ) : (
            <MemberPicker
              members={candidates}
              selected={null}
              onSelect={pick}
              emptyHint="Invite more users to the league first."
            />
          )}

          {error ? (
            <p
              role="alert"
              className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function InviteModal({
  leagueId,
  leagueName,
  onClose,
}: {
  leagueId: number;
  leagueName: string;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number[]>([]);

  const term = q.trim();
  const { data: hits = [], isFetching } = useSearchUsersQuery(
    { q: term, leagueId },
    { skip: term.length < 2 },
  );

  const [sendInvite, { isLoading: sending }] = useSendLeagueInviteMutation();

  async function invite(hit: UserSearchHit) {
    setError(null);
    try {
      await sendInvite({ leagueId, userId: hit.userId }).unwrap();
      setSent((s) => [...s, hit.userId]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send that invite."));
    }
  }

  return (
    <Modal
      title="Invite to League"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
        >
          Done
        </button>
      }
    >
      <p className="mb-3 text-xs text-brand-muted">{leagueName}</p>

      <label
        htmlFor="invite-search"
        className="mb-1.5 block text-xs font-medium text-brand-dark"
      >
        Search every Avora user
      </label>
      <input
        id="invite-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email"
        className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
      />

      <ul className="mt-3 max-h-56 space-y-0.5 overflow-y-auto">
        {hits.map((hit) => {
          const justSent = sent.includes(hit.userId);
          const blocked = hit.inLeague || hit.invited || justSent;
          return (
            <li key={hit.userId}>
              <button
                type="button"
                disabled={blocked || sending}
                onClick={() => invite(hit)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
              >
                <Avatar name={hit.name} image={hit.image} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-brand-dark">
                    {hit.name}
                  </span>
                  <span className="block truncate text-xs text-brand-muted">
                    {hit.email}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                  {hit.inLeague
                    ? "Member"
                    : hit.invited || justSent
                      ? "Invited"
                      : "Invite"}
                </span>
              </button>
            </li>
          );
        })}
        {term.length >= 2 && !isFetching && hits.length === 0 ? (
          <li className="px-2 py-3 text-xs text-brand-muted">
            No Avora user matches that.
          </li>
        ) : null}
        {term.length < 2 ? (
          <li className="px-2 py-3 text-xs text-brand-muted">
            Type at least 2 characters to search.
          </li>
        ) : null}
      </ul>

      {error ? (
        <p
          role="alert"
          className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      ) : null}
      <p className="mt-2 text-[11px] text-brand-muted">
        They will see the invite on their Avora Home page and can accept or
        decline it.
      </p>
    </Modal>
  );
}

function PendingInvites({
  leagueId,
  canEdit,
}: {
  leagueId: number;
  canEdit: boolean;
}) {
  const { data: invites = [] } = useLeagueInvitesQuery(leagueId);
  const [cancelInvite, { isLoading: cancelling }] =
    useCancelLeagueInviteMutation();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const pending = invites.filter((invite) => invite.status === "pending");
  if (!pending.length) return null;

  async function cancel(userId: number) {
    setError(null);
    try {
      await cancelInvite({ leagueId, userId }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not cancel that invite."));
    }
  }

  return (
    <div className="rounded-xl border border-brand-border bg-white shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-2 px-5 py-3 text-left transition hover:bg-brand-soft/50 ${
          open ? "border-b border-brand-border" : ""
        }`}
      >
        <FiClock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <h2 className="flex-1 text-sm font-semibold text-brand-dark">
          Awaiting a reply ({pending.length})
        </h2>
        <FiChevronDown
          className={`h-4 w-4 shrink-0 text-brand-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <ul
        className={`divide-y divide-brand-border ${open ? "" : "hidden"}`}
      >
        {pending.map((invite) => (
          <li
            key={invite.id}
            className="flex items-center gap-3 px-5 py-3"
          >
            <Avatar name={invite.user.name} image={invite.user.image} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-brand-dark">
                {invite.user.name}
              </p>
              <p className="truncate text-xs text-brand-muted">
                {invite.user.email} · {INVITE_STATUS_LABEL[invite.status]}
              </p>
            </div>
            {canEdit ? (
              <button
                type="button"
                disabled={cancelling}
                onClick={() => cancel(invite.user.userId)}
                className="shrink-0 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted transition hover:bg-brand-soft disabled:opacity-50"
              >
                Cancel
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {open && error ? (
        <p
          role="alert"
          className="px-5 py-3 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function UserAssignmentPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);

  const {
    data: teamData,
    isLoading: teamsLoading,
    isError,
    error: loadError,
  } = useLeagueTeamsQuery(leagueId as number, { skip: !leagueId });

  const { data: members = [], isLoading: membersLoading } =
    useLeagueMembersQuery(leagueId as number, { skip: !leagueId });

  const [assign, { isLoading: assigning }] = useAssignTeamMemberMutation();
  const [removeMember, { isLoading: removing }] = useRemoveTeamMemberMutation();

  const [assignTeamId, setAssignTeamId] = useState<number | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teams = useMemo(() => teamData?.teams ?? [], [teamData]);
  const target = teams.find((t) => t.id === assignTeamId) ?? null;

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to assign its teams.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-20 text-center text-sm font-medium text-red-600">
        {getApiErrorMessage(loadError, "Could not load the teams.")}
      </p>
    );
  }

  if (teamsLoading || membersLoading || !teamData) {
    return (
      <p className="py-20 text-center text-sm text-brand-muted">
        Loading assignments…
      </p>
    );
  }

  const assignedCount = teams.filter((t) => t.owner).length;

  const closeAssign = () => {
    setAssignTeamId(null);
    setPick(null);
    setError(null);
  };

  async function confirm() {
    if (!target || !pick) return;
    setError(null);
    try {
      await assign({
        leagueId: leagueId as number,
        teamId: target.id,
        userId: pick,
        role: "owner",
      }).unwrap();
      closeAssign();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not assign that owner."));
    }
  }

  async function unassign() {
    if (!target) return;
    setError(null);
    try {
      await removeMember({
        leagueId: leagueId as number,
        teamId: target.id,
        role: "owner",
      }).unwrap();
      closeAssign();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not remove the owner."));
    }
  }

  return (
    <div className="space-y-5 pb-12">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">User Assignment</h1>
        <p className="text-sm text-brand-muted">
          {canEdit
            ? "Invite users to the league, then assign them to a franchise."
            : "Franchise assignments are managed by the commissioner."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-muted">
          <span className="font-semibold text-brand-dark">
            {assignedCount}
          </span>{" "}
          of {teams.length} franchises assigned ·{" "}
          <span className="font-semibold text-brand-dark">
            {members.length}
          </span>{" "}
          league member{members.length === 1 ? "" : "s"}
        </p>
        {canEdit ? (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark"
          >
            <FiUserPlus className="h-4 w-4" />
            Invite to League
          </button>
        ) : null}
      </div>

      <PendingInvites leagueId={leagueId} canEdit={canEdit} />

      <div className="rounded-xl border border-brand-border bg-white shadow-card">
        <ul className="divide-y divide-brand-border">
          {teams.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-5 py-3.5">
              <TeamLogo
                name={t.name}
                src={avatarSrc(t.logo) ?? undefined}
                className="h-8 w-8"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-dark">
                  {t.name}
                </p>
                {t.owner ? (
                  <p className="truncate text-xs text-brand-muted">
                    Assigned to: {t.owner.name}
                    {t.coOwner ? ` · Co-Owner: ${t.coOwner.name}` : ""}
                  </p>
                ) : (
                  <p className="text-xs font-medium text-amber-600">
                    Unassigned — no owner
                  </p>
                )}
              </div>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    setPick(t.owner?.userId ?? null);
                    setError(null);
                    setAssignTeamId(t.id);
                  }}
                  className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    t.owner
                      ? "border border-brand-border text-brand-dark hover:bg-brand-soft"
                      : "bg-brand-cta text-white hover:bg-brand-cta-dark"
                  }`}
                >
                  {t.owner ? "Reassign" : "Assign"}
                </button>
              ) : null}
            </li>
          ))}
          {teams.length === 0 ? (
            <li className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-brand-dark">
                No franchises yet
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                Create the teams in Team Management first, then assign them
                here.
              </p>
            </li>
          ) : null}
        </ul>
      </div>

      {target ? (
        <Modal
          title={`${target.owner ? "Reassign" : "Assign"} ${target.name}`}
          onClose={closeAssign}
          footer={
            <>
              {target.owner ? (
                <button
                  type="button"
                  disabled={removing}
                  onClick={unassign}
                  className="mr-auto rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                >
                  Unassign
                </button>
              ) : null}
              <button
                type="button"
                onClick={closeAssign}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !pick || pick === target.owner?.userId || assigning
                }
                onClick={confirm}
                className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assigning ? "Saving…" : "Confirm Assignment"}
              </button>
            </>
          }
        >
          <p className="mb-3 text-xs text-brand-muted">
            Current owner:{" "}
            <span className="font-medium text-brand-dark">
              {target.owner?.name ?? "— none"}
            </span>
          </p>

          <MemberPicker
            members={members}
            selected={pick}
            onSelect={setPick}
            emptyHint="No one has joined this league yet. Invite someone first."
          />

          {error ? (
            <p
              role="alert"
              className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
            >
              {error}
            </p>
          ) : null}

          <CoOwnerControl
            team={target}
            members={members}
            leagueId={leagueId}
          />
        </Modal>
      ) : null}

      {inviteOpen ? (
        <InviteModal
          leagueId={leagueId}
          leagueName={activeLeague?.name ?? "This league"}
          onClose={() => setInviteOpen(false)}
        />
      ) : null}
    </div>
  );
}
