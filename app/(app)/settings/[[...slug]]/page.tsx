import { redirect } from "next/navigation";
import SettingsPage from "@/components/settings/SettingsPage";
import { SETTINGS_TAB_IDS, type SettingsTab } from "@/lib/settings-tabs";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;

  // /settings on its own opens the profile tab.
  if (!slug?.length) redirect("/settings/profile");

  const tab = slug[0] as SettingsTab;
  if (slug.length > 1 || !SETTINGS_TAB_IDS.includes(tab)) {
    redirect("/settings/profile");
  }

  return <SettingsPage tab={tab} />;
}
