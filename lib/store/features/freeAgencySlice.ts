import { createSlice } from "@reduxjs/toolkit";

/**
 * What is left of the old mock Free Agency store.
 *
 * Free Agency itself runs on the real API now, so the invented free agents and
 * offer sheets are gone. Only `capExceptions` survives, because My Team's cap
 * summary still reads it and My Team has not been wired yet. The two types
 * below are kept for the same reason: the mock contract editor refers to them.
 *
 * This file goes when My Team moves onto the real API.
 */

export type FaType = "UFA" | "RFA";
export type BirdRights = "Full Bird" | "Early Bird" | "Non-Bird";

export type FreeAgent = {
  id: string;
  name: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  age: number;
  faType: FaType;
  bird: BirdRights;
  birdYears: number;
  experience: number;
  pts: number;
  reb: number;
  ast: number;
  threes: number;
  stl: number;
  blk: number;
  to: number;
  fgPct: number;
  ftPct: number;
  askingAav: number;
  askingYears: number;
};

export type CapException = {
  label: string;
  /** Dollar value in millions, e.g. 12.3 -> $12,300,000 */
  amount: number;
};

type FreeAgencyState = {
  capExceptions: CapException[];
};

const initialState: FreeAgencyState = {
  capExceptions: [],
};

const freeAgencySlice = createSlice({
  name: "freeAgency",
  initialState,
  reducers: {},
});

export default freeAgencySlice.reducer;
