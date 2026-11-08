import type { ReactElement } from "react";
import PlatformOverviewPage from "@/components/platform/PlatformOverviewPage";
import PlatformUsersPage from "@/components/platform/PlatformUsersPage";
import PlatformLeaguesPage from "@/components/platform/PlatformLeaguesPage";
import PlayerBirthdatesPage from "@/components/platform/PlayerBirthdatesPage";
import SettingsPage from "@/components/settings/SettingsPage";
import PagePlaceholder from "@/components/ui/PagePlaceholder";

/** Sub-routes under /platform — the empty key is the section index. */
const PAGES: Record<string, () => ReactElement> = {
  "": () => <PlatformOverviewPage />,
  users: () => <PlatformUsersPage />,
  leagues: () => <PlatformLeaguesPage />,
  birthdates: () => <PlayerBirthdatesPage />,
  // The platform admin gets the profile card only. The other tabs are the
  // information pages of one league, and there is no league here.
  settings: () => <SettingsPage tab="profile" />,
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
