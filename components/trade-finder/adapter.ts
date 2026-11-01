import type { TradePlayer } from "@/lib/store/features/tradeSlice";
import type { RosterPlayer } from "@/lib/store/features/rostersSlice";

function seedFrom(id: string) {
  return [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
}

const HEIGHTS = ["6'1\"", "6'3\"", "6'5\"", "6'7\"", "6'9\"", "6'11\"", "7'0\""];
const DRAFT_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022];

/** Feeds a Trade Finder listing into the shared My-Team player detail modal. */
export function tradePlayerToRosterPlayer(p: TradePlayer): RosterPlayer {
  const seed = seedFrom(p.id);
  return {
    id: p.id,
    name: p.name,
    nbaTeam: p.team,
    pos: p.position,
    slot: p.position,
    age: p.age,
    matchup: "—",
    status: "Active",
    salary: p.salary,
    contractYearsLeft: p.years,
    ht: HEIGHTS[seed % HEIGHTS.length],
    wt: 190 + (seed % 60),
    exp: Math.max(0, p.age - 20),
    draftInfo: `${DRAFT_YEARS[seed % DRAFT_YEARS.length]} · Rd 1`,
    fgPct: p.fgPct / 100,
    threes: Math.round((p.threePct / 100) * 80) / 10,
    ftPct: p.ftPct / 100,
    pts: p.pts,
    reb: p.reb,
    ast: p.ast,
    stl: p.stl,
    blk: p.blk,
    to: p.to,
  };
}
