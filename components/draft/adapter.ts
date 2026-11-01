import type { DraftProspect } from "@/lib/store/features/draftSlice";
import type { RosterPlayer } from "@/lib/store/features/rostersSlice";

function seedFrom(id: string) {
  return [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
}

const HEIGHTS = ["6'1\"", "6'3\"", "6'5\"", "6'7\"", "6'9\"", "6'11\"", "7'0\""];
const DRAFT_YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

/** Feeds a Draft prospect into the shared My-Team player detail modal. */
export function draftProspectToRosterPlayer(p: DraftProspect): RosterPlayer {
  const seed = seedFrom(p.id);
  return {
    id: p.id,
    name: p.name,
    nbaTeam: "Prospect",
    pos: p.position,
    slot: p.position,
    age: p.age,
    matchup: "—",
    status: "Active",
    salary: p.salary,
    contractYearsLeft: 0,
    ht: HEIGHTS[seed % HEIGHTS.length],
    wt: 190 + (seed % 60),
    exp: Math.max(0, p.age - 19),
    draftInfo: `${DRAFT_YEARS[seed % DRAFT_YEARS.length]} Draft Class`,
    fgPct: p.fgPct / 100,
    threes: Math.round(p.pts * 0.15 * 10) / 10,
    ftPct: 0.8,
    pts: p.pts,
    reb: p.reb,
    ast: p.ast,
    stl: p.stl,
    blk: p.blk,
    to: 2,
  };
}
