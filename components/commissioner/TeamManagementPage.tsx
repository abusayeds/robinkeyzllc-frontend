"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiX, FiSearch, FiPlus } from "react-icons/fi";
import TeamLogo from "@/components/ui/TeamLogo";
import { useAppSelector } from "@/lib/store/hooks";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import { avatarSrc } from "@/lib/avatar";
import {
  DEFAULT_TEAM_COLOR,
  UPLOAD_ACCEPT_IMAGE,
  getApiErrorMessage,
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useLeagueTeamsQuery,
  useUpdateTeamMutation,
  useUploadFileMutation,
  validateUploadFile,
  type Team,
  type TeamInput,
} from "@/lib/store/api";

type Draft = { name: string; abbr: string; color: string; logo: string | null };

const EMPTY: Draft = {
  name: "",
  abbr: "",
  color: DEFAULT_TEAM_COLOR,
  logo: null,
};

function useLockedScroll(onClose: () => void) {
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
}

function TeamModal({
  editing,
  saving,
  error,
  onClose,
  onSave,
}: {
  editing: Team | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(
    editing
      ? {
          name: editing.name,
          abbr: editing.abbr,
          color: editing.color,
          logo: editing.logo,
        }
      : EMPTY,
  );
  const [logoName, setLogoName] = useState("");
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();

  useLockedScroll(onClose);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  // The logo goes through the upload API and the team stores only the path,
  // so the row never carries an image inside it.
  async function pickLogo(file: File | undefined) {
    setLogoError(null);
    if (!file) return;

    const invalid = validateUploadFile(file, UPLOAD_ACCEPT_IMAGE);
    if (invalid) {
      setLogoError(invalid);
      return;
    }

    try {
      const uploaded = await uploadFile(file).unwrap();
      set("logo", uploaded.path);
      setLogoName(file.name);
    } catch (err) {
      setLogoError(getApiErrorMessage(err, "Could not upload the logo."));
    }
  }

  const logoPreview = avatarSrc(draft.logo);
  const canSave = draft.name.trim().length >= 2 && draft.abbr.trim().length >= 2;

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
          <h2 className="text-sm font-semibold text-brand-dark">
            {editing ? "Edit Team" : "Add New Team"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted transition hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label
              htmlFor="team-name"
              className="mb-1 block text-xs font-medium text-brand-dark"
            >
              Team Name
            </label>
            <input
              id="team-name"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={60}
              placeholder="e.g. Chicago Bulls"
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
            />
          </div>
          <div>
            <label
              htmlFor="team-abbr"
              className="mb-1 block text-xs font-medium text-brand-dark"
            >
              Team Abbreviation
            </label>
            <input
              id="team-abbr"
              value={draft.abbr}
              maxLength={4}
              onChange={(e) => set("abbr", e.target.value.toUpperCase())}
              placeholder="e.g. CHI"
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-brand-cta/30"
            />
            <p className="mt-1 text-[11px] text-brand-muted">
              2 to 4 letters, unique within this league.
            </p>
          </div>
          <div>
            <label
              htmlFor="team-color"
              className="mb-1 block text-xs font-medium text-brand-dark"
            >
              Primary Color
            </label>
            <input
              id="team-color"
              type="color"
              value={draft.color}
              onChange={(e) => set("color", e.target.value)}
              className="h-9 w-16 cursor-pointer rounded border border-brand-border bg-white p-0.5"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-brand-dark">
              Team Logo (optional)
            </p>
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <TeamLogo
                  name={draft.name || "?"}
                  src={logoPreview}
                  className="h-10 w-10"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-xs text-brand-muted">
                  Logo
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept={UPLOAD_ACCEPT_IMAGE}
                className="hidden"
                onChange={(e) => {
                  pickLogo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft disabled:opacity-60"
              >
                {uploading ? "Uploading…" : "Choose File"}
              </button>
              <span className="min-w-0 flex-1 truncate text-xs text-brand-muted">
                {logoName || (draft.logo ? "Current logo" : "No file chosen")}
              </span>
              {draft.logo ? (
                <button
                  type="button"
                  onClick={() => {
                    set("logo", null);
                    setLogoName("");
                  }}
                  className="text-xs font-medium text-red-500 hover:underline"
                >
                  Clear
                </button>
              ) : null}
            </div>
            {logoError ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {logoError}
              </p>
            ) : null}
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-brand-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave || saving || uploading}
            onClick={() => onSave(draft)}
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Save Changes" : "Add Team"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RemoveModal({
  team,
  removing,
  error,
  onClose,
  onConfirm,
}: {
  team: Team;
  removing: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useLockedScroll(onClose);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-brand-dark">
          Remove {team.name}?
        </h2>
        <p className="mt-1 text-sm text-brand-muted">
          This removes the franchise from the league. This cannot be undone.
        </p>

        {team.owner || team.coOwner ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-amber-800">
              This team is assigned
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
              {team.owner ? <li>Owner — {team.owner.name}</li> : null}
              {team.coOwner ? <li>Co-Owner — {team.coOwner.name}</li> : null}
            </ul>
            <p className="mt-1.5 text-xs text-amber-800">
              They will lose this team and can be assigned another.
            </p>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={removing}
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {removing ? "Removing…" : "Remove Team"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamManagementPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);

  const {
    data,
    isLoading,
    isError,
    error: loadError,
  } = useLeagueTeamsQuery(leagueId as number, { skip: !leagueId });

  const [createTeam, { isLoading: creating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: updating }] = useUpdateTeamMutation();
  const [deleteTeam, { isLoading: removing }] = useDeleteTeamMutation();

  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Team | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const teams = useMemo(() => data?.teams ?? [], [data]);

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return teams;
    return teams.filter(
      (x) =>
        x.name.toLowerCase().includes(t) || x.abbr.toLowerCase().includes(t),
    );
  }, [query, teams]);

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to manage its teams.
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

  if (isLoading || !data) {
    return (
      <p className="py-20 text-center text-sm text-brand-muted">
        Loading teams…
      </p>
    );
  }

  const full = teams.length >= data.teamCount;

  const openAdd = () => {
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditing(team);
    setFormError(null);
    setModalOpen(true);
  };

  async function save(draft: Draft) {
    setFormError(null);

    const body: TeamInput = {
      name: draft.name.trim(),
      abbr: draft.abbr.trim().toUpperCase(),
      color: draft.color,
      logo: draft.logo,
    };

    try {
      if (editing) {
        await updateTeam({
          leagueId: leagueId as number,
          teamId: editing.id,
          patch: body,
        }).unwrap();
      } else {
        await createTeam({ leagueId: leagueId as number, team: body }).unwrap();
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not save the team."));
    }
  }

  async function remove(team: Team) {
    setRemoveError(null);
    try {
      await deleteTeam({
        leagueId: leagueId as number,
        teamId: team.id,
      }).unwrap();
      setConfirmRemove(null);
    } catch (err) {
      setRemoveError(getApiErrorMessage(err, "Could not remove the team."));
    }
  }

  return (
    <div className="space-y-4 pb-12">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Team Management</h1>
        <p className="text-sm text-brand-muted">
          {canEdit
            ? "Create the franchises for this league. Owners are assigned from User Assignment."
            : "The franchises in this league are managed by the commissioner."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-muted">
          <span className="font-semibold text-brand-dark">{teams.length}</span>{" "}
          of {data.teamCount} teams created
          {full ? " · limit reached" : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams..."
            aria-label="Search teams"
            className="w-full rounded-lg border border-brand-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
          />
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={openAdd}
            disabled={full}
            title={
              full
                ? `This league is limited to ${data.teamCount} teams. Raise the limit in League Settings.`
                : undefined
            }
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-cta px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlus className="h-4 w-4" />
            Add Team
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-brand-border bg-white shadow-card">
        <ul className="divide-y divide-brand-border">
          {filtered.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-5 py-3.5">
              <span
                aria-hidden
                className="h-8 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              <TeamLogo
                name={t.name}
                src={avatarSrc(t.logo) ?? undefined}
                className="h-8 w-8"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-dark">
                  {t.name}{" "}
                  <span className="text-xs font-medium text-brand-muted">
                    {t.abbr}
                  </span>
                </p>
                {t.owner ? (
                  <p className="truncate text-xs text-brand-muted">
                    Owner: {t.owner.name}
                    {t.coOwner ? ` · Co-Owner: ${t.coOwner.name}` : ""}
                  </p>
                ) : (
                  <p className="text-xs font-medium text-amber-600">
                    Unassigned — no owner yet
                  </p>
                )}
              </div>
              {canEdit ? (
                <>
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="shrink-0 rounded-lg border border-brand-border px-3.5 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveError(null);
                      setConfirmRemove(t);
                    }}
                    className="shrink-0 rounded-lg border border-red-200 px-3.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                  >
                    Remove
                  </button>
                </>
              ) : null}
            </li>
          ))}
          {teams.length === 0 ? (
            <li className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-brand-dark">
                No teams yet
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                {canEdit
                  ? `Add up to ${data.teamCount} franchises, then assign owners from User Assignment.`
                  : "The commissioner has not created any franchises yet."}
              </p>
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-brand-muted">
              No teams match “{query}”.
            </li>
          ) : null}
        </ul>
      </div>

      {modalOpen ? (
        <TeamModal
          editing={editing}
          saving={creating || updating}
          error={formError}
          onClose={() => setModalOpen(false)}
          onSave={save}
        />
      ) : null}

      {confirmRemove ? (
        <RemoveModal
          team={confirmRemove}
          removing={removing}
          error={removeError}
          onClose={() => setConfirmRemove(null)}
          onConfirm={() => remove(confirmRemove)}
        />
      ) : null}
    </div>
  );
}
