/**
 * The shape the shared player card is drawn from.
 *
 * A view model, not stored state: it used to live in `rostersSlice` beside a
 * set of fixtures, which is why three unrelated screens imported a Redux file
 * for a type. The slice is gone; the type belongs with the component that
 * reads it.
 */
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
