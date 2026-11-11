import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * The one piece of platform state the client owns: which league a Super
 * Admin is standing inside.
 *
 * The user and league lists used to live here as fixtures. They are served
 * by `platformApi` now — `/users/all-user` and `/leagues/all` — so nothing
 * about the platform is held in the store except this.
 */
export type AdminViewingLeague = {
  id: number;
  name: string;
};

type PlatformState = {
  adminViewingLeague: AdminViewingLeague | null;
};

// Exported so the store can rebuild the slice around the one field it
// restores from localStorage.
export const platformInitialState: PlatformState = {
  adminViewingLeague: null,
};
const platformSlice = createSlice({
  name: "platform",
  initialState: platformInitialState,
  reducers: {
    enterLeagueView(state, action: PayloadAction<AdminViewingLeague>) {
      state.adminViewingLeague = action.payload;
    },
    exitLeagueView(state) {
      state.adminViewingLeague = null;
    },
  },
  extraReducers: (builder) => {
    // An admin who was standing inside a league must not still be there when
    // the next account signs in. DashboardShell reads this to decide whether
    // to show the commissioner shell.
    builder.addCase("auth/logout", (state) => {
      state.adminViewingLeague = null;
    });
  },
});

export const { enterLeagueView, exitLeagueView } = platformSlice.actions;
export default platformSlice.reducer;
