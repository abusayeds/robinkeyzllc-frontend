import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type DraftPool = "rookie" | "startup";

export type DraftProspect = {
  id: string;
  name: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  age: number;
  exp: string;
  salary: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgPct: number;
  pool: DraftPool;
};

export type DraftSlot = {
  round: number;
  pick: number;
  overall: number;
  teamId: string;
  prospectId?: string;
};

type DraftState = {
  rookie: DraftProspect[];
  startup: DraftProspect[];
  order: DraftSlot[];
  currentPick: number;
  queue: string[];
  myTeamId: string;
};

const rookie: DraftProspect[] = [
  { id: "rk1", name: "Victor Wembanyama", position: "C", age: 20, exp: "Rookie", salary: 12.2, pts: 21.4, reb: 10.6, ast: 3.9, stl: 1.2, blk: 3.6, fgPct: 46.5, pool: "rookie" },
  { id: "rk2", name: "Scottie Barnes", position: "PF", age: 23, exp: "3 yrs exp", salary: 8.4, pts: 19.9, reb: 8.2, ast: 6.1, stl: 1.3, blk: 1.5, fgPct: 47.5, pool: "rookie" },
  { id: "rk3", name: "Paolo Banchero", position: "PF", age: 22, exp: "2 yrs exp", salary: 11.6, pts: 22.6, reb: 6.9, ast: 5.4, stl: 0.9, blk: 0.6, fgPct: 45.5, pool: "rookie" },
  { id: "rk4", name: "Anthony Edwards", position: "SG", age: 23, exp: "4 yrs exp", salary: 13.5, pts: 25.9, reb: 5.4, ast: 5.1, stl: 1.3, blk: 0.5, fgPct: 46.1, pool: "rookie" },
  { id: "rk5", name: "Jalen Williams", position: "SF", age: 23, exp: "2 yrs exp", salary: 4.8, pts: 19.1, reb: 4.0, ast: 4.5, stl: 1.1, blk: 0.7, fgPct: 54.0, pool: "rookie" },
  { id: "rk6", name: "Chet Holmgren", position: "C", age: 22, exp: "1 yr exp", salary: 10.4, pts: 16.5, reb: 7.9, ast: 2.4, stl: 0.6, blk: 2.3, fgPct: 53.0, pool: "rookie" },
  { id: "rk7", name: "Franz Wagner", position: "SF", age: 23, exp: "3 yrs exp", salary: 5.5, pts: 19.7, reb: 5.3, ast: 3.7, stl: 1.1, blk: 0.5, fgPct: 48.1, pool: "rookie" },
  { id: "rk8", name: "Jabari Smith Jr.", position: "PF", age: 21, exp: "2 yrs exp", salary: 9.3, pts: 13.7, reb: 8.1, ast: 1.6, stl: 0.6, blk: 0.9, fgPct: 45.4, pool: "rookie" },
  { id: "rk9", name: "Keyonte George", position: "PG", age: 21, exp: "1 yr exp", salary: 3.7, pts: 13.0, reb: 2.8, ast: 4.4, stl: 0.7, blk: 0.2, fgPct: 39.6, pool: "rookie" },
  { id: "rk10", name: "Bilal Coulibaly", position: "SF", age: 20, exp: "1 yr exp", salary: 4.6, pts: 8.4, reb: 4.1, ast: 1.7, stl: 0.9, blk: 0.6, fgPct: 43.9, pool: "rookie" },
];

const startup: DraftProspect[] = [
  { id: "su1", name: "Nikola Jokic", position: "C", age: 30, exp: "Vet", salary: 55.2, pts: 26.0, reb: 12.7, ast: 9.0, stl: 1.4, blk: 0.9, fgPct: 58.3, pool: "startup" },
  { id: "su2", name: "Giannis Antetokounmpo", position: "PF", age: 30, exp: "Vet", salary: 54.9, pts: 30.4, reb: 11.5, ast: 6.5, stl: 0.9, blk: 1.1, fgPct: 61.1, pool: "startup" },
  { id: "su3", name: "Luka Doncic", position: "PG", age: 26, exp: "Vet", salary: 43.0, pts: 28.2, reb: 8.1, ast: 7.8, stl: 1.5, blk: 0.5, fgPct: 48.7, pool: "startup" },
  { id: "su4", name: "Shai Gilgeous-Alexander", position: "PG", age: 26, exp: "Vet", salary: 35.9, pts: 30.1, reb: 5.5, ast: 6.2, stl: 2.0, blk: 0.9, fgPct: 53.5, pool: "startup" },
  { id: "su5", name: "Jayson Tatum", position: "SF", age: 27, exp: "Vet", salary: 34.8, pts: 26.9, reb: 8.7, ast: 4.9, stl: 1.0, blk: 0.6, fgPct: 45.3, pool: "startup" },
  { id: "su6", name: "Kevin Durant", position: "SF", age: 36, exp: "Vet", salary: 51.2, pts: 26.6, reb: 6.2, ast: 4.3, stl: 0.9, blk: 1.3, fgPct: 52.5, pool: "startup" },
  { id: "su7", name: "Donovan Mitchell", position: "SG", age: 28, exp: "Vet", salary: 33.2, pts: 24.6, reb: 4.5, ast: 5.0, stl: 1.4, blk: 0.4, fgPct: 45.2, pool: "startup" },
  { id: "su8", name: "Devin Booker", position: "SG", age: 28, exp: "Vet", salary: 33.8, pts: 25.4, reb: 4.1, ast: 7.1, stl: 0.9, blk: 0.3, fgPct: 46.0, pool: "startup" },
  { id: "su9", name: "Anthony Davis", position: "PF", age: 32, exp: "Vet", salary: 43.2, pts: 24.7, reb: 12.6, ast: 3.5, stl: 1.3, blk: 2.3, fgPct: 55.6, pool: "startup" },
  { id: "su10", name: "Tyrese Haliburton", position: "PG", age: 25, exp: "Vet", salary: 42.2, pts: 20.1, reb: 3.9, ast: 10.9, stl: 1.2, blk: 0.7, fgPct: 47.7, pool: "startup" },
  { id: "su11", name: "Jaylen Brown", position: "SG", age: 28, exp: "Vet", salary: 49.2, pts: 24.7, reb: 5.5, ast: 3.6, stl: 1.2, blk: 0.4, fgPct: 47.3, pool: "startup" },
  { id: "su12", name: "Bam Adebayo", position: "C", age: 27, exp: "Vet", salary: 34.8, pts: 19.3, reb: 9.6, ast: 4.0, stl: 1.1, blk: 0.9, fgPct: 51.4, pool: "startup" },
  { id: "su13", name: "Kawhi Leonard", position: "SF", age: 33, exp: "Vet", salary: 46.4, pts: 23.7, reb: 6.1, ast: 3.6, stl: 1.6, blk: 0.6, fgPct: 51.6, pool: "startup" },
  { id: "su14", name: "Damian Lillard", position: "PG", age: 34, exp: "Vet", salary: 45.6, pts: 24.3, reb: 4.4, ast: 7.0, stl: 1.0, blk: 0.3, fgPct: 42.5, pool: "startup" },
  { id: "su15", name: "Kyrie Irving", position: "PG", age: 32, exp: "Vet", salary: 41.0, pts: 24.5, reb: 3.9, ast: 4.9, stl: 1.1, blk: 0.4, fgPct: 47.1, pool: "startup" },
  { id: "su16", name: "Karl-Anthony Towns", position: "C", age: 28, exp: "Vet", salary: 40.0, pts: 21.8, reb: 8.4, ast: 3.0, stl: 0.7, blk: 0.6, fgPct: 50.4, pool: "startup" },
  { id: "su17", name: "Domantas Sabonis", position: "C", age: 28, exp: "Vet", salary: 40.5, pts: 19.4, reb: 13.7, ast: 6.9, stl: 0.9, blk: 0.6, fgPct: 61.7, pool: "startup" },
  { id: "su18", name: "De'Aaron Fox", position: "PG", age: 26, exp: "Vet", salary: 34.8, pts: 26.6, reb: 4.6, ast: 5.6, stl: 2.0, blk: 0.4, fgPct: 48.0, pool: "startup" },
  { id: "su19", name: "Jimmy Butler", position: "SF", age: 34, exp: "Vet", salary: 45.2, pts: 20.8, reb: 5.3, ast: 5.0, stl: 1.3, blk: 0.3, fgPct: 49.9, pool: "startup" },
  { id: "su20", name: "Klay Thompson", position: "SG", age: 34, exp: "Vet", salary: 20.0, pts: 17.9, reb: 3.1, ast: 2.4, stl: 0.6, blk: 0.5, fgPct: 43.2, pool: "startup" },
  { id: "su21", name: "Rudy Gobert", position: "C", age: 31, exp: "Vet", salary: 41.0, pts: 12.8, reb: 12.9, ast: 1.3, stl: 0.7, blk: 2.1, fgPct: 66.1, pool: "startup" },
  { id: "su22", name: "Trae Young", position: "PG", age: 25, exp: "Vet", salary: 40.1, pts: 25.7, reb: 2.8, ast: 10.8, stl: 0.9, blk: 0.1, fgPct: 43.0, pool: "startup" },
  { id: "su23", name: "Paul George", position: "SF", age: 34, exp: "Vet", salary: 45.6, pts: 22.6, reb: 5.2, ast: 3.5, stl: 1.5, blk: 0.4, fgPct: 44.6, pool: "startup" },
  { id: "su24", name: "Zach LaVine", position: "SG", age: 29, exp: "Vet", salary: 43.0, pts: 19.5, reb: 4.2, ast: 3.9, stl: 0.5, blk: 0.3, fgPct: 45.1, pool: "startup" },
];

const TEAM_ORDER = ["s5", "s1", "s3", "s2", "s6", "s7", "s4", "s8"];

function buildOrder(): DraftSlot[] {
  const slots: DraftSlot[] = [];
  let overall = 1;
  for (let round = 1; round <= 3; round += 1) {
    const teams = round % 2 === 1 ? TEAM_ORDER : [...TEAM_ORDER].reverse();
    teams.forEach((teamId, i) => {
      slots.push({ round, pick: i + 1, overall, teamId });
      overall += 1;
    });
  }
  return slots;
}

const order = buildOrder();
// Pre-fill picks before the current one.
const CURRENT = 18; // Round 3, pick 3
const allProspects = [...startup, ...rookie];
for (let i = 0; i < CURRENT; i += 1) {
  order[i].prospectId = allProspects[i % allProspects.length]?.id;
}

const initialState: DraftState = {
  rookie,
  startup,
  order,
  currentPick: CURRENT,
  queue: ["rk1", "rk2", "rk3"],
  myTeamId: "s1",
};

const draftSlice = createSlice({
  name: "draft",
  initialState,
  reducers: {
    draftProspect(state, action: PayloadAction<string>) {
      const slot = state.order[state.currentPick];
      if (!slot || slot.prospectId) return;
      slot.prospectId = action.payload;
      state.queue = state.queue.filter((id) => id !== action.payload);
      if (state.currentPick < state.order.length - 1) state.currentPick += 1;
    },
    queueProspect(state, action: PayloadAction<string>) {
      if (!state.queue.includes(action.payload)) {
        state.queue.push(action.payload);
      }
    },
    unqueueProspect(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((id) => id !== action.payload);
    },
  },
});

export const { draftProspect, queueProspect, unqueueProspect } =
  draftSlice.actions;
export default draftSlice.reducer;
