import { Fragment } from "react";
import { FiDownload } from "react-icons/fi";
import type {
  DraftPickAsset,
  PickProtectionKind,
} from "@/lib/store/features/transactionsSlice";

const PROTECTION: Record<PickProtectionKind, { label: string; dot: string }> = {
  top10: { label: "Top 10 protected", dot: "bg-amber-500" },
  lottery: { label: "Lottery protected", dot: "bg-red-500" },
  swap: { label: "Swap Option", dot: "bg-blue-500" },
  unprotected: { label: "Unprotected", dot: "bg-brand-cta" },
};

const th =
  "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted";
const td = "px-4 py-3 align-top text-sm text-brand-dark";

export default function DraftPicksTable({
  picks,
  lastSynced,
}: {
  picks: DraftPickAsset[];
  lastSynced: string;
}) {
  const years = Array.from(new Set(picks.map((p) => p.year)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-brand-muted">
          <span className="font-semibold uppercase tracking-wide">
            Protection legend:
          </span>
          {Object.values(PROTECTION).map((entry) => (
            <span key={entry.label} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${entry.dot}`} />
              {entry.label}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-brand-forest px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
          >
            All Picks
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-brand-forest px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
          >
            <FiDownload className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-brand-soft">
                <th className={th}>Year</th>
                <th className={th}>Round</th>
                <th className={th}>Pick</th>
                <th className={th}>Ownership / Source</th>
                <th className={th}>Protection / Conditions</th>
                <th className={th}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {years.map((year, groupIndex) => {
                const rows = picks.filter((p) => p.year === year);
                return (
                  <Fragment key={year}>
                    {rows.map((pick, index) => {
                      const protection = PROTECTION[pick.protectionKind];
                      return (
                        <tr
                          key={pick.id}
                          className={`hover:bg-brand-soft/60 ${
                            index === 0 && groupIndex > 0
                              ? "border-t-2 border-brand-border"
                              : "border-t border-brand-border"
                          }`}
                        >
                          {index === 0 ? (
                            <td
                              rowSpan={rows.length}
                              className={`${td} bg-brand-soft/40 text-base font-bold text-brand-dark`}
                            >
                              {year}
                            </td>
                          ) : null}
                          <td className={`${td} text-brand-muted`}>
                            {pick.round}
                          </td>
                          <td className={`${td} font-medium`}>{pick.pick}</td>
                          <td className={`${td} text-brand-muted`}>
                            {pick.source}
                          </td>
                          <td className={td}>
                            <span className="flex items-start gap-2">
                              <span
                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${protection.dot}`}
                              />
                              <span className="text-brand-dark">
                                {pick.protectionText}
                              </span>
                            </span>
                          </td>
                          <td className={`${td} italic text-brand-muted`}>
                            {pick.notes}
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-border px-4 py-3 text-xs">
          <span className="text-brand-muted">
            Draft pick ownership is updated after trades are processed.
          </span>
          <span className="font-semibold text-brand-cta-dark">
            Last synchronized: {lastSynced}
          </span>
        </div>
      </div>
    </div>
  );
}
