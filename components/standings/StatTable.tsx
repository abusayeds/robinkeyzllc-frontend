import type { StatCategories } from "@/lib/store/features/leagueSlice";

export type StatRow = {
  id: string;
  team: string;
  yourTeam?: boolean;
  primary: number;
  stats: StatCategories;
};

type Column = {
  key: keyof StatCategories | "primary";
  label: string;
  percent?: boolean;
  lowerBetter?: boolean;
};

const th =
  "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-dark/70";
const td = "px-3 py-3 text-sm text-brand-dark";

function format(value: number, percent?: boolean) {
  if (percent) return `${value.toFixed(1)}%`;
  return value.toLocaleString();
}

export default function StatTable({
  rows,
  primaryLabel,
}: {
  rows: StatRow[];
  primaryLabel: string;
}) {
  const columns: Column[] = [
    { key: "primary", label: primaryLabel },
    { key: "fgPct", label: "FG%", percent: true },
    { key: "ftPct", label: "FT%", percent: true },
    { key: "threes", label: "3PTM" },
    { key: "pts", label: "PTS" },
    { key: "reb", label: "REB" },
    { key: "ast", label: "AST" },
    { key: "stl", label: "STL" },
    { key: "blk", label: "BLK" },
    { key: "to", label: "TO", lowerBetter: true },
  ];

  const valueOf = (row: StatRow, key: Column["key"]) =>
    key === "primary" ? row.primary : row.stats[key];

  const averages = new Map<Column["key"], number>();
  for (const column of columns) {
    const sum = rows.reduce((acc, row) => acc + valueOf(row, column.key), 0);
    averages.set(column.key, sum / (rows.length || 1));
  }

  function tone(column: Column, value: number) {
    const avg = averages.get(column.key) ?? 0;
    if (Math.abs(value - avg) < avg * 0.005) return "text-brand-dark";
    const better = column.lowerBetter ? value < avg : value > avg;
    return better ? "text-brand-cta-dark" : "text-red-500";
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse">
        <thead>
          <tr className="bg-brand-cta/10">
            <th className={`${th} text-left`}>#</th>
            <th className={`${th} text-left`}>Team</th>
            {columns.map((column) => (
              <th key={column.key} className={th}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={
                row.yourTeam ? "bg-brand-cta/5" : "transition hover:bg-brand-soft"
              }
            >
              <td className={`${td} w-10 text-brand-muted`}>{index + 1}</td>
              <td className={td}>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-forest text-[11px] font-bold text-brand-accent">
                    {row.team.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-dark">
                      {row.team}
                    </p>
                    {row.yourTeam ? (
                      <p className="text-[10px] font-semibold tracking-wide text-brand-cta-dark">
                        YOUR TEAM
                      </p>
                    ) : null}
                  </div>
                </div>
              </td>
              {columns.map((column) => {
                const value = valueOf(row, column.key);
                return (
                  <td
                    key={column.key}
                    className={`${td} text-center font-medium ${
                      column.key === "primary"
                        ? "font-semibold text-brand-dark"
                        : tone(column, value)
                    }`}
                  >
                    {format(value, column.percent)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
