"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiMoreVertical } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  removePlatformUser,
  setUserRole,
  type PlatformRole,
  type PlatformUser,
} from "@/lib/store/features/platformSlice";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function roleTone(r: PlatformRole) {
  return r === "Commissioner"
    ? "bg-violet-100 text-violet-700"
    : "bg-brand-cta/15 text-brand-cta-dark";
}

function RowMenu({ user }: { user: PlatformUser }) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const nextRole: PlatformRole =
    user.role === "Commissioner" ? "Owner" : "Commissioner";

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
            onClick={() => setOpen(false)}
            className="block w-full px-3 py-2 text-left text-brand-dark hover:bg-brand-soft"
          >
            View profile
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(setUserRole({ id: user.id, role: nextRole }));
              setOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-brand-dark hover:bg-brand-soft"
          >
            Make {nextRole}
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(removePlatformUser(user.id));
              setOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-red-500 hover:bg-red-50"
          >
            Remove user
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function PlatformUsersPage() {
  const users = useAppSelector((s) => s.platform.users);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | PlatformRole>("All");
  const [sort, setSort] = useState<"Newest" | "Name">("Newest");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = users.filter((u) => {
      if (roleFilter !== "All" && u.role !== roleFilter) return false;
      if (q && !u.name.toLowerCase().includes(q) && !u.email.includes(q))
        return false;
      return true;
    });
    if (sort === "Name")
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [users, query, roleFilter, sort]);

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leagues or commissioners..."
            className="w-full rounded-lg border border-brand-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) =>
            setRoleFilter(e.target.value as "All" | PlatformRole)
          }
          className="rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
        >
          <option value="All">All Roles</option>
          <option value="Commissioner">Commissioner</option>
          <option value="Owner">Owner</option>
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
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-semibold text-violet-700">
                        {initials(u.name)}
                      </span>
                      <span className="font-semibold text-brand-dark">
                        {u.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-brand-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleTone(
                        u.role,
                      )}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-brand-dark">
                    {String(u.leagues).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-3 text-brand-muted">{u.created}</td>
                  <td className="px-5 py-3">
                    <RowMenu user={u} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-brand-muted"
                  >
                    No users match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-brand-muted">
        Showing {rows.length} of {users.length} users
      </p>
    </div>
  );
}
