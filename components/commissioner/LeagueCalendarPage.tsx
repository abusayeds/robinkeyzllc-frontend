"use client";

import { useEffect, useState } from "react";
import { FiEdit2, FiInfo, FiPlus, FiX } from "react-icons/fi";
import {
  LuCalendarClock,
  LuFileText,
  LuHandshake,
  LuRepeat,
  LuTrophy,
  LuUsers,
} from "react-icons/lu";
import { GrCircleAlert } from "react-icons/gr";
import { useAppSelector } from "@/lib/store/hooks";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import {
  CALENDAR_PHASES,
  PHASE_COLOR,
  PHASE_LABEL,
  formatEventDate,
  getApiErrorMessage,
  nextSeason,
  toDateInput,
  useCreateCalendarEventMutation,
  useDeleteCalendarEventMutation,
  useLeagueCalendarQuery,
  useRollOverCalendarMutation,
  useUpdateCalendarEventMutation,
  type CalendarEvent,
  type CalendarEventInput,
  type CalendarPhase,
} from "@/lib/store/api";

function getEventIcon(title: string): React.ReactElement {
  const lower = title.toLowerCase();
  if (lower.includes("free agency") || lower.includes("free agent")) {
    return <LuHandshake className="h-3.5 w-3.5" />;
  }
  if (lower.includes("draft")) return <LuUsers className="h-3.5 w-3.5" />;
  if (lower.includes("trade") || lower.includes("negotiat")) {
    return <LuRepeat className="h-3.5 w-3.5" />;
  }
  if (lower.includes("playoff") || lower.includes("finals")) {
    return <LuTrophy className="h-3.5 w-3.5" />;
  }
  if (lower.includes("season") || lower.includes("league year")) {
    return <LuCalendarClock className="h-3.5 w-3.5" />;
  }
  if (lower.includes("deadline") || lower.includes("option")) {
    return <GrCircleAlert className="h-3.5 w-3.5" />;
  }
  return <LuFileText className="h-3.5 w-3.5" />;
}

const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30";

const labelClass = "mb-1 block text-xs font-medium text-brand-dark";

type Draft = {
  title: string;
  phase: CalendarPhase;
  description: string;
  startDate: string;
  endDate: string;
  time: string;
  displayLabel: string;
  isApproximate: boolean;
};

function toDraft(event: CalendarEvent | null): Draft {
  return {
    title: event?.title ?? "",
    phase: event?.phase ?? "contracts",
    description: event?.description ?? "",
    startDate: toDateInput(event?.startDate ?? null),
    endDate: toDateInput(event?.endDate ?? null),
    time: event?.time ?? "",
    displayLabel: event?.displayLabel ?? "",
    isApproximate: event?.isApproximate ?? false,
  };
}

function EventModal({
  editing,
  saving,
  error,
  onClose,
  onSave,
  onDelete,
}: {
  editing: CalendarEvent | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (data: CalendarEventInput) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<Draft>(() => toDraft(editing));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSubmit = form.title.trim().length > 0 && form.startDate.length > 0;

  function submit() {
    // The date input gives yyyy-mm-dd with no zone. It is sent as midnight
    // UTC so the stored day matches what was picked, wherever the user is.
    onSave({
      title: form.title.trim(),
      phase: form.phase,
      description: form.description.trim(),
      startDate: `${form.startDate}T00:00:00.000Z`,
      endDate: form.endDate ? `${form.endDate}T00:00:00.000Z` : null,
      isApproximate: form.isApproximate,
      displayLabel: form.displayLabel.trim() || null,
      time: form.time.trim() || null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={saving ? undefined : onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-brand-dark">
            {editing ? "Edit Event" : "Add Calendar Event"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-brand-muted transition hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
            >
              {error}
            </p>
          ) : null}

          <div>
            <label htmlFor="event-title" className={labelClass}>
              Title
            </label>
            <input
              id="event-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Event title"
              maxLength={120}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="event-start" className={labelClass}>
                Date
              </label>
              <input
                id="event-start"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="event-end" className={labelClass}>
                End date (optional)
              </label>
              <input
                id="event-end"
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => set("endDate", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="event-phase" className={labelClass}>
              Phase
            </label>
            <select
              id="event-phase"
              value={form.phase}
              onChange={(e) => set("phase", e.target.value as CalendarPhase)}
              className={inputClass}
            >
              {CALENDAR_PHASES.map((phase) => (
                <option key={phase} value={phase}>
                  {PHASE_LABEL[phase]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="event-time" className={labelClass}>
              Time (optional)
            </label>
            <input
              id="event-time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              placeholder="e.g. 6:00 PM ET"
              maxLength={20}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="event-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="event-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Brief description of the event."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="rounded-lg bg-brand-soft/50 p-3">
            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={form.isApproximate}
                onChange={(e) => set("isApproximate", e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-cta"
              />
              <span className="text-xs text-brand-dark">
                The date is not fixed yet
                <span className="mt-0.5 block text-brand-muted">
                  The day above is still used for ordering, but the label below
                  is what readers see.
                </span>
              </span>
            </label>
            <div className="mt-2.5">
              <label htmlFor="event-label" className={labelClass}>
                Shown instead of the date (optional)
              </label>
              <input
                id="event-label"
                value={form.displayLabel}
                onChange={(e) => set("displayLabel", e.target.value)}
                placeholder="e.g. Late June 2027"
                maxLength={60}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-brand-border px-5 py-3.5">
          {editing && onDelete ? (
            <button
              type="button"
              disabled={saving}
              onClick={onDelete}
              className="text-sm font-semibold text-red-500 transition hover:underline disabled:opacity-60"
            >
              Delete Event
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit || saving}
              onClick={submit}
              className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeagueCalendarPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);

  const [season, setSeason] = useState<string | undefined>(undefined);
  const [editMode, setEditMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const {
    data: calendar,
    isLoading,
    isError,
    error: loadError,
  } = useLeagueCalendarQuery(
    { leagueId: leagueId as number, season },
    { skip: !leagueId },
  );

  const [createEvent, { isLoading: creating }] =
    useCreateCalendarEventMutation();
  const [updateEvent, { isLoading: updating }] =
    useUpdateCalendarEventMutation();
  const [deleteEvent] = useDeleteCalendarEventMutation();
  const [rollOver, { isLoading: rollingOver }] = useRollOverCalendarMutation();

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to see its calendar.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-20 text-center text-sm font-medium text-red-600">
        {getApiErrorMessage(loadError, "Could not load the calendar.")}
      </p>
    );
  }

  if (isLoading || !calendar) {
    return (
      <p className="py-20 text-center text-sm text-brand-muted">
        Loading calendar…
      </p>
    );
  }

  const events = calendar.events;

  // The button rolls over whichever season is on screen, so it names its
  // target and steps aside once that season exists.
  const upcomingSeason = nextSeason(calendar.season);
  const nextSeasonExists = calendar.seasons.includes(upcomingSeason);

  async function saveNew(data: CalendarEventInput) {
    setModalError(null);
    try {
      await createEvent({
        leagueId: leagueId as number,
        event: { ...data, season: calendar?.season },
      }).unwrap();
      setAddOpen(false);
    } catch (err) {
      setModalError(getApiErrorMessage(err, "Could not add the event."));
    }
  }

  async function saveExisting(data: CalendarEventInput) {
    if (!editing) return;
    setModalError(null);
    try {
      const { season: _season, ...patch } = data;
      await updateEvent({
        leagueId: leagueId as number,
        eventId: editing.id,
        patch,
      }).unwrap();
      setEditing(null);
    } catch (err) {
      setModalError(getApiErrorMessage(err, "Could not save the event."));
    }
  }

  async function remove(eventId: number) {
    setPageError(null);
    setModalError(null);
    try {
      await deleteEvent({ leagueId: leagueId as number, eventId }).unwrap();
      setEditing(null);
    } catch (err) {
      setPageError(getApiErrorMessage(err, "Could not delete the event."));
    }
  }

  async function createNextSeason() {
    setPageError(null);
    try {
      const result = await rollOver({
        leagueId: leagueId as number,
        season: calendar?.season,
      }).unwrap();
      setSeason(result.season);
    } catch (err) {
      setPageError(
        getApiErrorMessage(err, "Could not create the next season."),
      );
    }
  }

  return (
    <div className="space-y-4 pb-12">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">League Calendar</h1>
        <p className="text-sm text-brand-muted">
          Key dates and events for {activeLeague?.name}.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <FiInfo className="h-3.5 w-3.5 shrink-0" />
          {canEdit
            ? "Your league started from the standard AVORA calendar. Adjust any date to suit your league."
            : "These are the dates your commissioner has set for this season."}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={calendar.season}
            onChange={(e) => setSeason(e.target.value)}
            aria-label="Season"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
          >
            {calendar.seasons.map((s) => (
              <option key={s} value={s}>
                {s} Season
              </option>
            ))}
          </select>

          {canEdit ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setModalError(null);
                  setAddOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-cta px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark"
              >
                <FiPlus className="h-4 w-4" />
                Add Event
              </button>
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3.5 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
              >
                <FiEdit2 className="h-3.5 w-3.5" />
                {editMode ? "Done Editing" : "Edit Calendar"}
              </button>
              <button
                type="button"
                onClick={createNextSeason}
                disabled={rollingOver || nextSeasonExists}
                title={
                  nextSeasonExists
                    ? `${upcomingSeason} already has a calendar. Pick it from the list above.`
                    : `Copy the ${calendar.season} dates forward into ${upcomingSeason}`
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3.5 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LuCalendarClock className="h-3.5 w-3.5" />
                {rollingOver ? "Creating…" : `Start ${upcomingSeason}`}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {pageError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
        >
          {pageError}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-brand-forest">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-white">
                <th className="w-12 px-4 py-3">#</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Phase</th>
                {editMode ? (
                  <th className="px-4 py-3 text-right">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-white">
              {events.length === 0 ? (
                <tr>
                  <td
                    colSpan={editMode ? 5 : 4}
                    className="px-4 py-12 text-center text-sm text-brand-muted"
                  >
                    No dates set for {calendar.season} yet.
                  </td>
                </tr>
              ) : (
                events.map((event, index) => (
                  <tr key={event.id} className="hover:bg-brand-soft/30">
                    <td className="px-4 py-3 text-center text-brand-muted">
                      {index + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-sm text-brand-dark">
                        {formatEventDate(event)}
                      </span>
                      {event.time ? (
                        <span className="mt-0.5 block text-[11px] text-brand-muted">
                          {event.time}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center text-brand-muted">
                          {getEventIcon(event.title)}
                        </span>
                        <span className="text-sm font-medium text-brand-dark">
                          {event.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase ${
                          PHASE_COLOR[event.phase]
                        }`}
                      >
                        {PHASE_LABEL[event.phase]}
                      </span>
                    </td>
                    {editMode ? (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setModalError(null);
                              setEditing(event);
                            }}
                            className="rounded-md border border-brand-border px-3 py-1 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(event.id)}
                            className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen ? (
        <EventModal
          editing={null}
          saving={creating}
          error={modalError}
          onClose={() => setAddOpen(false)}
          onSave={saveNew}
        />
      ) : null}

      {editing ? (
        <EventModal
          editing={editing}
          saving={updating}
          error={modalError}
          onClose={() => setEditing(null)}
          onSave={saveExisting}
          onDelete={() => remove(editing.id)}
        />
      ) : null}
    </div>
  );
}
