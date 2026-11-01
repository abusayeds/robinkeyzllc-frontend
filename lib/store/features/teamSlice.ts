import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UpcomingEvent = {
  id: string;
  title: string;
  date: string;
};

export type IntelStatus = "Contending" | "Rebuilding" | "Buying" | "Selling";

type TeamState = {
  name: string;
  ownerName: string;
  role: string;
  record: string;
  rank: string;
  conferenceRank: string;
  standingsUpdatedAt: string;
  capStatus: string;
  capNote: string;
  totalSalary: string;
  capSpace: string;
  intelStatus: IntelStatus | null;
  upcomingEvents: UpcomingEvent[];
};

const initialState: TeamState = {
  name: "Celtics Dynasty",
  ownerName: "GM Robin Keyz",
  role: "Team Owner",
  record: "47-35",
  rank: "6th",
  conferenceRank: "4th",
  standingsUpdatedAt: "Sep 12, 2025 at 10:24 AM",
  capStatus: "Under Cap",
  capNote: "$18.65M below salary cap",
  totalSalary: "$142.78M",
  capSpace: "$28.58M",
  intelStatus: null,
  upcomingEvents: [
    { id: "1", title: "Roster lock deadline", date: "Mar 12" },
    { id: "2", title: "Trade deadline", date: "Mar 18" },
    { id: "3", title: "Playoff seeding", date: "Mar 25" },
    { id: "4", title: "Draft lottery", date: "Apr 02" },
  ],
};

const teamSlice = createSlice({
  name: "team",
  initialState,
  reducers: {
    updateStandings(
      state,
      action: PayloadAction<{ wins: number; losses: number; ties: number }>
    ) {
      const { wins, losses, ties } = action.payload;
      state.record = ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
      state.standingsUpdatedAt = "Just now";
    },
    setIntelStatus(state, action: PayloadAction<IntelStatus | null>) {
      state.intelStatus = action.payload;
    },
  },
});

export const { updateStandings, setIntelStatus } = teamSlice.actions;
export default teamSlice.reducer;
