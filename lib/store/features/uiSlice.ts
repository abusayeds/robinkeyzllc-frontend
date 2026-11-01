import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  sidebarOpen: boolean;
  pageTitle: string;
  /** Team currently being viewed on the Contracts / Draft Picks tabs; null = your own team. */
  contractsViewTeamId: string | null;
};

const initialState: UiState = {
  sidebarOpen: true,
  pageTitle: "Dashboard",
  contractsViewTeamId: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setPageTitle(state, action: PayloadAction<string>) {
      state.pageTitle = action.payload;
    },
    setContractsViewTeamId(state, action: PayloadAction<string | null>) {
      state.contractsViewTeamId = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setPageTitle,
  setContractsViewTeamId,
} = uiSlice.actions;
export default uiSlice.reducer;
