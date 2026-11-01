import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type PlayerPosition = "PG" | "SG" | "SF" | "PF" | "C";

export type TradePlayer = {
  id: string;
  name: string;
  position: PlayerPosition;
  team: string;
  salary: number;
  years: number;
  age: number;
  hot?: boolean;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
};

export type ListedPlayer = {
  id: string;
  name: string;
  team: string;
  listedAgo: string;
};

export type SavedPlayer = {
  id: string;
  name: string;
  salary: number;
};

export type PendingTradeRequest = {
  playerId: string;
  name: string;
  position: PlayerPosition;
  team: string;
  salary: number;
};

type TradeState = {
  available: TradePlayer[];
  recentlyListed: ListedPlayer[];
  savedPlayers: SavedPlayer[];
  pendingTradeRequest: PendingTradeRequest | null;
};

const available: TradePlayer[] = [
  { id: "tp1", name: "Darius Garland", position: "PG", team: "Court Kings", salary: 32.6, years: 3, age: 25, hot: true, pts: 22.8, reb: 2.7, ast: 7.8, stl: 1.3, blk: 0.2, to: 3.1, fgPct: 46.2, threePct: 38.1, ftPct: 89.2 },
  { id: "tp2", name: "OG Anunoby", position: "SF", team: "Iron Hawks", salary: 26.0, years: 4, age: 27, pts: 18.4, reb: 5.7, ast: 2.9, stl: 1.5, blk: 0.7, to: 1.8, fgPct: 49.1, threePct: 38.6, ftPct: 78.5 },
  { id: "tp3", name: "RJ Barrett", position: "SG", team: "Baller Bandits", salary: 22.7, years: 3, age: 23, pts: 18.1, reb: 4.4, ast: 4.4, stl: 0.8, blk: 0.3, to: 2.8, fgPct: 44.8, threePct: 34.9, ftPct: 81.3 },
  { id: "tp4", name: "Mitchell Robinson", position: "C", team: "Court Kings", salary: 18.6, years: 3, age: 26, pts: 9.2, reb: 11.4, ast: 0.9, stl: 0.6, blk: 2.1, to: 1.4, fgPct: 72.1, threePct: 0, ftPct: 64.2 },
  { id: "tp5", name: "Coby White", position: "PG", team: "Chi Bulls", salary: 12.5, years: 4, age: 25, pts: 19.2, reb: 3.6, ast: 4.9, stl: 0.9, blk: 0.3, to: 3.4, fgPct: 45.6, threePct: 37.9, ftPct: 82.1 },
  { id: "tp6", name: "Nikola Vucevic", position: "C", team: "Chi Bulls", salary: 22.0, years: 2, age: 34, pts: 16.7, reb: 11.2, ast: 2.8, stl: 0.9, blk: 0.8, to: 2.2, fgPct: 51.4, threePct: 34.2, ftPct: 79.6 },
  { id: "tp7", name: "Austin Reaves", position: "SG", team: "LA Legends", salary: 13.5, years: 4, age: 26, hot: true, pts: 15.9, reb: 3.9, ast: 4.8, stl: 1.1, blk: 0.2, to: 2.0, fgPct: 48.7, threePct: 39.4, ftPct: 85.1 },
  { id: "tp8", name: "Cam Whitmore", position: "SF", team: "Court Kings", salary: 6.4, years: 2, age: 20, pts: 16.2, reb: 4.8, ast: 0.8, stl: 0.5, blk: 1.5, to: 1.0, fgPct: 47.3, threePct: 36.1, ftPct: 77.8 },
  { id: "tp9", name: "Miles McBride", position: "PG", team: "Court Kings", salary: 8.5, years: 4, age: 23, pts: 11.8, reb: 2.4, ast: 3.6, stl: 0.7, blk: 0.4, to: 2.3, fgPct: 44.1, threePct: 33.8, ftPct: 80.2 },
  { id: "tp10", name: "Jrue Holiday", position: "PG", team: "Court Kings", salary: 36.1, years: 2, age: 33, pts: 12.8, reb: 5.4, ast: 4.9, stl: 1.4, blk: 0.7, to: 1.6, fgPct: 44.9, threePct: 38.8, ftPct: 83.4 },
  { id: "tp11", name: "Keegan Murray", position: "PF", team: "Dallas Mavs", salary: 8.7, years: 3, age: 24, pts: 15.1, reb: 6.7, ast: 1.6, stl: 1.0, blk: 0.9, to: 1.2, fgPct: 45.5, threePct: 36.4, ftPct: 78.9 },
  { id: "tp12", name: "Walker Kessler", position: "C", team: "Miami Flames", salary: 4.9, years: 2, age: 23, hot: true, pts: 11.2, reb: 12.1, ast: 1.7, stl: 0.6, blk: 2.4, to: 1.3, fgPct: 66.4, threePct: 0, ftPct: 52.1 },
  { id: "tp13", name: "Bennedict Mathurin", position: "SG", team: "LA Legends", salary: 7.2, years: 3, age: 22, pts: 17.4, reb: 4.1, ast: 2.2, stl: 0.6, blk: 0.4, to: 2.1, fgPct: 45.8, threePct: 34.7, ftPct: 82.6 },
  { id: "tp14", name: "Jaden McDaniels", position: "PF", team: "Iron Hawks", salary: 22.5, years: 4, age: 24, pts: 12.6, reb: 5.9, ast: 1.8, stl: 1.2, blk: 1.0, to: 1.1, fgPct: 47.9, threePct: 34.1, ftPct: 74.2 },
  { id: "tp15", name: "Cam Thomas", position: "SG", team: "Baller Bandits", salary: 5.4, years: 2, age: 24, pts: 23.5, reb: 3.2, ast: 3.1, stl: 0.8, blk: 0.4, to: 2.7, fgPct: 43.9, threePct: 36.9, ftPct: 85.7 },
];

const initialState: TradeState = {
  available,
  recentlyListed: [
    { id: "tp7", name: "Austin Reaves", team: "LA Legends", listedAgo: "2h ago" },
    { id: "tp4", name: "M. Robinson", team: "Court Kings", listedAgo: "6h ago" },
    { id: "rl3", name: "Kyle Lowry", team: "Miami Flames", listedAgo: "1d ago" },
  ],
  savedPlayers: [
    { id: "tp4", name: "Mitchell Robinson", salary: 18.0 },
    { id: "tp10", name: "Jrue Holiday", salary: 36.1 },
    { id: "sp3", name: "RJ Barrett", salary: 22.7 },
    { id: "tp2", name: "OG Anunoby", salary: 26.0 },
  ],
  pendingTradeRequest: null,
};

const tradeSlice = createSlice({
  name: "trade",
  initialState,
  reducers: {
    toggleSaved(state, action: PayloadAction<SavedPlayer>) {
      const exists = state.savedPlayers.some((p) => p.id === action.payload.id);
      state.savedPlayers = exists
        ? state.savedPlayers.filter((p) => p.id !== action.payload.id)
        : [...state.savedPlayers, action.payload];
    },
    removeSaved(state, action: PayloadAction<string>) {
      state.savedPlayers = state.savedPlayers.filter(
        (p) => p.id !== action.payload
      );
    },
    requestTrade(state, action: PayloadAction<PendingTradeRequest>) {
      state.pendingTradeRequest = action.payload;
    },
    clearTradeRequest(state) {
      state.pendingTradeRequest = null;
    },
  },
});

export const { toggleSaved, removeSaved, requestTrade, clearTradeRequest } =
  tradeSlice.actions;
export default tradeSlice.reducer;
