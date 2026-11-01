import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AdminProfile = {
  fullName: string;
  email: string;
  role: string;
  memberSince: string;
};

export type SettingsTab =
  | "profile"
  | "help"
  | "privacy"
  | "terms"
  | "about";

export const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "profile", label: "Admin Profile" },
  { id: "help", label: "Help & Support" },
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Term & Conditions" },
  { id: "about", label: "About Us" },
];

type SettingsState = {
  profile: AdminProfile;
};

const initialState: SettingsState = {
  profile: {
    fullName: "Robin Keyz",
    email: "robin@avora.app",
    role: "Super Admin",
    memberSince: "Jan 2024",
  },
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    updateProfile(state, action: PayloadAction<Partial<AdminProfile>>) {
      state.profile = { ...state.profile, ...action.payload };
    },
  },
});

export const { updateProfile } = settingsSlice.actions;
export default settingsSlice.reducer;
