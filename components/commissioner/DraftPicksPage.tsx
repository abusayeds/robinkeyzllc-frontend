"use client";

import { useEffect, useState } from "react";
import { FiX, FiChevronRight, FiChevronDown } from "react-icons/fi";
import TeamLogo from "@/components/ui/TeamLogo";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  PICK_TEAMS,
  reassignPick,
  type DraftPickAsset,
} from "@/lib/store/features/draftPicksSlice";

function statusTone(s: DraftPickAsset["status"]) {
  return s === "Unprotected"
    ? "border-brand-cta/40 bg-brand-cta/10 text-brand-cta-dark"
    : "border-purple-200 bg-purple-50 text-purple-700";
}

function ReassignModal({
  pick,
  onClose,
  onSave,
}: {
  pick: DraftPickAsset;
  onClose: () => void;
  onSave: (toTeam: string, reason: string) => void;
}) {
  const [toTeam, setToTeam] = useState(
    PICK_TEAMS.find((t) => t !== pick.currentOwner) ?? PICK_TEAMS[0],
  );
  const [reason, setReason] = useState("");

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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-brand-dark">
            Reassign: {pick.year.slice(0, 4)} {pick.round} Pick
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted transition hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-xs text-brand-muted">
            Currently owned by{" "}
            <span className="font-semibold text-brand-dark">
              {pick.currentOwner}
            </span>
            .
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-dark">
              Transfer to Team
            </label>
            <select
              value={toTeam}
              onChange={(e) => setToTeam(e.target.value)}
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
            >
              {PICK_TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-dark">
              Reason / Trade Reference
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Trade ID or description"
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-brand-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={toTeam === pick.currentOwner}
            onClick={() => onSave(toTeam, reason.trim())}
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reassign Pick
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPickModal({
  pick,
  onClose,
  onSave,
}: {
  pick: DraftPickAsset;
  onClose: () => void;
  onSave: (pickNumber: string, protection: string) => void;
}) {
  const [pickNumber, setPickNumber] = useState(pick.note || "");
  const [protection, setProtection] = useState(pick.status);

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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-brand-dark">
            Edit: {pick.year.slice(0, 4)} {pick.round} Pick
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted transition hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-dark">
              Pick Number / Note
            </label>
            <input
              value={pickNumber}
              onChange={(e) => setPickNumber(e.target.value)}
              placeholder="e.g., Top 10 protected"
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-dark">
              Protection Status
            </label>
            <select
              value={protection}
              onChange={(e) => setProtection(e.target.value as DraftPickAsset["status"])}
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
            >
              <option value="Unprotected">Unprotected</option>
              <option value="Protected">Protected</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-brand-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(pickNumber.trim(), protection)}
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DraftPicksPage() {
  const dispatch = useAppDispatch();
  const { years, picksByYear } = useAppSelector((s) => s.draftPicks);

  const [open, setOpen] = useState<Record<string, boolean>>({
    "2026-2027": true,
  });
  const [reassign, setReassign] = useState<DraftPickAsset | null>(null);
  const [edit, setEdit] = useState<DraftPickAsset | null>(null);

  const toggle = (year: string) =>
    setOpen((o) => ({ ...o, [year]: !o[year] }));

  return (
    <div className="space-y-3 pb-12">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Draft Picks</h1>
        <p className="text-sm text-brand-muted">
          League-wide draft asset inventory. Reassign picks between teams.
        </p>
      </div>

      <div className="hidden grid-cols-[1fr_1fr_1.4fr_1.4fr_1.2fr_auto] gap-4 px-5 text-[11px] font-semibold uppercase tracking-wide text-brand-muted md:grid">
        <span>Year</span>
        <span>Round</span>
        <span>
          Team
          <span className="ml-1 font-normal normal-case">(current owner)</span>
        </span>
        <span>Original Owner</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      {years.map((year) => {
        const picks = picksByYear[year] ?? [];
        const isOpen = open[year];
        return (
          <div
            key={year}
            className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card"
          >
            <button
              type="button"
              onClick={() => toggle(year)}
              className="flex w-full items-center gap-2 px-5 py-3.5 text-left transition hover:bg-brand-soft/40"
            >
              {isOpen ? (
                <FiChevronDown className="h-4 w-4 text-brand-muted" />
              ) : (
                <FiChevronRight className="h-4 w-4 text-brand-muted" />
              )}
              <span className="text-sm font-bold text-brand-dark">{year}</span>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-muted">
                {picks.length} Picks
              </span>
            </button>

            {isOpen ? (
              <ul className="divide-y divide-brand-border border-t border-brand-border">
                {picks.map((p) => (
                  <li
                    key={p.id}
                    className="grid grid-cols-2 items-center gap-3 px-5 py-3 text-sm md:grid-cols-[1fr_1fr_1.4fr_1.4fr_1.2fr_auto] md:gap-4"
                  >
                    <span className="text-brand-muted">{p.year}</span>
                    <span className="text-brand-dark">{p.round}</span>
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        name={p.currentOwner}
                        src={p.currentLogo}
                        className="h-6 w-6"
                      />
                      <div className="leading-tight">
                        <p className="font-semibold text-brand-dark">
                          {p.currentAbbr}
                        </p>
                        <p className="text-xs text-brand-muted">
                          {p.currentOwner}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        name={p.originalOwner}
                        src={p.originalLogo}
                        className="h-6 w-6"
                      />
                      <span className="text-brand-dark">{p.originalOwner}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusTone(
                          p.status,
                        )}`}
                      >
                        {p.status}
                      </span>
                      <span className="text-xs text-brand-muted">
                        {p.note || "—"}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEdit(p)}
                        className="rounded-md border border-brand-border px-3 py-1 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setReassign(p)}
                        className="rounded-md border border-brand-border px-3 py-1 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
                      >
                        Reassign
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}

      {reassign ? (
        <ReassignModal
          pick={reassign}
          onClose={() => setReassign(null)}
          onSave={(toTeam, reason) => {
            dispatch(reassignPick({ id: reassign.id, toTeam, reason }));
            setReassign(null);
          }}
        />
      ) : null}

      {edit ? (
        <EditPickModal
          pick={edit}
          onClose={() => setEdit(null)}
          onSave={(pickNumber, protection) => {
            // Note: Would need to add editPick action to draftPicksSlice
            // For now, just close the modal
            console.log("Edit pick:", edit.id, pickNumber, protection);
            setEdit(null);
          }}
        />
      ) : null}
    </div>
  );
}
