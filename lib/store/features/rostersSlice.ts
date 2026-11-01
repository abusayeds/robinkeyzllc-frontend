import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type InjuryStatus = "Active" | "Injured" | "Day-to-Day";

export type RosterPlayer = {
  id: string;
  name: string;
  nbaTeam: string;
  pos: string;
  slot: string;
  age: number;
  matchup: string;
  status: InjuryStatus;
  salary: number;
  contractYearsLeft: number;
  ht: string;
  wt: number;
  exp: number;
  draftInfo: string;
  fgPct: number;
  threes: number;
  ftPct: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
};

type RostersState = {
  byTeam: Record<string, RosterPlayer[]>;
};

const NAME_POOL = [
  "Quenton Jackson", "Isaiah Joe", "Derrick White", "Pelle Larsson",
  "RJ Barrett", "Jaylen Clark", "Julian Strawther", "Scottie Barnes",
  "Ryan Dunn", "Payton Pritchard", "James Harden", "Jalen Suggs",
  "Russell Westbrook", "DeMar DeRozan", "Julius Randle", "Domantas Sabonis",
  "Tyrese Maxey", "Franz Wagner", "Jaden McDaniels", "Coby White",
  "Herbert Jones", "Keegan Murray", "Walker Kessler", "Andrew Nembhard",
  "Cam Thomas", "Bennedict Mathurin", "Jalen Williams", "Deni Avdija",
  "Max Strus", "Naz Reid", "Josh Hart", "Alex Caruso",
];

const NBA_TEAMS = [
  "IND", "OKC", "BOS", "MIA", "TOR", "MIN", "DEN", "PHX",
  "LAC", "ORL", "SAC", "DAL", "GSW", "MIL", "NYK", "PHI",
];

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
const SLOTS = ["G", "G", "G", "G", "F", "F", "F", "F", "C", "C", "UTIL", "BN", "BN"];

const TEAM_IDS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];
const ROSTER_SIZE: Record<string, number> = {
  s1: 14, s2: 12, s3: 13, s4: 12, s5: 13, s6: 10, s7: 11, s8: 12,
};

function make(
  id: string,
  seed: number,
  over: Partial<RosterPlayer> = {}
): RosterPlayer {
  return {
    id,
    name: NAME_POOL[seed % NAME_POOL.length],
    nbaTeam: NBA_TEAMS[seed % NBA_TEAMS.length],
    pos: POSITIONS[seed % POSITIONS.length],
    slot: SLOTS[seed % SLOTS.length] ?? "BN",
    age: 21 + (seed % 16),
    matchup: `${seed % 2 ? "vs" : "@"} ${NBA_TEAMS[(seed * 3) % NBA_TEAMS.length]}`,
    status: "Active",
    salary: Number((1.9 + (seed % 38) * 0.92).toFixed(1)),
    contractYearsLeft: 1 + (seed % 4),
    ht: `6'${1 + (seed % 10)}"`,
    wt: 190 + (seed % 60),
    exp: seed % 14,
    draftInfo: `20${13 + (seed % 12)} · R${1 + (seed % 2)} (${1 + (seed % 55)})`,
    fgPct: 0.36 + (seed % 14) / 100,
    threes: seed % 6,
    ftPct: 0.7 + (seed % 30) / 100,
    pts: 6 + (seed % 22),
    reb: 1 + (seed % 12),
    ast: 1 + (seed % 13),
    stl: seed % 4,
    blk: seed % 3,
    to: seed % 5,
    ...over,
  };
}

const S1_ROSTER: RosterPlayer[] = [
  make("s1-p0", 4, { name: "Jalen Brunson", nbaTeam: "NYK", pos: "PG", slot: "PG", age: 28, matchup: "vs BOS", salary: 24.9, contractYearsLeft: 3, ht: "6'2\"", wt: 190, exp: 6, draftInfo: "2018 · R2 (33)", pts: 26.1, reb: 3.5, ast: 6.3, stl: 0.9, blk: 0.2, fgPct: 0.492, threes: 2.6, ftPct: 0.847, to: 2.4 }),
  make("s1-p1", 9, { name: "Tyler Herro", nbaTeam: "MIA", pos: "SG", slot: "SG", age: 24, matchup: "@ CHI", salary: 27.7, contractYearsLeft: 2, ht: "6'5\"", wt: 195, exp: 5, draftInfo: "2019 · R1 (13)", pts: 23.4, reb: 5.2, ast: 4.5, stl: 0.9, blk: 0.2, fgPct: 0.461, threes: 3.2, ftPct: 0.872, to: 2.6 }),
  make("s1-p2", 14, { name: "Julius Randle", nbaTeam: "MIN", pos: "PF", slot: "FLEX", age: 27, matchup: "@ NYK", salary: 30.3, contractYearsLeft: 2, ht: "6'8\"", wt: 250, exp: 10, draftInfo: "2014 · R1 (7)", pts: 20.9, reb: 8.1, ast: 4.9, stl: 0.7, blk: 0.4, fgPct: 0.478, threes: 2.4, ftPct: 0.734, to: 2.8 }),
  make("s1-p3", 2, { name: "Jayson Tatum", nbaTeam: "BOS", pos: "SF", slot: "SF", age: 27, matchup: "vs DEN", salary: 34.8, contractYearsLeft: 1, ht: "6'8\"", wt: 210, exp: 6, draftInfo: "2018 · R2 (33)", pts: 28.9, reb: 8.1, ast: 4.9, stl: 1.1, blk: 0.5, fgPct: 0.472, threes: 3.7, ftPct: 0.851, to: 2.7 }),
  make("s1-p4", 22, { name: "Jarrett Allen", nbaTeam: "CLE", pos: "C", slot: "C", age: 26, matchup: "vs IND", salary: 20.0, contractYearsLeft: 2, ht: "6'11\"", wt: 243, exp: 7, draftInfo: "2017 · R1 (22)", pts: 13.8, reb: 10.6, ast: 2.1, stl: 0.7, blk: 1.3, fgPct: 0.634, threes: 0, ftPct: 0.721, to: 1.5 }),
  make("s1-p5", 8, { name: "Zion Williamson", nbaTeam: "NOP", pos: "PF", slot: "IR", age: 24, matchup: "@ ATL", status: "Injured", salary: 36.0, contractYearsLeft: 3, ht: "6'6\"", wt: 284, exp: 5, draftInfo: "2019 · R1 (1)", pts: 24.7, reb: 7.2, ast: 5.3, stl: 1.1, blk: 0.7, fgPct: 0.571, threes: 0.4, ftPct: 0.702, to: 3.1 }),
  make("s1-p6", 24, { name: "Malik Beasley", nbaTeam: "DET", pos: "SG", slot: "BN", age: 28, matchup: "vs ORL", status: "Day-to-Day", salary: 6.0, contractYearsLeft: 1, ht: "6'4\"", wt: 187, exp: 8, draftInfo: "2016 · R1 (19)", pts: 16.3, reb: 2.6, ast: 1.5, stl: 0.7, blk: 0.1, fgPct: 0.443, threes: 3.3, ftPct: 0.804, to: 0.9 }),
  make("s1-p7", 17, { name: "Franz Wagner", nbaTeam: "ORL", pos: "SF", slot: "BN", age: 23, matchup: "vs MIL" }),
  make("s1-p8", 30, { name: "Naz Reid", nbaTeam: "MIN", pos: "C", slot: "BN", age: 25, matchup: "@ SAC" }),
  make("s1-p9", 10, { name: "Payton Pritchard", nbaTeam: "BOS", pos: "PG", slot: "BN", age: 26, matchup: "vs DEN" }),
  make("s1-p10", 26, { name: "Bennedict Mathurin", nbaTeam: "IND", pos: "SG", slot: "BN", age: 22, matchup: "@ CHA" }),
  make("s1-p11", 20, { name: "Herbert Jones", nbaTeam: "NOP", pos: "SF", slot: "BN", age: 26, matchup: "@ ATL" }),
  make("s1-p12", 15, { name: "Domantas Sabonis", nbaTeam: "SAC", pos: "C", slot: "BN", age: 28, matchup: "vs MIN" }),
  make("s1-p13", 27, { name: "Jalen Williams", nbaTeam: "OKC", pos: "SF", slot: "BN", age: 23, matchup: "vs HOU" }),
];

function buildRosters(): Record<string, RosterPlayer[]> {
  const byTeam: Record<string, RosterPlayer[]> = { s1: S1_ROSTER };

  TEAM_IDS.forEach((teamId, teamIndex) => {
    if (teamId === "s1") return;
    const size = ROSTER_SIZE[teamId] ?? 13;
    byTeam[teamId] = Array.from({ length: size }, (_, i) =>
      make(`${teamId}-p${i}`, teamIndex * 37 + i * 17 + 11, {
        name: NAME_POOL[(teamIndex * 5 + i) % NAME_POOL.length],
        slot: SLOTS[i] ?? "BN",
      })
    );
  });

  return byTeam;
}

const initialState: RostersState = {
  byTeam: buildRosters(),
};

const rostersSlice = createSlice({
  name: "rosters",
  initialState,
  reducers: {
    movePlayer(
      state,
      action: PayloadAction<{ teamId: string; playerId: string; slot: string }>
    ) {
      const player = state.byTeam[action.payload.teamId]?.find(
        (p) => p.id === action.payload.playerId
      );
      if (player) player.slot = action.payload.slot;
    },
    dropPlayer(
      state,
      action: PayloadAction<{ teamId: string; playerId: string }>
    ) {
      const list = state.byTeam[action.payload.teamId];
      if (list) {
        state.byTeam[action.payload.teamId] = list.filter(
          (p) => p.id !== action.payload.playerId
        );
      }
    },
  },
});

export const { movePlayer, dropPlayer } = rostersSlice.actions;
export default rostersSlice.reducer;
