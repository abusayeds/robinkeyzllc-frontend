
"use client";

import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import {
  DRAFT_TYPE_LABEL,
  SCORING_TYPE_LABEL,
  VISIBILITY_LABEL,
  getApiErrorMessage,
  useCreateLeagueMutation,
  type ApiLeague,
  type DraftType,
  type LeagueVisibility,
  type ScoringType,
} from "@/lib/store/api";

const SCORING_TYPES = Object.keys(SCORING_TYPE_LABEL) as ScoringType[];
const DRAFT_TYPES = Object.keys(DRAFT_TYPE_LABEL) as DraftType[];
const VISIBILITIES = Object.keys(VISIBILITY_LABEL) as LeagueVisibility[];

const fieldClass =
  "w-full rounded-lg border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-dark outline-none transition placeholder:text-brand-muted/70 focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20";

const labelClass = "mb-1.5 block text-sm font-medium text-brand-dark";

const emptyForm = {
  name: "",
  teamCount: 12 as number | "",
  scoringType: SCORING_TYPES[0],
  draftType: DRAFT_TYPES[0],
  visibility: VISIBILITIES[0],
};

export default function CreateLeagueModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (league: ApiLeague) => void;
}) {
  const [createLeague, { isLoading }] = useCreateLeagueMutation();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setForm(emptyForm);
    setError(null);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = form.name.trim();

    if (!name) {
      setError("Please enter a league name.");
      return;
    }

    const teamCount = Number(form.teamCount);

    if (
      form.teamCount === "" ||
      !Number.isInteger(teamCount) ||
      teamCount < 1 ||
      teamCount > 30
    ) {
      setError("Number of teams must be a whole number between 1 and 30.");
      return;
    }

    try {
      const league = await createLeague({
        ...form,
        name,
        teamCount,
      }).unwrap();

      onCreated(league);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={isLoading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-league-title"
    >
      <div
        className="max-h-[90vh] supports-[height:100dvh]:max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-card md:p-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2
              id="create-league-title"
              className="text-lg font-bold text-brand-dark"
            >
              Create a League
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
            >
              {error}
            </p>
          )}

          <div>
            <label htmlFor="league-name" className={labelClass}>
              League name
            </label>

            <input
              id="league-name"
              className={fieldClass}
              placeholder="e.g. Downtown Dynasty"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              required
              maxLength={80}
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="team-count" className={labelClass}>
                Number of teams
              </label>

              <input
                id="team-count"
                type="number"
                inputMode="numeric"
                className={fieldClass}
                value={form.teamCount}
                min={1}
                max={30}
                step={1}
                onChange={(e) => {
                  const value = e.target.value;

                  setForm((prev) => ({
                    ...prev,
                    teamCount: value === "" ? "" : Number(value),
                  }));
                }}
                required
              />

              <p className="mt-1 text-xs text-brand-muted">
                Enter any whole number from 1 to 30. You can add teams later
                from the league office.
              </p>
            </div>

            <div>
              <label htmlFor="scoring-type" className={labelClass}>
                Scoring type
              </label>

              <select
                id="scoring-type"
                className={fieldClass}
                value={form.scoringType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    scoringType: e.target.value as ScoringType,
                  }))
                }
              >
                {SCORING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {SCORING_TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="draft-type" className={labelClass}>
                Draft type
              </label>

              <select
                id="draft-type"
                className={fieldClass}
                value={form.draftType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    draftType: e.target.value as DraftType,
                  }))
                }
              >
                {DRAFT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {DRAFT_TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="visibility" className={labelClass}>
                Visibility
              </label>

              <select
                id="visibility"
                className={fieldClass}
                value={form.visibility}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    visibility: e.target.value as LeagueVisibility,
                  }))
                }
              >
                {VISIBILITIES.map((option) => (
                  <option key={option} value={option}>
                    {VISIBILITY_LABEL[option]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-brand-border px-4 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-brand-cta px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Creating…" : "Create League"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
