import { createSlice } from "@reduxjs/toolkit";

export type NewsCategory =
  | "Trade"
  | "Signing"
  | "Waiver"
  | "Extension"
  | "Injury"
  | "Commissioner"
  | "Draft"
  | "League Update"
  | "Rumor";

export type NewsArticle = {
  id: string;
  category: NewsCategory;
  headline: string;
  excerpt: string;
  body: string;
  timeAgo: string;
  timestamp: string;
  tags: string[];
  teams: string[];
  players: string[];
  alert?: boolean;
};

export type LeagueEvent = {
  id: string;
  label: string;
  date: string;
  tone: string;
};

export type CommissionerNotice = {
  id: string;
  date: string;
  body: string;
};

type NewsState = {
  articles: NewsArticle[];
  alerts: string[];
  events: LeagueEvent[];
  notices: CommissionerNotice[];
};

const articles: NewsArticle[] = [
  {
    id: "n1",
    category: "Trade",
    headline: "🔥 BREAKING: Three-Team Trade Reshapes Eastern Conference",
    excerpt:
      "The Iron Hawks acquire Darius Garland from the NY Knickers and send Domantas Sabonis and a 2026 first to the Miami Flames.",
    body: "In a blockbuster deal, the Iron Hawks acquire Darius Garland from the NY Knickers and send Domantas Sabonis and a 2026 first-round pick to the Miami Flames. The trade restructures playoff contention across the Eastern Conference with cap implications estimated at $58M. All three front offices confirmed the swap late Tuesday, and the league office has begun processing the transaction.",
    timeAgo: "3h ago",
    timestamp: "Today, 9:15 AM",
    tags: ["#Multi-Team", "#TradeDeadline", "#CapImpact"],
    teams: ["IND", "NYK", "MIA"],
    players: ["Darius Garland", "Domantas Sabonis"],
    alert: true,
  },
  {
    id: "n2",
    category: "Commissioner",
    headline: "Commissioner Announcement: Trade Deadline ded de Extended to August 12",
    excerpt:
      "The League Commissioner has officially extended the 2025-26 trade deadline by one week to August 12 at 3:00 PM ET.",
    body: "The League Commissioner has officially extended the 2025-26 trade deadline by one week to August 12 at 3:00 PM ET. This extension allows front offices additional time to finalize pending negotiations. All GMs have been notified via league messaging.",
    timeAgo: "5h ago",
    timestamp: "Today, 7:02 AM",
    tags: ["#Official", "#TradeDeadline"],
    teams: [],
    players: [],
  },
  {
    id: "n3",
    category: "Extension",
    headline: "Jayson Tatum Signs 5-Year Veteran Extension with Celtics Dynasty",
    excerpt:
      "Celtics Dynasty locks up their franchise cornerstone. Jayson Tatum has agreed to a five-year veteran extension worth $243,310,000.",
    body: "Celtics Dynasty locks up their franchise cornerstone. Jayson Tatum has agreed to a five-year veteran extension worth $243,310,000, including a player option in the final season. The deal keeps the All-NBA forward in green through 2030-31 and pushes the team into second-apron territory.",
    timeAgo: "18h ago",
    timestamp: "Yesterday, 4:40 PM",
    tags: ["#Extension", "#VeteranExtension"],
    teams: ["BOS"],
    players: ["Jayson Tatum"],
  },
  {
    id: "n4",
    category: "Signing",
    headline: "Bam Adebayo Agrees to 4-Year Deal with Miami Flames",
    excerpt:
      "The Miami Flames have completed the signing of Bam Adebayo to a four-year, $146.4M contract.",
    body: "The Miami Flames have completed the signing of Bam Adebayo to a four-year, $146.4M contract. The center averaged 21.2 points and 10.4 rebounds last season and anchors a retooled Miami front line.",
    timeAgo: "21h ago",
    timestamp: "Yesterday, 1:15 PM",
    tags: ["#Signing", "#FreeAgency"],
    teams: ["MIA"],
    players: ["Bam Adebayo"],
  },
  {
    id: "n5",
    category: "Injury",
    headline: "Kevin Durant Listed as Day-to-Day with Right Ankle Sprain",
    excerpt:
      "LA Legends announced Kevin Durant will miss an estimated 1-2 weeks after suffering a right ankle sprain in Wednesday's scrimmage.",
    body: "LA Legends announced Kevin Durant will miss an estimated 1-2 weeks after suffering a right ankle sprain in Wednesday's scrimmage. He is officially day-to-day and will be re-evaluated at the end of the week.",
    timeAgo: "23h ago",
    timestamp: "Yesterday, 11:00 AM",
    tags: ["#Injury", "#DayToDay"],
    teams: ["LAL"],
    players: ["Kevin Durant"],
    alert: true,
  },
  {
    id: "n6",
    category: "Waiver",
    headline: "Kyle Lowry Placed on Waivers by Miami Flames",
    excerpt:
      "Miami Flames have waived PG Kyle Lowry, clearing $6M in cap space. Lowry, 38, is eligible to be claimed off waivers within 48 hours.",
    body: "Miami Flames have waived PG Kyle Lowry, clearing $6M in cap space. Lowry, 38, is eligible to be claimed off waivers within 48 hours. If unclaimed, he becomes an unrestricted free agent.",
    timeAgo: "1d ago",
    timestamp: "Yesterday, 9:30 AM",
    tags: ["#Waiver", "#CapSpace"],
    teams: ["MIA"],
    players: ["Kyle Lowry"],
  },
  {
    id: "n7",
    category: "Draft",
    headline: "Rookie Draft Order Set — Iron Hawks Land No. 1 Overall",
    excerpt:
      "The lottery results are official. The Iron Hawks jumped three spots to secure the top pick in the upcoming rookie draft.",
    body: "The lottery results are official. The Iron Hawks jumped three spots to secure the top pick in the upcoming rookie draft, followed by Celtics Dynasty at No. 2. The full order is now available on the Draft page.",
    timeAgo: "2d ago",
    timestamp: "2 days ago",
    tags: ["#Draft", "#Lottery"],
    teams: [],
    players: [],
  },
];

const initialState: NewsState = {
  articles,
  alerts: [
    "Trade Deadline: Aug 12, 3PM ET",
    "Roster violations pending review (2 teams)",
    "Salary cap updated for 2026-27 season",
  ],
  events: [
    { id: "e1", label: "Trade Deadline", date: "Aug 12, 2026", tone: "bg-amber-500" },
    { id: "e2", label: "Rookie Draft", date: "Sep 2, 2026", tone: "bg-brand-cta" },
    { id: "e3", label: "Draft Lottery", date: "Sep 8, 2026", tone: "bg-blue-500" },
    { id: "e4", label: "Free Agency Open", date: "Oct 1, 2026", tone: "bg-brand-cta" },
    { id: "e5", label: "Playoffs Begin", date: "Nov 14, 2026", tone: "bg-amber-500" },
    { id: "e6", label: "League Meeting", date: "Dec 5, 2026", tone: "bg-brand-muted" },
  ],
  notices: [
    { id: "c1", date: "Today", body: "Trade deadline extended to Aug 12. All GMs have been notified." },
    { id: "c2", date: "Jul 29", body: "Teams with roster violations must resolve by end of week or face penalties." },
    { id: "c3", date: "Jul 28", body: "2026-27 salary cap officially set at $152.5M by league office." },
  ],
};

const newsSlice = createSlice({
  name: "news",
  initialState,
  reducers: {},
});

export default newsSlice.reducer;
