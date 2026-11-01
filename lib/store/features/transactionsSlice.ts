import { createSlice } from "@reduxjs/toolkit";

export type TransactionType =
  | "Trade Accepted"
  | "Player Signed"
  | "Player Waived"
  | "Free Agent Signed"
  | "Draft Pick Traded";

export type TransactionCategory =
  | "Trades"
  | "Signings"
  | "Waivers";

export type TransactionItem = {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  teams?: string;
  description: string;
  date: string;
  mine?: boolean;
};

export type PickProtectionKind = "top10" | "lottery" | "swap" | "unprotected";

export type DraftPickAsset = {
  id: string;
  year: number;
  round: string;
  pick: string;
  source: string;
  protectionKind: PickProtectionKind;
  protectionText: string;
  notes: string;
};

export type TradeException = {
  id: string;
  description: string;
  created: string;
  expires: string;
  amount: number;
  status: "Active" | "Expired" | "Used";
};

type TransactionsState = {
  recent: TransactionItem[];
  draftPicks: DraftPickAsset[];
  tradeExceptions: TradeException[];
  lastSynced: string;
};

const initialState: TransactionsState = {
  recent: [
    {
      id: "1",
      type: "Trade Accepted",
      category: "Trades",
      teams: "Celtics Dynasty ↔ Iron Hawks",
      description: "Celtics Dynasty received J. Randle, D. Vassell",
      date: "May 12, 2:14 PM",
      mine: true,
    },
    {
      id: "2",
      type: "Player Signed",
      category: "Signings",
      description: "Signed A. Simons to 3 yr / $78.6M",
      date: "May 11, 11:52 AM",
      mine: true,
    },
    {
      id: "3",
      type: "Player Waived",
      category: "Waivers",
      description: "Waived M. Beasley",
      date: "May 10, 9:45 AM",
      mine: true,
    },
    {
      id: "4",
      type: "Trade Accepted",
      category: "Trades",
      teams: "Celtics Dynasty ↔ Court Kings",
      description: "Celtics Dynasty received G. Sabonis",
      date: "May 8, 4:21 PM",
      mine: true,
    },
    {
      id: "5",
      type: "Free Agent Signed",
      category: "Signings",
      description: "Baller Bandits signed P. George — 2yr / $104M",
      date: "May 8, 9:10 AM",
    },
    {
      id: "6",
      type: "Draft Pick Traded",
      category: "Trades",
      description: "Iron Hawks sent 2027 1st Round Pick to LA Legends",
      date: "May 6, 3:02 PM",
    },
  ],
  draftPicks: [
    { id: "p1", year: 2025, round: "1st Round", pick: "#14 Overall", source: "Own Pick", protectionKind: "top10", protectionText: "Top 10 protected if conveys, becomes 2027 1st", notes: "Holiday trade alignment" },
    { id: "p2", year: 2025, round: "2nd Round", pick: "#44 Overall", source: "Own Pick", protectionKind: "unprotected", protectionText: "Unprotected", notes: "Retained" },
    { id: "p3", year: 2026, round: "1st Round", pick: "Lottery Pick", source: "Own Pick (via Bos)", protectionKind: "lottery", protectionText: "Top 5 protected, becomes 2027 1st", notes: "Requested A. J. Miller trade" },
    { id: "p4", year: 2026, round: "2nd Round", pick: "Mid-round", source: "Own Pick", protectionKind: "unprotected", protectionText: "Unprotected", notes: "—" },
    { id: "p5", year: 2027, round: "1st Round", pick: "Future Pick", source: "Own Pick", protectionKind: "top10", protectionText: "Top 10 protected if conveys", notes: "Protected swap contingency" },
    { id: "p6", year: 2027, round: "2nd Round", pick: "Late Pick", source: "Own Pick (via Ind)", protectionKind: "unprotected", protectionText: "Unprotected", notes: "Requested I. Pritchard trade" },
    { id: "p7", year: 2028, round: "1st Round", pick: "Future Pick", source: "Own Pick", protectionKind: "unprotected", protectionText: "Unprotected", notes: "Retained" },
    { id: "p8", year: 2028, round: "2nd Round", pick: "Late Pick", source: "Own Pick", protectionKind: "unprotected", protectionText: "Unprotected", notes: "—" },
    { id: "p9", year: 2029, round: "1st Round", pick: "Future Pick", source: "Own Pick", protectionKind: "lottery", protectionText: "Top 14 Protected (Lottery)", notes: "Conveys to swap if triggered" },
    { id: "p10", year: 2029, round: "2nd Round", pick: "Late Pick", source: "Own Pick", protectionKind: "unprotected", protectionText: "Unprotected", notes: "—" },
  ],
  tradeExceptions: [
    { id: "tpe1", description: "Marcus Smart TPE", created: "Jul 6, 2025", expires: "Jul 6, 2026", amount: 12.84, status: "Active" },
    { id: "tpe2", description: "Robert Williams TPE", created: "Feb 8, 2025", expires: "Feb 8, 2026", amount: 6.2, status: "Active" },
    { id: "tpe3", description: "Grant Williams TPE", created: "Sep 20, 2025", expires: "Sep 20, 2026", amount: 4.306281, status: "Active" },
  ],
  lastSynced: "Just now",
};

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {},
});

export default transactionsSlice.reducer;
