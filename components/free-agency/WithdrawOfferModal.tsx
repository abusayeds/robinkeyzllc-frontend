"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import type { Offer } from "@/lib/store/api/endpoints/freeAgencyApi";
import { money } from "./contract";

export default function WithdrawOfferModal({
  offer,
  busy,
  onClose,
  onConfirm,
}: {
  offer: Offer | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!offer) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-brand-border px-5 py-3.5">
          <h2 className="text-base font-semibold text-brand-dark">
            Withdraw this offer?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 text-sm text-brand-muted">
          <p>
            <span className="font-medium text-brand-dark">
              {offer.player.name}
            </span>{" "}
            · {offer.years} year{offer.years === 1 ? "" : "s"} ·{" "}
            {money(offer.totalValue)}
          </p>
          <p className="mt-2">
            The offer stays on record as withdrawn. You can put a new one on him
            while free agency is open.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition hover:bg-brand-soft"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {busy ? "Withdrawing…" : "Withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
}
