"use client";

import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

/**
 * The instructions that sit under the template download button.
 *
 * The wording is the league's own, taken from the import guide the
 * commissioner wrote, so what an owner reads here matches what he was told
 * elsewhere. The steps and the example always show; the four detail sections
 * start collapsed, because most commissioners only need them once.
 */

const STEPS: { text: string; code?: [string, string] }[] = [
  {
    text: "Download the template. The season columns are already labeled for your league.",
  },
  {
    text: "Add one row per player. Type salaries as plain numbers:",
    code: ["4000000", "$4,000,000"],
  },
  {
    text: "Save it as a CSV. In Excel, choose CSV UTF-8. In Google Sheets, use File → Download → CSV, which saves as UTF-8 automatically. Either way, accented names like Vučević come through correctly.",
  },
  {
    text: "Upload it and check the preview. Fix anything flagged, then confirm.",
  },
];

const EXAMPLE_HEADERS = [
  "team",
  "player",
  "bird_years",
  "2026-27",
  "2027-28",
  "2028-29",
  "contract_type",
  "signed_via",
];

const EXAMPLE_ROWS: string[][] = [
  ["BOS", "Marcus Hill", "4", "35000000", "37000000", "39000000 PO", "", ""],
  [
    "BOS",
    "Devin Cole",
    "1",
    "5000000",
    "5300000",
    "5600000 TO",
    "Rookie Scale",
    "",
  ],
  [
    "BOS",
    "Tyler Grant",
    "0",
    "12000000",
    "12500000",
    "",
    "",
    "Non-Taxpayer MLE",
  ],
  ["BOS", "Andre Moss", "0", "0", "0", "", "Two-Way", ""],
  ["BOS", "Chris Lane", "3", "CH", "", "", "", ""],
  ["BOS", "Sam Price", "0", "3000000 DC", "3000000 DC", "", "", ""],
];

const ROW_MEANINGS: { player: string; meaning: string }[] = [
  {
    player: "Marcus Hill",
    meaning: "3-year contract with a player option in the last year",
  },
  {
    player: "Devin Cole",
    meaning: "rookie deal with a team option in year 3",
  },
  {
    player: "Tyler Grant",
    meaning: "2-year contract signed with the Non-Taxpayer MLE",
  },
  {
    player: "Andre Moss",
    meaning:
      "two-way player. Put 0 in each season and set the type to Two-Way.",
  },
  {
    player: "Chris Lane",
    meaning:
      "free agent whose rights you hold. CH means cap hold, and we calculate the amount.",
  },
  {
    player: "Sam Price",
    meaning: "waived player. DC means dead cap, the money still on your books.",
  },
];

const REQUIRED_COLUMNS: { name: string; note: string }[] = [
  { name: "team", note: "abbreviation or full name (BOS or Boston Celtics)" },
  {
    name: "player",
    note: "the player's name. Accents, “Jr.” and periods are optional.",
  },
  {
    name: "bird_years",
    note: "seasons in a row on this team. Use 0 for a new signing.",
  },
  {
    name: "Season columns",
    note: "that season's salary, plus a tag if needed. Leave it blank if there's no salary that season.",
  },
];

const OPTIONAL_COLUMNS: { name: string; note: string }[] = [
  {
    name: "contract_type",
    note: "blank means Standard. Options: Standard, Rookie Scale, Veteran Minimum, Supermax, Two-Way, Non-Guaranteed, Partially Guaranteed",
  },
  {
    name: "signed_via",
    note: "blank means Cap Space. Options: Cap Space, Non-Taxpayer MLE, Taxpayer MLE, Room MLE, Bi-Annual Exception, Disabled Player Exception. Bird rights come from bird_years automatically.",
  },
  {
    name: "signed_season",
    note: "only if the contract was signed this season (for example, 2026-27). This uses up that team's exception, and hard-cap rules apply.",
  },
];

const TAGS: { tag: string; meaning: string; example: string }[] = [
  { tag: "PO", meaning: "Player option", example: "35000000 PO" },
  { tag: "TO", meaning: "Team option", example: "4000000 TO" },
  {
    tag: "CH",
    meaning:
      "Cap hold: you hold his rights but he isn't signed. Leave out the amount and we'll calculate it.",
    example: "CH or 12000000 CH",
  },
  {
    tag: "DC",
    meaning: "Dead cap from a waived or bought-out player",
    example: "3000000 DC",
  },
  {
    tag: "DC S",
    meaning: "Dead cap from a stretched contract",
    example: "1200000 DC S",
  },
  { tag: "ETO", meaning: "Early termination option", example: "30000000 ETO" },
  { tag: "NG", meaning: "Non-guaranteed", example: "2100000 NG" },
  {
    tag: "PG",
    meaning: "Partially guaranteed. The second number is the guaranteed part.",
    example: "2100000 PG 500000",
  },
  {
    tag: "QO",
    meaning: "Qualifying offer. The player becomes a restricted free agent.",
    example: "6000000 QO",
  },
];

const SPECIAL_CASES: { title: string; body: string }[] = [
  {
    title: "Waived player now on another team",
    body: "use two rows, the dead cap on the team that waived him and his contract on his new team.",
  },
  {
    title: "Salary and dead cap for the same player on the same team",
    body: "use two separate rows. Don't mix them in one row.",
  },
  {
    title: "One contract per player",
    body: "if a player has contracts on two teams, the import can't be confirmed until you fix it.",
  },
];

export default function ImportGuide() {
  return (
    <div className="mt-5 space-y-4 border-t border-brand-border pt-5">
      <div>
        <h3 className="text-sm font-semibold text-brand-dark">
          Import your league
        </h3>
        <p className="mt-1 text-sm text-brand-muted">
          Upload one spreadsheet with every player on every team. You&rsquo;ll
          see a preview before anything is saved.
        </p>

        <ol className="mt-3 space-y-2">
          {STEPS.map((step, index) => (
            <li key={step.text} className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-cta/15 text-[11px] font-bold text-brand-cta-dark">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-brand-dark">
                {step.text}
                {step.code ? (
                  <>
                    {" "}
                    <code className="rounded bg-brand-soft px-1 py-0.5 text-xs font-semibold text-brand-dark">
                      {step.code[0]}
                    </code>
                    , not{" "}
                    <code className="rounded bg-brand-soft px-1 py-0.5 text-xs font-semibold text-brand-dark">
                      {step.code[1]}
                    </code>
                    .
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-3 rounded-lg bg-brand-soft/60 px-3 py-2 text-xs leading-relaxed text-brand-muted">
          Each upload replaces the last one. You can re-upload as often as you
          like before your import deadline. After the deadline, edit single
          contracts in Commissioner Settings.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
          Example
        </p>
        <div className="overflow-x-auto rounded-lg border border-brand-border">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-brand-border bg-brand-soft/60">
                {EXAMPLE_HEADERS.map((header) => (
                  <th
                    key={header}
                    className="whitespace-nowrap px-2.5 py-2 font-semibold text-brand-dark"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {EXAMPLE_ROWS.map((row) => (
                <tr key={row[1]}>
                  {row.map((cell, index) => (
                    <td
                      key={`${row[1]}-${EXAMPLE_HEADERS[index]}`}
                      className="whitespace-nowrap px-2.5 py-1.5 text-brand-muted"
                    >
                      {cell || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
          More detail
        </p>

        <Section title="What these rows show">
          <ul className="space-y-1.5">
            {ROW_MEANINGS.map((row) => (
              <li key={row.player} className="text-sm text-brand-muted">
                <span className="font-semibold text-brand-dark">
                  {row.player}:
                </span>{" "}
                {row.meaning}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Columns">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">
            Required
          </p>
          <p className="mt-1 text-sm text-brand-dark">
            <code className="rounded bg-brand-soft px-1 py-0.5 text-xs font-semibold">
              team
            </code>
            ,{" "}
            <code className="rounded bg-brand-soft px-1 py-0.5 text-xs font-semibold">
              player
            </code>
            ,{" "}
            <code className="rounded bg-brand-soft px-1 py-0.5 text-xs font-semibold">
              bird_years
            </code>{" "}
            and at least one season.
          </p>
          <ul className="mt-2 space-y-1.5">
            {REQUIRED_COLUMNS.map((column) => (
              <li key={column.name} className="text-sm text-brand-muted">
                <span className="font-semibold text-brand-dark">
                  {column.name}:
                </span>{" "}
                {column.note}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-brand-muted">
            Optional
          </p>
          <ul className="mt-1 space-y-1.5">
            {OPTIONAL_COLUMNS.map((column) => (
              <li key={column.name} className="text-sm text-brand-muted">
                <span className="font-semibold text-brand-dark">
                  {column.name}:
                </span>{" "}
                {column.note}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-sm text-brand-muted">
            Column order and capital letters don&rsquo;t matter. Any other
            columns are ignored.
          </p>
        </Section>

        <Section title="Salary tags">
          <p className="text-sm text-brand-muted">
            Write the amount, a space, then the tag. No tag means fully
            guaranteed. Common spellings like{" "}
            <code className="rounded bg-brand-soft px-1 py-0.5 text-xs font-semibold">
              (PO)
            </code>
            , Player Option or Dead Cap also work.
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-brand-border">
            <table className="w-full min-w-[460px] text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border bg-brand-soft/60">
                  <th className="px-2.5 py-2 font-semibold text-brand-dark">
                    Tag
                  </th>
                  <th className="px-2.5 py-2 font-semibold text-brand-dark">
                    Meaning
                  </th>
                  <th className="px-2.5 py-2 font-semibold text-brand-dark">
                    Example
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {TAGS.map((row) => (
                  <tr key={row.tag}>
                    <td className="whitespace-nowrap px-2.5 py-2 font-bold text-brand-dark">
                      {row.tag}
                    </td>
                    <td className="px-2.5 py-2 text-brand-muted">
                      {row.meaning}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 font-medium text-brand-dark">
                      {row.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Special cases">
          <ul className="space-y-2">
            {SPECIAL_CASES.map((row) => (
              <li key={row.title} className="text-sm text-brand-muted">
                <span className="font-semibold text-brand-dark">
                  {row.title}:
                </span>{" "}
                {row.body}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-brand-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 px-3 py-2.5 text-left text-sm font-semibold text-brand-dark transition hover:bg-brand-soft/60"
      >
        {open ? (
          <FiChevronDown className="h-4 w-4 shrink-0 text-brand-muted" />
        ) : (
          <FiChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />
        )}
        {title}
      </button>
      {open ? (
        <div className="border-t border-brand-border px-3 py-3">{children}</div>
      ) : null}
    </div>
  );
}
