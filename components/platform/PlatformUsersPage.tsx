"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiMoreVertical } from "react-icons/fi";
import { getApiErrorMessage } from "@/lib/store/api";
import {
  useDeletePlatformUserMutation,
  usePlatformUsersQuery,
  type PlatformUser,
} from "@/lib/store/api/endpoints/platformApi";
import { avatarSrc, initials } from "@/lib/avatar";
import Image from "next/image";

const ROLES = [
  "All",
  "Commissioner",
  "Co-Commissioner",
  "Owner",
  "Member",
] as const;
type RoleFilter = (typeof ROLES)[number];

const PAGE_SIZE = 20;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function roleTone(role: PlatformUser["leagueRole"]) {
  if (role === "Commissioner") return "bg-violet-100 text-violet-700";
  if (role === "Co-Commissioner") return "bg-blue-100 text-blue-700";
  if (role === "Owner") return "bg-brand-cta/15 text-brand-cta-dark";
  return "bg-brand-soft text-brand-muted";
}

/**
 * The row menu.
 *
 * "Make Commissioner" used to sit here. It cannot: a role in AVORA belongs to
 * a league membership, not to the user, so there is no platform-wide role to
 * grant — it is assigned inside a league, from its User Assignment page.
 */
function RowMenu({
  user,
  onRemove,
  busy,
}: {
  user: PlatformUser;
  onRemove: () => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
      >
        <FiMoreVertical className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-brand-border bg-white py-1 text-sm shadow-lg">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(user.email);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="block w-full px-3 py-2 text-left text-brand-dark hover:bg-brand-soft"
          >
            {copied ? "Copied" : "Copy email"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onRemove();
              setOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-red-500 hover:bg-red-50 disabled:opacity-60"
          >
            Remove user
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function PlatformUsersPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [sort, setSort] = useState<"Newest" | "Name">("Newest");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // The search runs on the server, so it waits for the typing to stop rather
  // than firing a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isFetching } = usePlatformUsersQuery({
    page,
    limit: PAGE_SIZE,
    searchTerm: debounced,
  });

  const [removeUser, { isLoading: removing }] = useDeletePlatformUserMutation();

  const rows = useMemo(() => {
    let list = data?.users ?? [];
    // The role is derived per user, so this one filter stays on the client.
    if (roleFilter !== "All") {
      list = list.filter((user) => user.leagueRole === roleFilter);
    }
    if (sort === "Name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [data, roleFilter, sort]);

  const pagination = data?.pagination;

  async function remove(user: PlatformUser) {
    setError(null);
    try {
      await removeUser(user.id).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not remove that user."));
    }
  }

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name, email or phone..."
            className="w-full rounded-lg border border-brand-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
        >
          {ROLES.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All Roles" : item}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "Newest" | "Name")}
          className="rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
        >
          <option value="Newest">Newest</option>
          <option value="Name">Name A–Z</option>
        </select>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Leagues</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-brand-muted">
                    Loading users…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-brand-muted">
                    No users match this view.
                  </td>
                </tr>
              ) : (
                rows.map((u) => {
                  const avatar = avatarSrc(u.image);
                  return (
                    <tr key={u.id} className={u.isDeleted ? "opacity-60" : ""}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-[11px] font-semibold text-violet-700">
                            {avatar ? (
                              <Image
                                src={avatar}
                                alt={u.name}
                                fill
                                sizes="32px"
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              initials(u.name)
                            )}
                          </span>
                          <span className="font-semibold text-brand-dark">
                            {u.name}
                            {u.role === "superAdmin" ? (
                              <span className="ml-1.5 rounded bg-brand-dark/10 px-1 py-0.5 text-[10px] font-bold text-brand-dark">
                                ADMIN
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-brand-muted">
                        {u.email}
                        {u.isEmailVerified ? null : (
                          <span className="ml-1.5 text-[10px] font-semibold text-amber-600">
                            UNVERIFIED
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleTone(
                            u.leagueRole,
                          )}`}
                        >
                          {u.leagueRole}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-brand-dark">{u.leagues}</td>
                      <td className="px-5 py-3 text-brand-muted">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <RowMenu
                          user={u}
                          busy={removing}
                          onRemove={() => void remove(u)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPage > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-brand-border px-5 py-3 text-xs">
            <span className="text-brand-muted">
              Page {pagination.page} of {pagination.totalPage} ·{" "}
              {pagination.totalItem} users
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-brand-border px-3 py-1.5 font-semibold text-brand-dark transition hover:bg-brand-soft disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-brand-border px-3 py-1.5 font-semibold text-brand-dark transition hover:bg-brand-soft disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
