import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type MyLeague = {
  id: string;
  name: string;
  teamCount: number;
  /** All roles this user holds in this specific league — a user can be
   *  Team Owner only, Commissioner only, or both, per league. */
  roles: ("Team Owner" | "Commissioner")[];
  season: string;
  logo?: string;
};

export type CreateLeaguePayload = {
  name: string;
  teamCount: number;
  scoringType: string;
  draftType: string;
  visibility: string;
};

export type Matchup = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeRecord: string;
  awayRecord: string;
};

export type PlayerNewsItem = {
  id: string;
  player: string;
  status: string;
  note: string;
  timeAgo: string;
};

export type StandingRow = {
  id: string;
  team: string;
  conference: "East" | "West";
  yourTeam?: boolean;
  w: number;
  l: number;
  t: number;
  div: string;
  l10: string;
  streak: string;
  ptsFor: number;
  ptsAgainst: number;
};

export type StatCategories = {
  fgPct: number;
  ftPct: number;
  threes: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
};

export type WeeklyStatLine = StatCategories & {
  teamId: string;
  wkPts: number;
};

export type SeasonStatLine = StatCategories & {
  teamId: string;
  h2hWins: number;
};

export type PlayoffTeam = {
  seed: number;
  team: string;
  teamId: string;
};

export type PlayoffSeries = {
  id: string;
  round: "Semifinal" | "Conference Final" | "Championship";
  conference: "East" | "West" | "Final";
  home?: PlayoffTeam;
  away?: PlayoffTeam;
  homeWins: number;
  awayWins: number;
  winnerId?: string;
  live?: boolean;
};

export type Playoffs = {
  title: string;
  statusLabel: string;
  series: PlayoffSeries[];
};

export type CapStatus = "Under Cap" | "Luxury Tax" | "Over Cap";

export const SALARY_CAP = 140.9;
export const TAX_LINE = 170.8;
export const FIRST_APRON_LINE = 178.1;
export const SECOND_APRON_LINE = 188.9;

export type IntelStatus = "Contending" | "Rebuilding" | "Buying" | "Selling";

export type LeagueTeam = {
  id: string;
  name: string;
  franchise?: string;
  owner: string;
  logo: string;
  conference: "East" | "West";
  yourTeam?: boolean;
  record: string;
  leagueRank: number;
  rosterCount: number;
  rosterMax: number;
  payroll: number;
  deadMoney: number;
  capSpace: number;
  capStatus: CapStatus;
  luxuryTax: number;
  firstApron: number;
  capRoom: number;
  /** Self-reported league intel — set by that team's own owner, read-only
   *  to everyone else. The current user's own team uses state.team.intelStatus
   *  instead so it can be edited from the My Team page. */
  intelStatus?: IntelStatus;
};

export type MatchupStatus = "upcoming" | "live" | "final";

export type MatchupCategory = {
  label: string;
  home: number;
  away: number;
  homeWins: boolean | null;
  percent?: boolean;
};

export type ScheduleMatchup = {
  id: string;
  week: number;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  status: MatchupStatus;
  categories?: MatchupCategory[];
};

type LeagueState = {
  name: string;
  week: number;
  myLeagues: MyLeague[];
  standings: StandingRow[];
  weeklyStats: WeeklyStatLine[];
  seasonStats: SeasonStatLine[];
  playoffs: Playoffs;
  leagueTeams: LeagueTeam[];
  schedule: ScheduleMatchup[];
  matchups: Matchup[];
  playerNews: PlayerNewsItem[];
  categoryStandings: { label: string; rank: number; value: number }[];
};

const TEAM_IDS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];
const TOTAL_WEEKS = 22;
const CURRENT_WEEK = 20;

function buildSchedule(): ScheduleMatchup[] {
  const rounds: [string, string][][] = [];
  const rotation = [...TEAM_IDS];
  for (let r = 0; r < TEAM_IDS.length - 1; r += 1) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < TEAM_IDS.length / 2; i += 1) {
      const a = rotation[i];
      const b = rotation[TEAM_IDS.length - 1 - i];
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    rotation.splice(1, 0, rotation.pop() as string);
  }

  const schedule: ScheduleMatchup[] = [];
  for (let week = 1; week <= TOTAL_WEEKS; week += 1) {
    const round = rounds[(week - 1) % rounds.length];
    round.forEach(([homeId, awayId], index) => {
      const status: MatchupStatus =
        week < CURRENT_WEEK ? "final" : week === CURRENT_WEEK ? "live" : "upcoming";
      const seed = week * 31 + index * 13;
      const homeScore = status === "upcoming" ? 0 : 3 + (seed % 5);
      const awayScore =
        status === "upcoming" ? 0 : Math.max(0, 9 - homeScore - (seed % 3 === 0 ? 1 : 0));
      schedule.push({
        id: `w${week}-m${index}`,
        week,
        homeId,
        awayId,
        homeScore,
        awayScore,
        status,
      });
    });
  }

  const forceMatchup = (
    week: number,
    homeId: string,
    awayId: string,
    mutate: (m: ScheduleMatchup) => void
  ) => {
    const list = schedule.filter((m) => m.week === week);
    const a = list.find((m) => m.homeId === homeId || m.awayId === homeId);
    const b = list.find((m) => m.homeId === awayId || m.awayId === awayId);
    if (!a || !b) return;
    if (a !== b) {
      const aOther = a.homeId === homeId ? a.awayId : a.homeId;
      const bOther = b.homeId === awayId ? b.awayId : b.homeId;
      b.homeId = aOther;
      b.awayId = bOther;
    }
    a.homeId = homeId;
    a.awayId = awayId;
    mutate(a);
  };

  forceMatchup(CURRENT_WEEK - 1, "s1", "s6", (m) => {
    m.status = "final";
    m.homeScore = 6;
    m.awayScore = 3;
    m.categories = [
      { label: "FG%", home: 0.483, away: 0.49, homeWins: false, percent: true },
      { label: "3PTM", home: 44, away: 51, homeWins: false },
      { label: "FT%", home: 0.795, away: 0.763, homeWins: true, percent: true },
      { label: "PTS", home: 430, away: 537, homeWins: false },
      { label: "REB", home: 157, away: 172, homeWins: false },
      { label: "AST", home: 182, away: 113, homeWins: true },
      { label: "STL", home: 88, away: 54, homeWins: true },
      { label: "BLK", home: 42, away: 29, homeWins: true },
      { label: "TO", home: 102, away: 88, homeWins: false },
    ];
  });

  forceMatchup(CURRENT_WEEK, "s1", "s7", (m) => {
    m.status = "live";
    m.homeScore = 0;
    m.awayScore = 0;
    m.categories = undefined;
  });

  forceMatchup(CURRENT_WEEK + 1, "s1", "s4", (m) => {
    m.status = "upcoming";
    m.homeScore = 0;
    m.awayScore = 0;
  });

  return schedule;
}

const initialState: LeagueState = {
  name: "Celtics Dynasty League",
  week: 20,
  myLeagues: [
    {
      id: "l1",
      name: "Celtics Dynasty League",
      teamCount: 12,
      roles: ["Team Owner", "Commissioner"],
      season: "2025-26",
      logo: "/image/team2.png",
    },
    {
      id: "l2",
      name: "Eastern Conference Keepers",
      teamCount: 10,
      roles: ["Commissioner"],
      season: "2025-26",
      logo: "/image/team1.png",
    },
    {
      id: "l3",
      name: "Hardwood Legacy League",
      teamCount: 14,
      roles: ["Team Owner"],
      season: "2025-26",
      logo: "/image/team3.png",
    },
    {
      id: "l4",
      name: "Downtown Dynasty",
      teamCount: 12,
      roles: ["Team Owner"],
      season: "2025-26",
      logo: "/image/team4.png",
    },
    {
      id: "l5",
      name: "Franchise Builders",
      teamCount: 8,
      roles: ["Commissioner"],
      season: "2025-26",
      logo: "/image/team5.png",
    },
    {
      id: "l6",
      name: "Cap Space Chronicles",
      teamCount: 10,
      roles: ["Team Owner"],
      season: "2025-26",
    },
  ],
  standings: [
    {
      id: "s1",
      team: "Celtics Dynasty",
      conference: "East",
      yourTeam: true,
      w: 47,
      l: 35,
      t: 0,
      div: "19-6",
      l10: "7-3",
      streak: "W4",
      ptsFor: 1738,
      ptsAgainst: 1491,
    },
    {
      id: "s2",
      team: "Court Kings",
      conference: "East",
      w: 44,
      l: 38,
      t: 0,
      div: "9-9",
      l10: "5-5",
      streak: "L2",
      ptsFor: 1834,
      ptsAgainst: 1701,
    },
    {
      id: "s3",
      team: "Baller Bandits",
      conference: "East",
      w: 42,
      l: 38,
      t: 0,
      div: "8-10",
      l10: "6-4",
      streak: "W1",
      ptsFor: 1670,
      ptsAgainst: 1688,
    },
    {
      id: "s4",
      team: "Chi Bulls",
      conference: "East",
      w: 38,
      l: 47,
      t: 0,
      div: "6-12",
      l10: "3-7",
      streak: "L3",
      ptsFor: 1573,
      ptsAgainst: 1758,
    },
    {
      id: "s5",
      team: "Iron Hawks",
      conference: "West",
      w: 52,
      l: 30,
      t: 0,
      div: "12-6",
      l10: "8-2",
      streak: "W6",
      ptsFor: 1842,
      ptsAgainst: 1543,
    },
    {
      id: "s6",
      team: "Miami Flames",
      conference: "West",
      w: 41,
      l: 41,
      t: 0,
      div: "7-11",
      l10: "5-5",
      streak: "L2",
      ptsFor: 1641,
      ptsAgainst: 1730,
    },
    {
      id: "s7",
      team: "LA Legends",
      conference: "West",
      w: 38,
      l: 43,
      t: 0,
      div: "7-11",
      l10: "6-4",
      streak: "W1",
      ptsFor: 1509,
      ptsAgainst: 1731,
    },
    {
      id: "s8",
      team: "Dallas Mavs",
      conference: "West",
      w: 28,
      l: 54,
      t: 0,
      div: "4-14",
      l10: "2-8",
      streak: "L4",
      ptsFor: 1502,
      ptsAgainst: 1811,
    },
  ],
  weeklyStats: [
    { teamId: "s5", wkPts: 72, fgPct: 45.7, ftPct: 78.1, threes: 51, pts: 645, reb: 171, ast: 118, stl: 38, blk: 22, to: 55 },
    { teamId: "s1", wkPts: 69, fgPct: 47.4, ftPct: 81.2, threes: 46, pts: 631, reb: 168, ast: 121, stl: 41, blk: 19, to: 52 },
    { teamId: "s2", wkPts: 63, fgPct: 46.1, ftPct: 79.8, threes: 41, pts: 598, reb: 155, ast: 108, stl: 35, blk: 24, to: 58 },
    { teamId: "s3", wkPts: 58, fgPct: 44.9, ftPct: 76.5, threes: 39, pts: 566, reb: 162, ast: 99, stl: 33, blk: 17, to: 60 },
    { teamId: "s6", wkPts: 54, fgPct: 44.5, ftPct: 77.0, threes: 33, pts: 548, reb: 149, ast: 95, stl: 31, blk: 21, to: 57 },
    { teamId: "s7", wkPts: 51, fgPct: 43.9, ftPct: 74.9, threes: 35, pts: 529, reb: 144, ast: 91, stl: 29, blk: 18, to: 61 },
    { teamId: "s4", wkPts: 44, fgPct: 42.7, ftPct: 73.2, threes: 28, pts: 501, reb: 138, ast: 84, stl: 26, blk: 15, to: 63 },
    { teamId: "s8", wkPts: 37, fgPct: 41.5, ftPct: 71.8, threes: 24, pts: 468, reb: 129, ast: 78, stl: 24, blk: 13, to: 66 },
  ],
  seasonStats: [
    { teamId: "s5", h2hWins: 52, fgPct: 46.0, ftPct: 79.0, threes: 542, pts: 11281, reb: 3343, ast: 2375, stl: 731, blk: 382, to: 1075 },
    { teamId: "s1", h2hWins: 47, fgPct: 46.5, ftPct: 80.5, threes: 541, pts: 11412, reb: 3713, ast: 2481, stl: 794, blk: 361, to: 1058 },
    { teamId: "s2", h2hWins: 44, fgPct: 45.8, ftPct: 78.6, threes: 484, pts: 10841, reb: 3221, ast: 2244, stl: 705, blk: 402, to: 1129 },
    { teamId: "s3", h2hWins: 42, fgPct: 44.6, ftPct: 76.0, threes: 452, pts: 10412, reb: 3129, ast: 2138, stl: 660, blk: 341, to: 1188 },
    { teamId: "s6", h2hWins: 41, fgPct: 44.1, ftPct: 77.0, threes: 428, pts: 10188, reb: 3005, ast: 2066, stl: 623, blk: 384, to: 1157 },
    { teamId: "s7", h2hWins: 38, fgPct: 43.8, ftPct: 75.0, threes: 419, pts: 10038, reb: 2944, ast: 1998, stl: 601, blk: 355, to: 1214 },
    { teamId: "s4", h2hWins: 38, fgPct: 42.9, ftPct: 73.5, threes: 391, pts: 9418, reb: 2809, ast: 1870, stl: 561, blk: 331, to: 1256 },
    { teamId: "s8", h2hWins: 28, fgPct: 41.5, ftPct: 72.0, threes: 322, pts: 8418, reb: 2544, ast: 1685, stl: 512, blk: 288, to: 1341 },
  ],
  playoffs: {
    title: "2024 Dynasty Playoffs",
    statusLabel: "Conference Finals in Progress",
    series: [
      {
        id: "e-sf-1",
        round: "Semifinal",
        conference: "East",
        home: { seed: 1, team: "Celtics Dynasty", teamId: "s1" },
        away: { seed: 4, team: "Chi Bulls", teamId: "s4" },
        homeWins: 4,
        awayWins: 1,
        winnerId: "s1",
      },
      {
        id: "e-sf-2",
        round: "Semifinal",
        conference: "East",
        home: { seed: 2, team: "Court Kings", teamId: "s2" },
        away: { seed: 3, team: "Baller Bandits", teamId: "s3" },
        homeWins: 4,
        awayWins: 2,
        winnerId: "s2",
      },
      {
        id: "e-cf",
        round: "Conference Final",
        conference: "East",
        home: { seed: 1, team: "Celtics Dynasty", teamId: "s1" },
        away: { seed: 2, team: "Court Kings", teamId: "s2" },
        homeWins: 2,
        awayWins: 1,
        live: true,
      },
      {
        id: "w-sf-1",
        round: "Semifinal",
        conference: "West",
        home: { seed: 1, team: "Iron Hawks", teamId: "s5" },
        away: { seed: 4, team: "Dallas Mavs", teamId: "s8" },
        homeWins: 4,
        awayWins: 0,
        winnerId: "s5",
      },
      {
        id: "w-sf-2",
        round: "Semifinal",
        conference: "West",
        home: { seed: 2, team: "Miami Flames", teamId: "s6" },
        away: { seed: 3, team: "LA Legends", teamId: "s7" },
        homeWins: 4,
        awayWins: 3,
        winnerId: "s6",
      },
      {
        id: "w-cf",
        round: "Conference Final",
        conference: "West",
        home: { seed: 1, team: "Iron Hawks", teamId: "s5" },
        away: { seed: 2, team: "Miami Flames", teamId: "s6" },
        homeWins: 2,
        awayWins: 1,
        live: true,
      },
      {
        id: "finals",
        round: "Championship",
        conference: "Final",
        homeWins: 0,
        awayWins: 0,
      },
    ],
  },
  leagueTeams: [
    { id: "s5", name: "Iron Hawks", owner: "Cole738201", logo: "/image/team1.png", conference: "West", record: "52-30", leagueRank: 1, rosterCount: 15, rosterMax: 15, payroll: 178.9, deadMoney: 4.2, capSpace: -18.24, capStatus: "Luxury Tax", luxuryTax: 8.1, firstApron: 0.8, capRoom: 226.14, intelStatus: "Contending" },
    { id: "s1", name: "Celtics Dynasty", franchise: "Boston Celtics", owner: "RobinKeyz", logo: "/image/team2.png", conference: "East", yourTeam: true, record: "47-35", leagueRank: 2, rosterCount: 11, rosterMax: 15, payroll: 171.6, deadMoney: 1.6, capSpace: -30.7, capStatus: "Luxury Tax", luxuryTax: 0.8, firstApron: 6.5, capRoom: 212.4 },
    { id: "s2", name: "Court Kings", owner: "Ramsey410927", logo: "/image/team3.png", conference: "East", record: "44-38", leagueRank: 3, rosterCount: 14, rosterMax: 15, payroll: 158.4, deadMoney: 0, capSpace: 12.1, capStatus: "Under Cap", luxuryTax: 0, firstApron: 0, capRoom: 12.1, intelStatus: "Buying" },
    { id: "s3", name: "Baller Bandits", owner: "Nguyen552310", logo: "/image/team4.png", conference: "East", record: "42-38", leagueRank: 4, rosterCount: 15, rosterMax: 15, payroll: 171.5, deadMoney: 3.1, capSpace: -6.3, capStatus: "Luxury Tax", luxuryTax: 0.7, firstApron: 0, capRoom: 214.32 },
    { id: "s6", name: "Miami Flames", owner: "Ruiz452474", logo: "/image/team5.png", conference: "West", record: "41-41", leagueRank: 5, rosterCount: 14, rosterMax: 15, payroll: 149.2, deadMoney: 0, capSpace: 4.75, capStatus: "Under Cap", luxuryTax: 0, firstApron: 0, capRoom: 4.75, intelStatus: "Rebuilding" },
    { id: "s7", name: "LA Legends", owner: "Park903118", logo: "/image/team1.png", conference: "West", record: "38-43", leagueRank: 6, rosterCount: 13, rosterMax: 15, payroll: 145.1, deadMoney: 2.0, capSpace: 9.2, capStatus: "Under Cap", luxuryTax: 0, firstApron: 0, capRoom: 9.2 },
    { id: "s4", name: "Chi Bulls", owner: "Ellis277640", logo: "/image/team3.png", conference: "East", record: "38-47", leagueRank: 7, rosterCount: 14, rosterMax: 15, payroll: 167.3, deadMoney: 0.8, capSpace: -2.15, capStatus: "Luxury Tax", luxuryTax: 0, firstApron: 0, capRoom: 208.4, intelStatus: "Selling" },
    { id: "s8", name: "Dallas Mavs", owner: "Brooks614238", logo: "/image/team4.png", conference: "West", record: "28-54", leagueRank: 8, rosterCount: 13, rosterMax: 15, payroll: 138.6, deadMoney: 0, capSpace: 21.4, capStatus: "Under Cap", luxuryTax: 0, firstApron: 0, capRoom: 21.4 },
  ],
  schedule: buildSchedule(),
  matchups: [
    {
      id: "1",
      awayTeam: "Miami Flames",
      homeTeam: "LA Legends",
      awayRecord: "6-3",
      homeRecord: "5-4",
    },
    {
      id: "2",
      awayTeam: "Chicago Bulls",
      homeTeam: "NY Knickerbockers",
      awayRecord: "4-5",
      homeRecord: "6-3",
    },
    {
      id: "3",
      awayTeam: "Dallas Mavericks",
      homeTeam: "Denver Peaks",
      awayRecord: "3-6",
      homeRecord: "5-4",
    },
  ],
  playerNews: [
    {
      id: "1",
      player: "J. Randle",
      status: "Expected",
      note: "Expected to play vs MIA",
      timeAgo: "2h",
    },
    {
      id: "2",
      player: "A. Simons",
      status: "Questionable",
      note: "Questionable vs BOS",
      timeAgo: "4h",
    },
    {
      id: "3",
      player: "K. Porziņģis",
      status: "OUT",
      note: "Out vs MIA",
      timeAgo: "6h",
    },
  ],
  categoryStandings: [
    { label: "FG%", rank: 4, value: 78 },
    { label: "3PM", rank: 7, value: 55 },
    { label: "FT%", rank: 30, value: 12 },
    { label: "AST", rank: 5, value: 70 },
    { label: "STL", rank: 3, value: 84 },
    { label: "BLK", rank: 14, value: 38 },
  ],
};

const leagueSlice = createSlice({
  name: "league",
  initialState,
  reducers: {
    createLeague(state, action: PayloadAction<CreateLeaguePayload>) {
      const league: MyLeague = {
        id: nanoid(),
        name: action.payload.name,
        teamCount: action.payload.teamCount,
        roles: ["Commissioner"],
        season: "2025-26",
      };
      state.myLeagues.unshift(league);
      state.name = league.name;
    },
    updateYourTeamRecord(state, action: PayloadAction<string>) {
      const yours = state.leagueTeams.find((t) => t.yourTeam);
      if (yours) yours.record = action.payload;
    },
  },
});

export const { createLeague, updateYourTeamRecord } = leagueSlice.actions;
export default leagueSlice.reducer;
