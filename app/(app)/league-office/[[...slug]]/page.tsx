import type { ReactElement } from "react";
import LeagueOfficePage from "@/components/commissioner/LeagueOfficePage";
import ActionCenterPage from "@/components/commissioner/ActionCenterPage";
import CommissionerSettingsPage from "@/components/commissioner/CommissionerSettingsPage";
import SalaryCapSettingsPage from "@/components/commissioner/SalaryCapSettingsPage";
import RosterRulesPage from "@/components/commissioner/RosterRulesPage";
import UserAssignmentPage from "@/components/commissioner/UserAssignmentPage";
import TeamManagementPage from "@/components/commissioner/TeamManagementPage";
import RosterManagementPage from "@/components/commissioner/RosterManagementPage";
import SalaryManagementPage from "@/components/commissioner/SalaryManagementPage";
import PlayerImportPage from "@/components/commissioner/PlayerImportPage";
import FreeAgencyManagementPage from "@/components/commissioner/FreeAgencyManagementPage";
import DraftPicksPage from "@/components/commissioner/DraftPicksPage";
import LeagueCalendarPage from "@/components/commissioner/LeagueCalendarPage";
import CommissionerStartupDraft from "@/components/commissioner/CommissionerStartupDraft";
import CommissionerRookieDraft from "@/components/commissioner/CommissionerRookieDraft";
import PagePlaceholder from "@/components/ui/PagePlaceholder";

/** Sub-routes under /league-office — the empty key is the section index. */
const PAGES: Record<string, () => ReactElement> = {
  "": () => <LeagueOfficePage />,
  "action-center": () => <ActionCenterPage />,
  settings: () => <CommissionerSettingsPage />,
  "salary-cap": () => <SalaryCapSettingsPage />,
  "roster-rules": () => <RosterRulesPage />,
  users: () => <UserAssignmentPage />,
  teams: () => <TeamManagementPage />,
  rosters: () => <RosterManagementPage />,
  salaries: () => <SalaryManagementPage />,
  "player-import": () => <PlayerImportPage />,
  "free-agency": () => <FreeAgencyManagementPage />,
  "draft-picks": () => <DraftPicksPage />,
  "startup-draft": () => <CommissionerStartupDraft />,
  "rookie-draft": () => <CommissionerRookieDraft />,
  calendar: () => <LeagueCalendarPage />,
};

function titleize(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const key = slug?.join("/") ?? "";
  const render = PAGES[key];
  if (render) return render();
  return <PagePlaceholder title={titleize(slug?.[slug.length - 1] ?? "")} />;
}
