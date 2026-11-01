"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiChevronDown, FiLogOut, FiX } from "react-icons/fi";
import {
  commissionerNav,
  navForRole,
  type NavItem,
} from "@/lib/navigation";
import { ROLE_LABEL } from "@/lib/store/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { endSession } from "@/lib/store/session";
import { useHydrated } from "@/lib/useHydrated";

const ROOT_HREFS = new Set([
  "/dashboard",
  "/platform",
  "/league-office",
  "/my-team",
]);

function LogoutConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FiLogOut className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-brand-dark">Log out?</h2>
            <p className="mt-1 text-sm text-brand-muted">
              You&apos;ll be returned to the login page and will need to sign in
              again to continue.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

const linkClass = (active: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
    active
      ? "bg-white/10 font-semibold text-brand-accent"
      : "text-white/75 hover:bg-white/5 hover:text-white"
  }`;

function NavDropdown({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const children = item.children ?? [];
  const activeChild = children.some((child) => pathname === child.href);
  const sectionActive = activeChild || pathname === item.href;

  // Opens itself when one of its pages is showing, and stays wherever the
  // user last put it after that.
  const [open, setOpen] = useState(sectionActive);

  useEffect(() => {
    if (sectionActive) setOpen(true);
  }, [sectionActive]);

  const Icon = item.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full ${linkClass(sectionActive && !open)}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <FiChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <ul className="mt-0.5 space-y-0.5 border-l border-white/10 pl-3 ml-4">
          {children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  className={linkClass(pathname === child.href)}
                >
                  <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{child.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}

function SidebarContent({
  onNavigate,
  headerExtra,
}: {
  onNavigate: () => void;
  headerExtra?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.role);
  const adminViewingLeague = useAppSelector(
    (state) => state.platform.adminViewingLeague
  );
  // The role is read from localStorage, so the server cannot know it. Holding
  // the role-specific markup back for one render keeps the two in agreement.
  const hydrated = useHydrated();
  const nav = !hydrated
    ? []
    : role === "admin" && adminViewingLeague
      ? commissionerNav
      : navForRole(role);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleLogout() {
    setConfirmOpen(false);
    endSession(dispatch);
    router.push("/login");
  }

  return (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="relative h-11 w-11 shrink-0">
          <Image
            src="/image/logo-icon.png"
            alt="AVORA"
            fill
            sizes="44px"
            className="object-contain"
          />
        </span>
        <div className="min-w-0 flex-1">
          <span className="relative block h-5 w-24">
            <Image
              src="/image/avora-wordmark.png"
              alt="AVORA"
              fill
              sizes="96px"
              className="object-contain object-left"
            />
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-accent">
            {hydrated ? ROLE_LABEL[role] : " "}
          </span>
        </div>
        {headerExtra}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {nav.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.14em] text-brand-muted">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                if (item.children?.length) {
                  return (
                    <li key={item.href}>
                      <NavDropdown
                        item={item}
                        pathname={pathname}
                        onNavigate={onNavigate}
                      />
                    </li>
                  );
                }

                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (!ROOT_HREFS.has(item.href) &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={linkClass(active)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
        >
          <FiLogOut className="h-4 w-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>

      {confirmOpen ? (
        <LogoutConfirm
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleLogout}
        />
      ) : null}
    </>
  );
}

export default function Sidebar({
  open,
  onClose,
  hideMobileDrawer = false,
}: {
  open: boolean;
  onClose: () => void;
  hideMobileDrawer?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  return (
    <>
      {/* Desktop: permanent sidebar */}
      <aside className="hidden h-screen w-[260px] shrink-0 flex-col overflow-hidden bg-brand-dark text-white lg:flex">
        <SidebarContent onNavigate={() => {}} />
      </aside>

      {/* Mobile / tablet: slide-in drawer */}
      {hideMobileDrawer ? null : (
        <div
          className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
          aria-hidden={!open}
        >
          <div
            onMouseDown={onClose}
            className={`absolute inset-0 bg-brand-dark/60 transition-opacity ${
              open ? "opacity-100" : "opacity-0"
            }`}
          />
          <aside
            className={`absolute left-0 top-0 flex h-full w-[80vw] max-w-[300px] flex-col overflow-hidden bg-brand-dark text-white shadow-xl transition-transform duration-200 ${
              open ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <SidebarContent
              onNavigate={onClose}
              headerExtra={
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="ml-auto rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <FiX className="h-5 w-5" />
                </button>
              }
            />
          </aside>
        </div>
      )}
    </>
  );
}
