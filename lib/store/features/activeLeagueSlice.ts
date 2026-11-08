import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ActiveLeagueRole = "commissioner" | "coCommissioner" | "member";
export type ActiveLeagueVisibility = "private" | "public";

export type ActiveLeague = {
  id: number;
  name: string;
  logo: string | null;
  role: ActiveLeagueRole;
  visibility: ActiveLeagueVisibility;
  hasTeam: boolean;
};

type ActiveLeagueState = {
  current: ActiveLeague | null;
};

// Exported for the same reason as the auth slice: the store merges onto it.
export const activeLeagueInitialState: ActiveLeagueState = { current: null };

// Every league office page needs to know which league it is looking at. The
// id is kept here instead of in each URL, because fifteen pages would
// otherwise have to carry the same query param.
const activeLeagueSlice = createSlice({
  name: "activeLeague",
  initialState: activeLeagueInitialState,
  reducers: {
    setActiveLeague(state, action: PayloadAction<ActiveLeague>) {
      state.current = action.payload;
    },
    clearActiveLeague(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    // Signing out must not leave the next user inside the previous league.
    builder.addCase('auth/logout', () => activeLeagueInitialState);
  },
});

export const { setActiveLeague, clearActiveLeague } =
  activeLeagueSlice.actions;

export const canManageLeague = (league: ActiveLeague | null) =>
  league?.role === "commissioner" || league?.role === "coCommissioner";

export default activeLeagueSlice.reducer;
