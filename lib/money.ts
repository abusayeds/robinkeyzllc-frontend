/**
 * A dollar figure, or a dash when there is no figure.
 *
 * Null-safe on purpose. These strings go straight into JSX, and a missing
 * number used to throw on `.toLocaleString` — which React turns into a blank
 * page and an "Application error" rather than one empty cell. A hard-capped
 * team on the Salary Management page did exactly that, because the API stopped
 * sending a field the page still read.
 *
 * Rounded to whole dollars: salaries are stored in whole dollars, so a stray
 * fraction from arithmetic is noise rather than information.
 */
export const money = (value: number | null | undefined, blank = "—") =>
  value === null || value === undefined || Number.isNaN(value)
    ? blank
    : `$${Math.round(value).toLocaleString("en-US")}`;

/** The same figure shortened, for a table too narrow for eight digits. */
export const shortMoney = (value: number | null | undefined, blank = "—") => {
  if (value === null || value === undefined || Number.isNaN(value))
    return blank;
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
};
