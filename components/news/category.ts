import type { NewsCategory } from "@/lib/store/api/endpoints/newsApi";

type Style = { badge: string; border: string; label: string };

export const CATEGORY_STYLE: Record<NewsCategory, Style> = {
  Trade: {
    badge: "bg-blue-100 text-blue-700",
    border: "border-l-blue-500",
    label: "Trade",
  },
  Signing: {
    badge: "bg-blue-100 text-blue-700",
    border: "border-l-blue-500",
    label: "Signing",
  },
  Waiver: {
    badge: "bg-amber-100 text-amber-700",
    border: "border-l-amber-500",
    label: "Waiver",
  },

  Injury: {
    badge: "bg-red-100 text-red-700",
    border: "border-l-red-500",
    label: "Injury",
  },
  Commissioner: {
    badge: "bg-brand-soft text-brand-forest",
    border: "border-l-transparent",
    label: "Commissioner",
  },
  Draft: {
    badge: "bg-purple-100 text-purple-700",
    border: "border-l-purple-500",
    label: "Draft",
  },
  "League Update": {
    badge: "bg-brand-soft text-brand-muted",
    border: "border-l-brand-border",
    label: "League Update",
  },

};

// One tab per category that has a source behind it. Extensions, Salary
// Cap and Rumors were in this list with nothing to fill them: AVORA has
// no extension event, no rumour mill, and a cap change is a setting
// rather than something that happens.
export const FILTER_TABS = [
  "All News",
  "Trades",
  "Signings",
  "Waivers",
  "Draft",
  "Injuries",
  "League Updates",
  "Commissioner",
] as const;

export function categoryMatchesFilter(cat: NewsCategory, filter: string) {
  if (filter === "All News") return true;
  const map: Record<string, NewsCategory> = {
    Trades: "Trade",
    Signings: "Signing",
    Waivers: "Waiver",
    Draft: "Draft",
    Injuries: "Injury",
    "League Updates": "League Update",
    Commissioner: "Commissioner",
  };
  return map[filter] === cat;
}
