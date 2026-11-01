"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FiFile, FiCamera, FiTrash2 } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setUser } from "@/lib/store/features/authSlice";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import { type SettingsTab } from "@/lib/settings-tabs";
import {
  API_URL,
  LEAGUE_CONTENT_LABEL,
  UPLOAD_ACCEPT_IMAGE,
  getApiErrorMessage,
  useChangePasswordMutation,
  useLeagueContentQuery,
  useSaveLeagueContentMutation,
  useUpdateMyProfileMutation,
  useUploadFileMutation,
  validateUploadFile,
  type LeagueContentType,
} from "@/lib/store/api";

const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30 disabled:bg-brand-soft/50";

const primaryBtn =
  "rounded-lg bg-brand-cta px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50";

// Stored paths are relative so they survive a change of domain, which means
// the origin has to be put back in front of them when rendering.
const ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

const imageSrc = (path: string | null | undefined) =>
  path && path.startsWith("/public/") ? `${ORIGIN}${path}` : path || null;

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function Message({ text, tone }: { text: string; tone: "ok" | "bad" }) {
  return (
    <p
      role={tone === "bad" ? "alert" : "status"}
      className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${
        tone === "bad"
          ? "border border-red-200 bg-red-50 text-red-600"
          : "border border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {text}
    </p>
  );
}

function ProfileCard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const activeLeague = useAppSelector((s) => s.activeLeague.current);

  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation();
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    image: user?.image ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The profile arrives from the session, which can be restored after this
  // component first renders.
  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      phone: user.phone ?? "",
      image: user.image ?? null,
    });
  }, [user]);

  // Which profile this is depends on the league the user is currently in,
  // because the same account is a commissioner in one and an owner in another.
  const heading = useMemo(() => {
    if (user?.role === "superAdmin") return "Admin Profile";
    if (activeLeague?.role === "commissioner") return "Commissioner Profile";
    if (activeLeague?.role === "coCommissioner")
      return "Co-Commissioner Profile";
    if (activeLeague?.hasTeam) return "Team Owner Profile";
    return "My Profile";
  }, [user?.role, activeLeague]);

  const roleLabel = useMemo(() => {
    if (user?.role === "superAdmin") return "Super Admin";
    if (!activeLeague) return "Member";
    if (activeLeague.role === "commissioner")
      return `Commissioner · ${activeLeague.name}`;
    if (activeLeague.role === "coCommissioner")
      return `Co-Commissioner · ${activeLeague.name}`;
    return `Team Owner · ${activeLeague.name}`;
  }, [user?.role, activeLeague]);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "—";

  const dirty =
    form.name.trim() !== (user?.name ?? "") ||
    form.phone.trim() !== (user?.phone ?? "") ||
    (form.image ?? null) !== (user?.image ?? null);

  async function pickImage(file: File | undefined) {
    setError(null);
    setDone(false);
    if (!file) return;

    const invalid = validateUploadFile(file, UPLOAD_ACCEPT_IMAGE);
    if (invalid) {
      setError(invalid);
      return;
    }

    try {
      // Two steps on purpose: the file goes to the upload API, and only the
      // path it returns is stored on the profile.
      const uploaded = await uploadFile(file).unwrap();
      setForm((f) => ({ ...f, image: uploaded.path }));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not upload the picture."));
    }
  }

  async function save() {
    setError(null);
    setDone(false);
    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        image: form.image,
      }).unwrap();
      dispatch(setUser(updated));
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save your profile."));
    }
  }

  const preview = imageSrc(form.image);

  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 shadow-card">
      <h2 className="text-base font-semibold text-brand-dark">{heading}</h2>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative">
          {preview ? (
            <Image
              src={preview}
              alt={form.name || "Profile picture"}
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-forest text-sm font-semibold text-brand-accent">
              {initials(form.name)}
            </span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile picture"
            className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-brand-cta p-1.5 text-white transition hover:bg-brand-cta-dark disabled:opacity-60"
          >
            <FiCamera className="h-3 w-3" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={UPLOAD_ACCEPT_IMAGE}
            hidden
            onChange={(e) => {
              pickImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-dark">
            {form.name || "Unnamed"}
          </p>
          <p className="truncate text-xs font-medium text-brand-cta-dark">
            {roleLabel}
          </p>
          <p className="text-[11px] text-brand-muted">
            Member since {memberSince}
          </p>
          {uploading ? (
            <p className="text-[11px] text-brand-muted">Uploading…</p>
          ) : form.image ? (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, image: null }))}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-red-500 hover:underline"
            >
              <FiTrash2 className="h-3 w-3" />
              Remove picture
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="profile-name"
            className="mb-1 block text-xs font-medium text-brand-dark"
          >
            Full Name
          </label>
          <input
            id="profile-name"
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
            maxLength={80}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="profile-phone"
            className="mb-1 block text-xs font-medium text-brand-dark"
          >
            Phone
          </label>
          <input
            id="profile-phone"
            value={form.phone}
            onChange={(e) =>
              setForm((f) => ({ ...f, phone: e.target.value }))
            }
            maxLength={30}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="profile-email"
            className="mb-1 block text-xs font-medium text-brand-dark"
          >
            Email Address
          </label>
          <input
            id="profile-email"
            type="email"
            value={user?.email ?? ""}
            disabled
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-brand-muted">
            The sign-in email cannot be changed here.
          </p>
        </div>
      </div>

      {error ? <Message text={error} tone="bad" /> : null}
      {done ? <Message text="Profile saved." tone="ok" /> : null}

      <div className="mt-5">
        <button
          type="button"
          disabled={!dirty || saving || uploading}
          onClick={save}
          className={primaryBtn}
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof pw, v: string) =>
    setPw((p) => ({ ...p, [k]: v }));

  const strongEnough =
    pw.next.length >= 8 && /\d/.test(pw.next) && /[^A-Za-z0-9]/.test(pw.next);
  const canSubmit =
    pw.current.length > 0 && strongEnough && pw.next === pw.confirm;

  async function submit() {
    setError(null);
    setDone(false);
    try {
      await changePassword({
        oldPassword: pw.current,
        newPassword: pw.next,
        confirmPassword: pw.confirm,
      }).unwrap();
      setPw({ current: "", next: "", confirm: "" });
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not change your password."));
    }
  }

  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 shadow-card">
      <h2 className="text-base font-semibold text-brand-dark">
        Change Password
      </h2>

      <div className="mt-4 space-y-4">
        {(
          [
            ["current", "Current Password"],
            ["next", "New Password"],
            ["confirm", "Confirm New Password"],
          ] as [keyof typeof pw, string][]
        ).map(([k, label]) => (
          <div key={k}>
            <label
              htmlFor={`pw-${k}`}
              className="mb-1 block text-xs font-medium text-brand-dark"
            >
              {label}
            </label>
            <input
              id={`pw-${k}`}
              type="password"
              value={pw[k]}
              onChange={(e) => set(k, e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
        ))}
      </div>

      <p className="mt-2 text-[11px] text-brand-muted">
        Password must be at least 8 characters and include a number and special
        character.
      </p>
      {pw.confirm.length > 0 && pw.next !== pw.confirm ? (
        <p className="mt-1 text-[11px] text-red-500">Passwords do not match.</p>
      ) : null}

      {error ? <Message text={error} tone="bad" /> : null}
      {done ? <Message text="Password updated." tone="ok" /> : null}

      <div className="mt-5">
        <button
          type="button"
          disabled={!canSubmit || isLoading}
          onClick={submit}
          className={primaryBtn}
        >
          {isLoading ? "Updating…" : "Update Password"}
        </button>
      </div>
    </div>
  );
}

function ContentTab({ type }: { type: LeagueContentType }) {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);

  const {
    data: entries,
    isLoading,
    isError,
    error: loadError,
  } = useLeagueContentQuery(leagueId as number, { skip: !leagueId });
  const [saveContent, { isLoading: saving }] = useSaveLeagueContentMutation();

  const entry = entries?.find((e) => e.type === type);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Reset the editor whenever the loaded text or the chosen tab changes, so
  // an unsaved draft is never shown under the wrong heading.
  useEffect(() => {
    setDraft(entry?.description ?? "");
    setError(null);
    setDone(false);
  }, [entry?.description, type]);

  if (!leagueId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FiFile className="h-8 w-8 text-brand-muted" />
        <p className="mt-3 text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 max-w-sm text-xs text-brand-muted">
          These pages are written separately for each league. Open a league
          from Avora Home first.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p className="py-20 text-center text-sm text-brand-muted">Loading…</p>
    );
  }

  if (isError) {
    return (
      <p className="py-20 text-center text-sm font-medium text-red-600">
        {getApiErrorMessage(loadError, "Could not load this page.")}
      </p>
    );
  }

  const label = LEAGUE_CONTENT_LABEL[type];
  const dirty = draft !== (entry?.description ?? "");

  async function save() {
    setError(null);
    setDone(false);
    try {
      await saveContent({
        leagueId: leagueId as number,
        type,
        description: draft,
      }).unwrap();
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save this page."));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-brand-dark">{label}</h2>
          <p className="mt-0.5 text-xs text-brand-muted">
            {canEdit
              ? `Shown to everyone in ${activeLeague?.name}.`
              : `Written by the commissioner of ${activeLeague?.name}.`}
          </p>
        </div>
        {entry?.source === "platform" ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            Using the AVORA default
          </span>
        ) : entry?.source === "league" ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            League specific
          </span>
        ) : null}
      </div>

      {canEdit ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={16}
            maxLength={20000}
            placeholder={`Write the ${label} content for this league. Basic HTML is accepted.`}
            className="mt-4 w-full rounded-lg border border-brand-border bg-white px-3.5 py-3 font-mono text-xs leading-relaxed text-brand-dark outline-none transition focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20"
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[11px] text-brand-muted">
              {draft.length.toLocaleString()} / 20,000 characters
            </p>
            {entry?.updatedBy && entry.updatedAt ? (
              <p className="text-[11px] text-brand-muted">
                Last edited by {entry.updatedBy.name} on{" "}
                {new Date(entry.updatedAt).toLocaleDateString()}
              </p>
            ) : null}
          </div>

          {error ? <Message text={error} tone="bad" /> : null}
          {done ? <Message text={`${label} saved.`} tone="ok" /> : null}

          <div className="mt-4 flex justify-end gap-3">
            {dirty ? (
              <button
                type="button"
                onClick={() => setDraft(entry?.description ?? "")}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
              >
                Discard
              </button>
            ) : null}
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={save}
              className={primaryBtn}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </>
      ) : draft ? (
        <div
          className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-brand-dark"
          // The commissioner of this league is the only author, and the text
          // is shown back only to that same league's members.
          dangerouslySetInnerHTML={{ __html: draft }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FiFile className="h-8 w-8 text-brand-muted" />
          <p className="mt-3 text-sm font-semibold text-brand-dark">
            Nothing written yet
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            The commissioner has not added {label} for this league.
          </p>
        </div>
      )}
    </div>
  );
}

// Which tab is open comes from the route, because the sidebar dropdown is
// what navigates between them.
export default function SettingsPage({ tab }: { tab: SettingsTab }) {
  if (tab === "profile") {
    return (
      <div className="grid gap-4 pb-12 xl:grid-cols-2">
        <ProfileCard />
        <ChangePasswordCard />
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-card">
        <ContentTab type={tab} />
      </div>
    </div>
  );
}
