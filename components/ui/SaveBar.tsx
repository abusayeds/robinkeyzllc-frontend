"use client";

import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";

/**
 * The settings pages are long enough that a Save button at the very bottom
 * scrolls out of sight while a field at the top is being edited. This sticks
 * to the bottom of the scrolling pane instead, so the button is always within
 * reach and always says whether there is anything to save.
 */
export default function SaveBar({
  dirty,
  saving,
  saved,
  error,
  onSave,
  onDiscard,
  disabled,
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
  onDiscard: () => void;
  disabled?: boolean;
}) {
  const status = error ? (
    <span className="flex items-center gap-1.5 text-red-600" role="alert">
      <FiAlertCircle className="h-4 w-4 shrink-0" />
      {error}
    </span>
  ) : saved ? (
    <span className="flex items-center gap-1.5 text-emerald-700" role="status">
      <FiCheckCircle className="h-4 w-4 shrink-0" />
      Saved.
    </span>
  ) : dirty ? (
    <span className="flex items-center gap-1.5 text-amber-700">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
      Unsaved changes
    </span>
  ) : (
    <span className="text-brand-muted">No changes to save</span>
  );

  // The negative margins cancel the scrolling pane's own padding so the bar
  // spans edge to edge, and the mobile offset keeps it clear of the fixed
  // bottom navigation.
  return (
    <div className="sticky bottom-20 z-30 -mx-4 -mb-4 mt-2 border-t border-brand-border bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6 lg:bottom-0 lg:-mx-8 lg:-mb-8 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-xs font-medium sm:text-sm">{status}</p>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={onDiscard}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={!dirty || saving || disabled}
            onClick={onSave}
            className="rounded-lg bg-brand-cta px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
