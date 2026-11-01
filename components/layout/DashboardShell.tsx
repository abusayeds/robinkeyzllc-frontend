"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { useHydrated } from "@/lib/useHydrated";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";
import MobileBottomNavCommissioner from "./MobileBottomNavCommissioner";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const role = useAppSelector((state) => state.auth.role);
  const adminViewingLeague = useAppSelector(
    (state) => state.platform.adminViewingLeague
  );
  // Same reason as in Sidebar: the role comes from localStorage, so the server
  // render has to stay role-neutral.
  const hydrated = useHydrated();
  const isOwner = hydrated && role === "owner";
  const isCommissioner =
    hydrated &&
    (role === "commissioner" || (role === "admin" && !!adminViewingLeague));

  return (
    <div className="flex h-screen overflow-hidden bg-brand-soft">
      <Sidebar
        open={navOpen}
        onClose={() => setNavOpen(false)}
        hideMobileDrawer={isOwner}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          onOpenMenu={() => setNavOpen(true)}
          hideMenuButton={isOwner}
        />
        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 ${
            isOwner || isCommissioner ? "pb-24 lg:pb-8" : ""
          }`}
        >
          {children}
        </main>
      </div>
      {isOwner ? <MobileBottomNav /> : null}
      {isCommissioner ? <MobileBottomNavCommissioner /> : null}
    </div>
  );
}
