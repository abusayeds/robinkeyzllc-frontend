// Mock helpers for the My Team contract editor, kept here rather than in the
// Free Agency folder: Free Agency runs on the real API now and must not carry
// a borrowed salary cap around. These go when My Team is wired.

import { SALARY_CAP } from "@/lib/store/features/leagueSlice";

export function money(value: number, decimals = 1) {
  const rounded = Number(Math.abs(value).toFixed(decimals));
  return `${value < 0 ? "-" : ""}$${rounded.toLocaleString()}M`;
}

/** Full dollar amount from a $M value, e.g. -35.6 -> "-$35,600,000" */
export function moneyFull(valueInMillions: number) {
  const dollars = Math.round(Math.abs(valueInMillions) * 1_000_000);
  return `${valueInMillions < 0 ? "-" : ""}$${dollars.toLocaleString()}`;
}

export function maxFirstYear(age: number) {
  const share = age >= 30 ? 0.35 : age >= 26 ? 0.3 : 0.25;
  return Number((SALARY_CAP * share).toFixed(1));
}

export type SalaryYear = {
  season: string;
  age: number;
  salary: number;
  pctOfCap: number;
};

export function salaryBreakdown(
  firstYear: number,
  years: number,
  startAge: number,
): SalaryYear[] {
  const RAISE = 0.05;
  const rows: SalaryYear[] = [];
  let salary = firstYear;
  for (let i = 0; i < years; i += 1) {
    const startSeason = 2025 + i;
    rows.push({
      season: `${startSeason}-${String((startSeason + 1) % 100).padStart(2, "0")}`,
      age: startAge + i,
      salary: Number(salary.toFixed(1)),
      pctOfCap: (salary / SALARY_CAP) * 100,
    });
    salary *= 1 + RAISE;
  }
  return rows;
}

export function contractTotal(rows: SalaryYear[]) {
  return Number(rows.reduce((sum, r) => sum + r.salary, 0).toFixed(1));
}
