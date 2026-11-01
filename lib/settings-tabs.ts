import { LEAGUE_CONTENT_TYPES } from "@/lib/store/api";

// The Settings screen's tabs. The sidebar renders them as a dropdown and each
// one is its own route, so this list is what both sides agree on.
export const SETTINGS_TAB_IDS = ["profile", ...LEAGUE_CONTENT_TYPES] as const;

export type SettingsTab = (typeof SETTINGS_TAB_IDS)[number];
