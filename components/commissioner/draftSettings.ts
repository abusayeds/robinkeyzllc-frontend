import type {
  DraftOrderSlot,
  DraftStatus,
} from "@/lib/store/api/endpoints/draftApi";

/**
 * The pieces the two draft settings pages share.
 *
 * The pages themselves stay separate, because a startup draft is edited as a
 * drag list and a rookie draft as a paged table, but the conversions between
 * what the form holds and what the API takes are the same on both.
 */

export const DRAFT_STATUSES: DraftStatus[] = [
  "scheduled",
  "inProgress",
  "complete",
];

export const DRAFT_STATUS_LABEL: Record<DraftStatus, string> = {
  scheduled: "Scheduled",
  inProgress: "In progress",
  complete: "Complete",
};

export const DRAFT_STATUS_TONE: Record<DraftStatus, string> = {
  scheduled: "bg-brand-soft text-brand-muted",
  inProgress: "bg-emerald-100 text-emerald-700",
  complete: "bg-brand-cta/15 text-brand-cta-dark",
};

/** Splits a stored instant into the date and time inputs, in local time. */
export function splitStartsAt(startsAt: string | null) {
  if (!startsAt) return { date: "", time: "" };

  const when = new Date(startsAt);
  if (Number.isNaN(when.getTime())) return { date: "", time: "" };

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(
      when.getDate(),
    )}`,
    time: `${pad(when.getHours())}:${pad(when.getMinutes())}`,
  };
}

/**
 * Puts them back together. A date with no time starts at midnight; no date at
 * all clears the setting rather than saving today by accident.
 */
export function toIsoStartsAt(date: string, time: string): string | null {
  if (!date) return null;
  const when = new Date(`${date}T${time || "00:00"}`);
  return Number.isNaN(when.getTime()) ? null : when.toISOString();
}

/**
 * The timer is stored in seconds and entered in whichever unit reads better:
 * a rookie draft runs on minutes, a startup draft often on hours.
 */
export function secondsToPickTimer(seconds: number): {
  value: number;
  unit: "minutes" | "hours";
} {
  if (seconds >= 3600 && seconds % 3600 === 0) {
    return { value: seconds / 3600, unit: "hours" };
  }
  return { value: Math.max(Math.round(seconds / 60), 1), unit: "minutes" };
}

export function pickTimerToSeconds(
  value: string,
  unit: "minutes" | "hours",
): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 120;
  const seconds = unit === "hours" ? n * 3600 : n * 60;
  // The API refuses anything under ten seconds or over a day, so the form
  // never sends a value it knows will be rejected.
  return Math.min(Math.max(Math.round(seconds), 10), 86400);
}

/**
 * The first round's seat order, which is what the order editors work on.
 *
 * The seat, not the picker: a traded pick is picked by someone else, and
 * reading the picker here would give one team two seats and another none.
 */
export function firstRoundTeamIds(order: DraftOrderSlot[]): number[] {
  return order
    .filter((slot) => slot.round === 1)
    .sort((a, b) => a.overall - b.overall)
    .map((slot) => slot.originalTeam.id);
}
