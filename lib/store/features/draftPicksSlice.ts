import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type PickStatus = "Unprotected" | "Protected";

export type DraftPickAsset = {
  id: string;
  year: string;
  round: "1st Round" | "2nd Round";
  currentOwner: string;
  currentAbbr: string;
  currentLogo: string;
  originalOwner: string;
  originalLogo: string;
  status: PickStatus;
  note: string;
  history: { toTeam: string; reason: string }[];
};

const TEAMS: [string, string][] = [
  ["Boston Celtics", "BOS"],
  ["New York Knicks", "NYK"],
  ["Miami Heat", "MIA"],
  ["Chicago Bulls", "CHI"],
  ["Utah Jazz", "UTA"],
  ["Los Angeles Lakers", "LAL"],
  ["Golden State Warriors", "GSW"],
  ["Dallas Mavericks", "DAL"],
  ["Phoenix Suns", "PHX"],
  ["Denver Nuggets", "DEN"],
  ["LA Clippers", "LAC"],
];

export const PICK_TEAMS = TEAMS.map(([name]) => name);

const LOGOS = [
  "/image/team1.png",
  "/image/team2.png",
  "/image/team3.png",
  "/image/team4.png",
  "/image/team5.png",
];

function logoFor(name: string) {
  const i = TEAMS.findIndex(([n]) => n === name);
  return LOGOS[(i < 0 ? 0 : i) % LOGOS.length];
}

function abbrFor(name: string) {
  return TEAMS.find(([n]) => n === name)?.[1] ?? name.slice(0, 3).toUpperCase();
}

function pick(
  year: string,
  round: DraftPickAsset["round"],
  current: string,
  original: string,
  status: PickStatus,
  note: string,
): DraftPickAsset {
  return {
    id: nanoid(6),
    year,
    round,
    currentOwner: current,
    currentAbbr: abbrFor(current),
    currentLogo: logoFor(current),
    originalOwner: original,
    originalLogo: logoFor(original),
    status,
    note,
    history: [],
  };
}

function generateYear(year: string, count: number): DraftPickAsset[] {
  const out: DraftPickAsset[] = [];
  let seed = 0;
  for (let i = 0; i < year.length; i += 1) seed += year.charCodeAt(i);
  for (let i = 0; i < count; i += 1) {
    const s = (seed + i * 37) % TEAMS.length;
    const o = (seed + i * 13 + 3) % TEAMS.length;
    const round: DraftPickAsset["round"] = i % 3 === 0 ? "1st Round" : "2nd Round";
    const traded = s !== o;
    out.push(
      pick(
        year,
        round,
        TEAMS[s][0],
        TEAMS[o][0],
        traded && i % 2 === 0 ? "Protected" : "Unprotected",
        traded ? (i % 4 === 0 ? "Top 10 protected" : "") : "",
      ),
    );
  }
  return out;
}

type DraftPicksState = {
  picksByYear: Record<string, DraftPickAsset[]>;
  years: string[];
};

const y2627: DraftPickAsset[] = [
  pick("2026-2027", "1st Round", "Miami Heat", "Boston Celtics", "Unprotected", ""),
  pick("2026-2027", "1st Round", "Los Angeles Lakers", "Golden State Warriors", "Protected", "Top 10 protected"),
  pick("2026-2027", "2nd Round", "New York Knicks", "New York Knicks", "Unprotected", ""),
  pick("2026-2027", "2nd Round", "Phoenix Suns", "LA Clippers", "Unprotected", ""),
  pick("2026-2027", "2nd Round", "Boston Celtics", "Boston Celtics", "Unprotected", ""),
  pick("2026-2027", "2nd Round", "Utah Jazz", "Utah Jazz", "Protected", "Acquired by DAL"),
  pick("2026-2027", "2nd Round", "Chicago Bulls", "Chicago Bulls", "Protected", ""),
  pick("2026-2027", "2nd Round", "Dallas Mavericks", "Utah Jazz", "Protected", ""),
];

const initialState: DraftPicksState = {
  years: [
    "2025-2026",
    "2026-2027",
    "2027-2028",
    "2028-2029",
    "2029-2030",
    "2030-2031",
    "2031-2032",
  ],
  picksByYear: {
    "2025-2026": generateYear("2025-2026", 6),
    "2026-2027": y2627,
    "2027-2028": generateYear("2027-2028", 10),
    "2028-2029": generateYear("2028-2029", 9),
    "2029-2030": generateYear("2029-2030", 8),
    "2030-2031": generateYear("2030-2031", 7),
    "2031-2032": generateYear("2031-2032", 6),
  },
};

const draftPicksSlice = createSlice({
  name: "draftPicks",
  initialState,
  reducers: {
    reassignPick(
      state,
      action: PayloadAction<{ id: string; toTeam: string; reason: string }>,
    ) {
      for (const list of Object.values(state.picksByYear)) {
        const p = list.find((x) => x.id === action.payload.id);
        if (p) {
          p.currentOwner = action.payload.toTeam;
          p.currentAbbr = abbrFor(action.payload.toTeam);
          p.currentLogo = logoFor(action.payload.toTeam);
          p.note = action.payload.reason || p.note;
          p.history.push({
            toTeam: action.payload.toTeam,
            reason: action.payload.reason,
          });
          return;
        }
      }
    },
  },
});

export const { reassignPick } = draftPicksSlice.actions;
export default draftPicksSlice.reducer;
