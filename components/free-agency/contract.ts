/**
 * Shared arithmetic for the offer sheet.
 *
 * These mirror `free-agency.rules.ts` on the server so the screen can show a
 * year-by-year breakdown while it is being typed. The server still works the
 * same figures out again on submit — this copy makes the form responsive, it
 * does not decide anything.
 */

// Re-exported so every free-agency screen keeps importing its figures from
// here, while the formatting itself lives in one null-safe place.
export { money, shortMoney } from "@/lib/money";

export const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

/**
 * Each later season adds `raisePct` of the **first** year, not of the year
 * before it. Compounding would quietly inflate a long deal.
 */
export const salaryForSeason = (
  firstYearSalary: number,
  raisePct: number,
  index: number,
) => Math.round(firstYearSalary + ((firstYearSalary * raisePct) / 100) * index);

export type OfferYear = {
  seasonStartYear: number;
  salary: number;
  pctOfCap: number | null;
};

export const offerBreakdown = (
  firstYearSalary: number,
  raisePct: number,
  years: number,
  startSeasonStartYear: number,
  salaryCap: number,
): OfferYear[] =>
  Array.from({ length: years }, (_, index) => {
    const salary = salaryForSeason(firstYearSalary, raisePct, index);
    return {
      seasonStartYear: startSeasonStartYear + index,
      salary,
      pctOfCap: salaryCap > 0 ? (salary / salaryCap) * 100 : null,
    };
  });

export const offerTotal = (rows: OfferYear[]) =>
  rows.reduce((total, row) => total + row.salary, 0);
