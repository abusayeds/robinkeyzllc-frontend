import type {
  DraftPick,
  DraftPickInventory,
} from "@/lib/store/api/endpoints/draftApi";

/** Which dot the protection legend shows against a row. */
export type PickProtectionKind = "top10" | "lottery" | "swap" | "unprotected";

export type DraftPickRow = {
  id: number;
  year: number;
  round: string;
  pick: string;
  source: string;
  protectionKind: PickProtectionKind;
  protectionText: string;
  notes: string;
};

/**
 * The legend's four buckets, from the pick's actual terms.
 *
 * Top 10 and the lottery are the two protections the legend names outright;
 * everything else protected is shown as a swap, because a conversion is what
 * the rule book calls it and "swap" is the word on the screen.
 */
function protectionKindOf(pick: DraftPick): PickProtectionKind {
  if (pick.protectionOutcome === "convert") return "swap";
  if (pick.protectedTopN === null) return "unprotected";
  if (pick.protectedTopN <= 10) return "top10";
  return "lottery";
}

/** Rules 12.5-12.7 in one line, the way the Protection column wants it. */
function protectionTextOf(pick: DraftPick): string {
  if (pick.protectedTopN === null) return "Unprotected";

  const parts = [`Top ${pick.protectedTopN} protected`];

  if (pick.protectionOutcome === "rollover") {
    parts.push(
      pick.protectionFinalYear
        ? `rolls over through ${pick.protectionFinalYear}`
        : "rolls over",
    );
  } else if (pick.protectionOutcome === "convert") {
    parts.push("converts to another pick");
  } else if (pick.protectionOutcome === "end") {
    parts.push("obligation ends if it conveys");
  }

  if (pick.owedToTeam) parts.push(`owed to ${pick.owedToTeam.abbr}`);

  return parts.join(" · ");
}

/**
 * One team's picks, in the shape the table draws.
 *
 * The pick **number** inside a round is not known until the draft order is
 * built, and the order is a separate thing from ownership — so it reads TBD
 * rather than guessing a slot the commissioner has not set.
 */
export function pickRowsForTeam(
  inventory: DraftPickInventory | undefined,
  teamId: number | null,
): DraftPickRow[] {
  if (!inventory || !teamId) return [];

  const rows: DraftPickRow[] = [];

  for (const year of inventory.years) {
    for (const pick of year.picks) {
      if (pick.currentTeam.id !== teamId) continue;

      const notes: string[] = [];
      if (pick.note) notes.push(pick.note);
      if (pick.isFrozen && pick.frozenInSeason) {
        notes.push(`Frozen since ${pick.frozenInSeason}`);
      }
      if (pick.movedToEndOfRound) notes.push("Placed at the end of the round");
      if (!pick.isTradeable && pick.untradeableMessage) {
        notes.push(pick.untradeableMessage);
      }

      rows.push({
        id: pick.id,
        year: pick.seasonStartYear,
        round: pick.roundLabel,
        pick: pick.usedAt ? "Used" : "TBD",
        source:
          pick.originalTeam.id === teamId
            ? "Own pick"
            : `via ${pick.originalTeam.abbr}`,
        protectionKind: protectionKindOf(pick),
        protectionText: protectionTextOf(pick),
        notes: notes.join(" · "),
      });
    }
  }

  return rows.sort(
    (a, b) => a.year - b.year || a.round.localeCompare(b.round),
  );
}
